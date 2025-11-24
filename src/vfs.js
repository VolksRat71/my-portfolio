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
        path: '/hello.py',
        content: `# Sample Python Program
# Try running this in the Python shell!

def greet(name):
    """Return a friendly greeting."""
    return f"Hello, {name}! Welcome to the VFS."

def factorial(n):
    """Calculate factorial recursively."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Try these commands:
# greet("World")
# factorial(5)
# [factorial(i) for i in range(1, 6)]

print("Python program loaded!")
print("Try: greet('World') or factorial(5)")
`
      },
      {
        path: '/demo.js',
        content: `// Sample Node.js Program
// Try pasting this into the Node shell!

// Simple class example
class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
  multiply(a, b) { return a * b; }
  divide(a, b) { return b !== 0 ? a / b : 'Error: Division by zero'; }
}

// Array utilities
const sum = arr => arr.reduce((a, b) => a + b, 0);
const average = arr => sum(arr) / arr.length;

// Fibonacci generator
function* fibonacci(n) {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Try these:
// const calc = new Calculator()
// calc.add(5, 3)
// sum([1, 2, 3, 4, 5])
// [...fibonacci(10)]

console.log('Demo loaded! Try: const calc = new Calculator(); calc.add(5, 3)');
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
