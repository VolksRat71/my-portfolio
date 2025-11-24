// Virtual File System with IndexedDB persistence

const DB_NAME = 'PortfolioVFS';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class VirtualFileSystem {
  constructor() {
    this.db = null;
    this.ready = false;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.ready = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          objectStore.createIndex('parentPath', 'parentPath', { unique: false });
        }
      };
    });
  }

  async ensureReady() {
    if (!this.ready) {
      await this.initPromise;
    }
  }

  // Core file operations
  async readFile(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(path);

      request.onsuccess = () => {
        const file = request.result;
        if (!file) {
          reject(new Error(`cat: ${path}: No such file or directory`));
        } else if (file.type === 'directory') {
          reject(new Error(`cat: ${path}: Is a directory`));
        } else {
          resolve(file.content);
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to read file: ${path}`));
      };
    });
  }

  async writeFile(path, content) {
    await this.ensureReady();
    path = this.normalizePath(path);

    const parentPath = this.getParentPath(path);

    // Check if parent directory exists (only if not root)
    if (parentPath !== '/') {
      const parentExists = await this.exists(parentPath);
      if (!parentExists) {
        throw new Error(`cannot create ${path}: No such file or directory`);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      const file = {
        path,
        parentPath,
        type: 'file',
        content: String(content),
        modified: new Date().toISOString()
      };

      const request = objectStore.put(file);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to write file: ${path}`));
      };
    });
  }

  async deleteFile(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    // Protected files that cannot be deleted
    const protectedFiles = [
      '/profile.json',
      '/contact.txt',
      '/experience.md',
      '/projects.js',
      '/README.md',
      '/hello.py',
      '/demo.js'
    ];

    if (protectedFiles.includes(path)) {
      throw new Error(`rm: cannot remove '${path}': File is protected`);
    }

    // Check if exists first
    const exists = await this.exists(path);
    if (!exists) {
      throw new Error(`rm: cannot remove '${path}': No such file or directory`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(path);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete file: ${path}`));
      };
    });
  }

  async exists(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(path);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  }

  async stat(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(path);

      request.onsuccess = () => {
        const file = request.result;
        if (!file) {
          reject(new Error(`stat: cannot stat '${path}': No such file or directory`));
        } else {
          resolve({
            isFile: () => file.type === 'file',
            isDirectory: () => file.type === 'directory',
            size: file.content ? file.content.length : 0,
            modified: file.modified,
            path: file.path
          });
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to stat: ${path}`));
      };
    });
  }

  // Directory operations
  async mkdir(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    const parentPath = this.getParentPath(path);

    // Check if parent directory exists
    if (parentPath !== '/') {
      const parentExists = await this.exists(parentPath);
      if (!parentExists) {
        throw new Error(`mkdir: cannot create directory '${path}': No such file or directory`);
      }
    }

    // Check if already exists
    const exists = await this.exists(path);
    if (exists) {
      throw new Error(`mkdir: cannot create directory '${path}': File exists`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      const dir = {
        path,
        parentPath,
        type: 'directory',
        content: null,
        modified: new Date().toISOString()
      };

      const request = objectStore.put(dir);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to create directory: ${path}`));
      };
    });
  }

  async readdir(path = '/') {
    await this.ensureReady();
    path = this.normalizePath(path);

    // Ensure path exists
    const exists = await this.exists(path);
    if (!exists) {
      throw new Error(`ls: cannot access '${path}': No such file or directory`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('parentPath');
      const request = index.getAll(path);

      request.onsuccess = () => {
        const files = request.result;
        resolve(files);
      };

      request.onerror = () => {
        reject(new Error(`Failed to read directory: ${path}`));
      };
    });
  }

  async rmdir(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    // Check if directory is empty
    const contents = await this.readdir(path);
    if (contents.length > 0) {
      throw new Error(`rmdir: failed to remove '${path}': Directory not empty`);
    }

    return this.deleteFile(path);
  }

  // Utility methods
  getParentPath(path) {
    if (path === '/') return '/';
    const parts = path.split('/').filter(p => p);
    if (parts.length === 1) return '/';
    return '/' + parts.slice(0, -1).join('/');
  }

  normalizePath(path) {
    // Handle relative paths (prepend /)
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    // Remove trailing slashes except for root
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path;
  }

  // Create a file with empty content (like touch)
  async touch(path) {
    await this.ensureReady();
    path = this.normalizePath(path);

    // If file exists, just update modified time
    const exists = await this.exists(path);
    if (exists) {
      const content = await this.readFile(path);
      await this.writeFile(path, content);
    } else {
      // Create new empty file
      await this.writeFile(path, '');
    }
  }

  // Initialize with default files from portfolioData
  async initializeDefaults(portfolioData) {
    await this.ensureReady();

    // Create root directory
    const rootExists = await this.exists('/');
    if (!rootExists) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.put({
          path: '/',
          parentPath: null,
          type: 'directory',
          content: null,
          modified: new Date().toISOString()
        });
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    }

    // Default files matching the existing terminal files
    const defaults = [
      {
        path: '/profile.json',
        content: JSON.stringify({
          name: portfolioData.profile.name,
          role: portfolioData.profile.role,
          tagline: portfolioData.profile.tagline,
          location: portfolioData.profile.location,
          bio: portfolioData.profile.bio,
          social: portfolioData.profile.social
        }, null, 2)
      },
      {
        path: '/contact.txt',
        content: `Email: ${portfolioData.profile.social.email}
GitHub: ${portfolioData.profile.social.github}
LinkedIn: ${portfolioData.profile.social.linkedin}

${portfolioData.profile.name}
${portfolioData.profile.role}
${portfolioData.profile.location}`
      },
      {
        path: '/experience.md',
        content: portfolioData.experience.map(exp =>
          `## ${exp.company}\n**${exp.role}** (${exp.period})\n${exp.location ? `**Location:** ${exp.location}\n` : ''}${exp.details.map(d => `• ${d}`).join('\n')}`
        ).join('\n\n')
      },
      {
        path: '/projects.js',
        content: portfolioData.projects.map((proj, i) =>
          `const project${i + 1} = {\n  title: "${proj.title}",\n  tech: [${proj.tech.map(t => `"${t}"`).join(', ')}],\n  description: "${proj.description}"\n};`
        ).join('\n\n')
      },
      {
        path: '/README.md',
        content: `# Portfolio Terminal

Welcome! This is an interactive terminal interface.

## Available Files
- profile.json - Personal information
- contact.txt - Contact details
- experience.md - Work experience
- projects.js - Project portfolio
- hello.py - Sample Python program
- demo.js - Sample Node.js program

## Shell Commands
Try: ls, cat <file>, echo, touch, rm, mkdir

## Interactive Shells
- \`python\` - Start Python REPL
- \`node\` - Start Node.js REPL

Try running the sample programs!
`
      },
      {
        path: '/vehicle_race.py',
        content: `# vehicle_race.py

import random

def clamp01(x):
    return max(0.0, min(1.0, x))

def rr(a, b):
    return random.random() * (b - a) + a

# -------------------------------
# Vehicle & Track Models
# -------------------------------

class Vehicle:
    def __init__(self, name, speed, accel, handling):
        self.name = name
        self.speed = speed
        self.accel = accel
        self.handling = handling
        self.score = 0.0

    @staticmethod
    def random(name):
        return Vehicle(
            name=name,
            speed=random.random(),
            accel=random.random(),
            handling=random.random()
        )

class Track:
    def __init__(self, turns=0.5, straights=0.5, surface=0.5):
        self.turns = turns
        self.straights = straights
        self.surface = surface

    @staticmethod
    def random():
        return Track(
            turns=random.random(),
            straights=random.random(),
            surface=random.random()
        )

# -------------------------------
# Race Logic
# -------------------------------

def compute_performance(vehicle, track):
    """
    Fictional scoring formula.
    """
    v = vehicle
    t = track

    score = 0
    score += v.speed * t.straights * 1.4
    score += v.accel * (1 - t.surface) * 1.3
    score += v.handling * t.turns * 1.5

    # Bonus if well-rounded
    avg = (v.speed + v.accel + v.handling) / 3
    balance = 1 - (
        abs(v.speed - avg) +
        abs(v.accel - avg) +
        abs(v.handling - avg)
    ) / 3
    score += balance * 0.4

    return score

def race(vehicles, track):
    results = []
    for v in vehicles:
        v.score = compute_performance(v, track)
        results.append((v.score, v))
    return sorted(results, key=lambda x: -x[0])

# -------------------------------
# Main Simulation
# -------------------------------

def run_race_sim(rounds=3, vehicle_count=6):
    vehicles = [Vehicle.random(f"Car {i + 1}") for i in range(vehicle_count)]

    print("")
    print("==================================================")
    print("                VEHICLE RACE SIMULATION           ")
    print("==================================================")

    for i in range(1, rounds + 1):
        track = Track.random()
        results = race(vehicles, track)

        print("")
        print(f"--------------------------------------------------")
        print(f" Race {i}")
        print(f"--------------------------------------------------")
        print(f"    Track Conditions")
        print(f"      Turns      : {track.turns:.2f}")
        print(f"      Straights  : {track.straights:.2f}")
        print(f"      Surface    : {track.surface:.2f}")
        print("")
        print("    Results")
        print("      Position   Vehicle     Score")

        for pos, (score, v) in enumerate(results, start=1):
            # Align columns
            pos_str = str(pos).rjust(3)
            name_str = v.name.ljust(10)
            score_str = f"{score:.3f}".rjust(7)

            print(f"      {pos_str}        {name_str}  {score_str}")

    print("")
    print("==================================================")
    print(" Simulation complete")
    print("==================================================")
    print("")


# Auto-run
run_race_sim()
`
      },
      {
        path: '/biologySim.js',
        content: `// biologySim.js
// Fake biological generations with genetics + environment variables.

// ----------------------
// "Constructor" classes
// ----------------------

// Each organism has a small genome (traits 0–1) and a fitness score.
class Organism {
  constructor(id, genes, generation) {
    this.id = id;                 // numeric id
    this.genes = genes;           // { speed, size, camouflage }
    this.generation = generation; // generation number
    this.fitness = 0;             // computed later
  }

  // Make a random organism (used for the first generation).
  static random(id, generation = 0) {
    return new Organism(
      id,
      {
        speed: Math.random(),
        size: Math.random(),
        camouflage: Math.random()
      },
      generation
    );
  }
}

// Environment variables that influence fitness.
// Values go from 0–1 for simplicity.
class Environment {
  constructor(temperature = 0.5, food = 0.5, predators = 0.5) {
    this.temperature = temperature;
    this.food = food;
    this.predators = predators;
  }

  // Slightly change the environment over time.
  mutate(strength = 0.1) {
    this.temperature = clamp01(this.temperature + randRange(-strength, strength));
    this.food        = clamp01(this.food + randRange(-strength, strength));
    this.predators   = clamp01(this.predators + randRange(-strength, strength));
  }
}

// ----------------------
// Utility functions
// ----------------------

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Simple "roulette wheel" selection based on fitness.
function selectByFitness(population) {
  const totalFitness = population.reduce((sum, o) => sum + o.fitness, 0) || 1e-6;

  let r = Math.random() * totalFitness;
  for (const org of population) {
    r -= org.fitness;
    if (r <= 0) return org;
  }
  // Fallback
  return population[population.length - 1];
}

// ----------------------
// Genetics + fitness
// ----------------------

// How good an organism is in this environment.
function computeFitness(organism, env) {
  const g = organism.genes;

  // Example "biology":
  // - High speed + medium size helps when predators are high.
  // - Bigger size is good when food is abundant.
  // - More camouflage is valuable with predators.
  // - Being too big is bad when food is low.

  let fitness = 0;

  // Speed & predators
  fitness += g.speed * env.predators * 1.5;

  // Size & food
  fitness += g.size * env.food * 1.2;

  // Camouflage & predators
  fitness += g.camouflage * env.predators * 1.0;

  // Penalty for being big when food is scarce
  fitness -= g.size * (1 - env.food) * 0.8;

  // Small bonus for balanced traits
  const balance = 1 - (Math.abs(g.speed - g.size) +
                       Math.abs(g.speed - g.camouflage) +
                       Math.abs(g.size  - g.camouflage)) / 3;
  fitness += balance * 0.5;

  // Ensure non-negative
  return Math.max(0.0001, fitness);
}

// Mix genes from two parents + mutation.
function reproduce(parentA, parentB, id, generation, mutationRate = 0.05, mutationStrength = 0.15) {
  const childGenes = {};

  for (const key of Object.keys(parentA.genes)) {
    // Basic "crossover": average of parents
    let value = (parentA.genes[key] + parentB.genes[key]) / 2;

    // Random mutation
    if (Math.random() < mutationRate) {
      value += randRange(-mutationStrength, mutationStrength);
    }

    childGenes[key] = clamp01(value);
  }

  return new Organism(id, childGenes, generation);
}

// ----------------------
// Population management
// ----------------------

function createInitialPopulation(size) {
  const population = [];
  for (let i = 0; i < size; i++) {
    population.push(Organism.random(i, 0));
  }
  return population;
}

function evaluatePopulation(population, env) {
  for (const org of population) {
    org.fitness = computeFitness(org, env);
  }
}

function createNextGeneration(population, env, generation, size) {
  // Evaluate fitness for selection
  evaluatePopulation(population, env);

  const next = [];
  for (let i = 0; i < size; i++) {
    const parentA = selectByFitness(population);
    const parentB = selectByFitness(population);
    const child = reproduce(parentA, parentB, i, generation);
    next.push(child);
  }
  return next;
}

// ----------------------
// Stats + "display"
// ----------------------


function logGenerationStats(population, env, generationIndex) {
  const n = population.length;

  let avgSpeed = 0, avgSize = 0, avgCamo = 0, avgFitness = 0;
  for (const o of population) {
    avgSpeed   += o.genes.speed;
    avgSize    += o.genes.size;
    avgCamo    += o.genes.camouflage;
    avgFitness += o.fitness;
  }

  avgSpeed   /= n;
  avgSize    /= n;
  avgCamo    /= n;
  avgFitness /= n;

  console.log("");
  console.log("==================================================");
  console.log("                 GENERATION " + generationIndex);
  console.log("==================================================");

  console.log("    Environment");
  console.log("      Temperature : " + env.temperature.toFixed(2));
  console.log("      Food        : " + env.food.toFixed(2));
  console.log("      Predators   : " + env.predators.toFixed(2));

  console.log("");
  console.log("    Average Traits");
  console.log("      Speed       : " + avgSpeed.toFixed(3));
  console.log("      Size        : " + avgSize.toFixed(3));
  console.log("      Camouflage  : " + avgCamo.toFixed(3));

  console.log("");
  console.log("    Average Fitness");
  console.log("      Fitness     : " + avgFitness.toFixed(3));
  console.log("");
}

function echoOrganisms(population, max = 5) {
  console.log("    Sample Organisms");
  console.log("      Showing " + max + " of " + population.length);

  population.slice(0, max).forEach((o, i) => {
    console.log("");
    console.log("      Organism #" + i + "  (Generation " + o.generation + ")");
    console.log("        Speed      : " + o.genes.speed.toFixed(3));
    console.log("        Size       : " + o.genes.size.toFixed(3));
    console.log("        Camouflage : " + o.genes.camouflage.toFixed(3));
    console.log("        Fitness    : " + o.fitness.toFixed(3));
  });

  console.log("");
}

// ----------------------
// Main simulation driver
// ----------------------

function runSimulation({
  populationSize = 50,
  generations = 3,
  envStart = new Environment(0.4, 0.7, 0.6),
  envDriftStrength = 0.05
} = {}) {
  let env = envStart;
  let population = createInitialPopulation(populationSize);

  // Evaluate starting population
  evaluatePopulation(population, env);
  logGenerationStats(population, env, 0);
  echoOrganisms(population);

  for (let gen = 1; gen <= generations; gen++) {
    // Environment drifts a bit each generation
    env.mutate(envDriftStrength);

    // Build the next generation
    population = createNextGeneration(population, env, gen, populationSize);

    // Evaluate + log
    evaluatePopulation(population, env);
    logGenerationStats(population, env, gen);
    echoOrganisms(population);
  }
}

// Actually run it when file is executed directly.
runSimulation();
`
      }
    ];

    // Only create files if they don't exist
    for (const file of defaults) {
      const exists = await this.exists(file.path);
      if (!exists) {
        await this.writeFile(file.path, file.content);
      }
    }
  }

  // Clear all data (for testing)
  async clear() {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear VFS'));
      };
    });
  }
}

// Create singleton instance
const vfs = new VirtualFileSystem();

export default vfs;
