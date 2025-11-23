import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { audioSynth } from './AudioSynth';
import { portfolioData } from './contentData';

// Standard commands shown in regular help
const STANDARD_COMMANDS = ['help', 'ls', 'cd', 'cat', 'clear', 'neofetch', 'reboot', 'contact', 'open', 'whoami', 'exit', 'echo'];

// Easter egg commands shown in help -a
const EASTER_EGG_COMMANDS = ['pwd', 'date', 'history', 'alias', 'env', 'printenv', 'man', 'sudo', 'cowsay', 'sl', 'matrix', 'hack', 'hacker', 'git', 'npm', 'node', 'python', 'curl', 'konami', 'secret', 'easteregg', 'hire', 'say', 'weather', 'uptime', 'free'];

// All commands combined
const ALL_COMMANDS = [...STANDARD_COMMANDS, ...EASTER_EGG_COMMANDS];

const FILES = ['profile.json', 'experience.md', 'projects.js', 'contact.txt'];
const DIRS = ['profile', 'experience', 'projects', 'contact'];
const OPEN_TARGETS = ['linkedin', 'github', 'email'];

const TerminalComponent = ({ onNavigate, activeTab, onClose, isClosing, onAnimationEnd, onReboot }) => {
  const [input, setInput] = useState('');
  const isMobile = window.innerWidth <= 768;
  const welcomeMessage = isMobile
    ? 'Welcome to the interactive terminal. Type "help" for commands.\n\nTip: Swipe right anywhere to autocomplete suggestions.'
    : 'Welcome to the interactive terminal. Type "help" for commands.';
  const [history, setHistory] = useState([
    { type: 'output', content: welcomeMessage }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');
  const [touchStartX, setTouchStartX] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null }); // null means centered
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRecentering, setIsRecentering] = useState(false);
  const [visualViewportHeight, setVisualViewportHeight] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);
  const terminalRef = useRef(null);
  const initialViewportHeight = useRef(window.visualViewport?.height || window.innerHeight);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Track visual viewport height for mobile
  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport && window.innerWidth <= 768) {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight.current - currentHeight;

        // Store visual viewport height for mobile
        setVisualViewportHeight(currentHeight);

        // If viewport height decreased by more than 150px, keyboard is likely open
        if (heightDiff > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
        }
      }
    };

    // Initialize on mount for mobile
    if (window.innerWidth <= 768) {
      handleViewportResize();
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      };
    }
  }, []);

  useEffect(() => {
    if (input) {
      // First, check command history for matches (zsh-autosuggestions style)
      // Search from most recent to oldest
      const historyMatch = [...commandHistory].reverse().find(h => h.startsWith(input) && h !== input);

      if (historyMatch) {
        setSuggestion(historyMatch.slice(input.length));
        return;
      }

      // Fall back to static command/file/dir suggestions
      const parts = input.split(' ');
      const cmd = parts[0];
      const arg = parts.slice(1).join(' ');

      if (parts.length === 1) {
        // Suggest commands - prioritize standard commands, then easter eggs
        const standardMatch = STANDARD_COMMANDS.find(c => c.startsWith(cmd));
        const easterEggMatch = EASTER_EGG_COMMANDS.find(c => c.startsWith(cmd));
        const match = standardMatch || easterEggMatch;

        if (match && match !== cmd) {
          setSuggestion(match.slice(cmd.length));
        } else {
          setSuggestion('');
        }
      } else if (['cd', 'cat'].includes(cmd)) {
        // Suggest files/dirs
        const options = cmd === 'cd' ? DIRS : FILES;
        const match = options.find(o => o.startsWith(arg));
        if (match && match !== arg) {
          setSuggestion(match.slice(arg.length));
        } else {
          setSuggestion('');
        }
      } else if (cmd === 'open') {
        // Suggest open targets
        const match = OPEN_TARGETS.find(o => o.startsWith(arg));
        if (match && match !== arg) {
          setSuggestion(match.slice(arg.length));
        } else {
          setSuggestion('');
        }
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  }, [input, commandHistory]);

  // Helper function to convert weather codes to conditions
  const getWeatherCondition = (code) => {
    const conditions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return conditions[code] || 'Unknown';
  };

  const handleCommand = (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let response = '';

    switch (command) {
      case 'help':
        if (args[0] === '-a' || args[0] === '--all') {
          response = `Available commands:
  help          - Show this help message
  help -a       - Show all commands (including easter eggs)
  ls            - List available files
  cat <file>    - Display file contents
  cd <section>  - Navigate to a page section
  contact       - View contact information
  open <target> - Open links (linkedin, github, email)
  whoami        - Display current user information
  echo <text>   - Print text to the terminal
  neofetch      - Display system information
  reboot        - Reboot the system
  exit          - Close the terminal
  clear         - Clear terminal history

Easter Egg Commands:
  pwd           - Print working directory
  date          - Display current date and time
  history       - Show command history
  alias         - List command aliases
  env/printenv  - Show environment variables
  man <cmd>     - Show manual for command
  sudo <cmd>    - Run command as superuser
  cowsay <text> - ASCII cow says something
  sl            - Steam locomotive (typo of ls)
  matrix        - Matrix effect
  hack/hacker   - Hacker simulator
  git <cmd>     - Git commands
  npm <cmd>     - NPM commands
  node -v       - Show Node version
  python --version - Show Python version
  curl <url>    - Fetch URL
  konami        - Konami code easter egg
  secret        - Find the secret
  easteregg     - Another easter egg
  hire me       - Recruiting message
  say <text>    - Text-to-speech style output
  weather       - Check weather at your location
  uptime        - System uptime
  free          - Memory usage`;
        } else {
          response = `Available commands:
  help          - Show this help message
  help -a       - Show all commands (including easter eggs)
  ls            - List available files
  cat <file>    - Display file contents
  cd <section>  - Navigate to a page section
  contact       - View contact information
  open <target> - Open links (linkedin, github, email)
  whoami        - Display current user information
  echo <text>   - Print text to the terminal
  neofetch      - Display system information
  reboot        - Reboot the system
  exit          - Close the terminal
  clear         - Clear terminal history

Hint: Try 'help -a' to see hidden commands!`;
        }
        break;
      case 'ls':
        response = FILES.join('\n');
        break;
      case 'reboot':
        response = 'Rebooting system...';
        setTimeout(() => {
          onReboot();
        }, 1000);
        break;
      case 'contact':
        response = `
┌────────────────────────────────────────┐
│           CONTACT INFORMATION          │
├────────────────────────────────────────┤
│                                        │
│  Name:     ${portfolioData.profile.name.padEnd(27)} │
│  Role:     ${portfolioData.profile.role.padEnd(27)} │
│  Location: ${portfolioData.profile.location.padEnd(27)} │
│                                        │
│  Links:                                │
│    > open linkedin                     │
│    > open github                       │
│    > open email                        │
│                                        │
└────────────────────────────────────────┘`;
        break;
      case 'open':
        if (args.length === 0) {
          response = 'Usage: open <target>\nAvailable targets: linkedin, github, email';
        } else {
          const target = args[0].toLowerCase();
          if (target === 'linkedin') {
            window.open(portfolioData.profile.social.linkedin, '_blank');
            response = 'Opening LinkedIn profile in new tab...';
          } else if (target === 'github') {
            window.open(portfolioData.profile.social.github, '_blank');
            response = 'Opening GitHub profile in new tab...';
          } else if (target === 'email') {
            window.open(`mailto:${portfolioData.profile.social.email}`, '_blank');
            response = `Opening email client to ${portfolioData.profile.social.email}...`;
          } else {
            response = `Unknown target: ${target}\nAvailable targets: linkedin, github, email`;
          }
        }
        break;
      case 'cat':
        if (args.length === 0) {
          response = 'Usage: cat <file>';
        } else {
          const target = args[0].replace('.json', '').replace('.md', '').replace('.js', '').replace('.txt', '');
          if (target === 'profile') {
            response = `{
  "name": "${portfolioData.profile.name}",
  "role": "${portfolioData.profile.role}",
  "tagline": "${portfolioData.profile.tagline}",
  "location": "${portfolioData.profile.location}",
  "bio": "${portfolioData.profile.bio}",
  "social": {
    "linkedin": "${portfolioData.profile.social.linkedin}",
    "github": "${portfolioData.profile.social.github}",
    "email": "${portfolioData.profile.social.email}"
  }
}`;
          } else if (target === 'experience') {
            response = portfolioData.experience.map((exp, i) =>
              `## ${exp.company}\n**${exp.role}** (${exp.period})\n${exp.location ? `**Location:** ${exp.location}\n` : ''}${exp.details.map(d => `• ${d}`).join('\n')}`
            ).join('\n\n');
          } else if (target === 'projects') {
            response = portfolioData.projects.map((proj, i) =>
              `const project${i + 1} = {\n  title: "${proj.title}",\n  tech: [${proj.tech.map(t => `"${t}"`).join(', ')}],\n  description: "${proj.description}"\n};`
            ).join('\n\n');
          } else if (target === 'contact') {
            response = `
┌────────────────────────────────────────┐
│           CONTACT INFORMATION          │
├────────────────────────────────────────┤
│                                        │
│  Name:     ${portfolioData.profile.name.padEnd(27)} │
│  Role:     ${portfolioData.profile.role.padEnd(27)} │
│  Location: ${portfolioData.profile.location.padEnd(27)} │
│                                        │
│  Links:                                │
│    > open linkedin                     │
│    > open github                       │
│    > open email                        │
│                                        │
└────────────────────────────────────────┘`;
          } else {
            response = `cat: ${args[0]}: No such file`;
          }
        }
        break;
      case 'cd':
        if (args.length === 0) {
          response = 'Usage: cd <section>';
        } else {
          const target = args[0].replace('.json', '').replace('.md', '').replace('.js', '').replace('.txt', '');
          if (DIRS.includes(target)) {
            onNavigate(target);
            response = `Navigating to ${target}...`;
            // Auto-close after 5s
            setTimeout(() => {
              onClose();
            }, 500);
          } else {
            response = `cd: ${args[0]}: No such directory`;
          }
        }
        break;
      case 'neofetch':
        const ua = navigator.userAgent;
        const getBrowser = () => {
          if (ua.includes('Edg/')) return 'Edge ' + ua.match(/Edg\/(\d+)/)?.[1];
          if (ua.includes('Chrome/')) return 'Chrome ' + ua.match(/Chrome\/(\d+)/)?.[1];
          if (ua.includes('Firefox/')) return 'Firefox ' + ua.match(/Firefox\/(\d+)/)?.[1];
          if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari ' + ua.match(/Version\/(\d+)/)?.[1];
          return 'Unknown';
        };
        const getOS = () => {
          if (ua.includes('Win')) return 'Windows';
          if (ua.includes('Mac')) return 'macOS';
          if (ua.includes('Linux')) return 'Linux';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('iOS')) return 'iOS';
          return 'Unknown';
        };
        const cores = navigator.hardwareConcurrency || 'Unknown';
        const memory = performance.memory
          ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)}MiB / ${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(0)}MiB`
          : 'N/A';
        const resolution = `${window.screen.width}x${window.screen.height}`;

        response = `
       _,met$$$$$gg.          root@${portfolioData.profile.name.split(' ')[0].toLowerCase()}
    ,g$$$$$$$$$$$$$$$P.       --------------
  ,g$$P"     """Y$$.".        OS: ${getOS()}
 ,$$P'              \`$$$.     Host: Portfolio Terminal
',$$P       ,ggs.     \`$$b:   Browser: ${getBrowser()}
\`d$$'     ,$P"'   .    $$$    Uptime: ${Math.floor(performance.now() / 1000 / 60)} mins
 $$P      d$'     ,    $$P    Resolution: ${resolution}
 $$:      $$.   -    ,d$$'    Shell: zsh 5.8
 $$;      Y$b._   _,d$P'      Terminal: React-Term-V1
 Y$$.    \`.\`"Y$$$$P"'         CPU Cores: ${cores}
 \`$$b      "-.__              Memory: ${memory}
  \`Y$$                        Language: ${navigator.language}
   \`Y$$.                      Platform: ${navigator.platform}
     \`$$b.                    Online: ${navigator.onLine ? 'Yes' : 'No'}
       \`Y$$b.
          \`"Y$b._
             \`"""
`;
        break;
      case 'whoami':
        response = `${portfolioData.profile.name}
${portfolioData.profile.role}
Location: ${portfolioData.profile.location}

"${portfolioData.profile.tagline}"`;
        break;
      case 'echo':
        if (args.length === 0) {
          response = '';
        } else {
          // Join args and remove surrounding quotes if present
          let text = args.join(' ');
          // Remove matching quotes (single or double) from start and end
          if ((text.startsWith('"') && text.endsWith('"')) ||
              (text.startsWith("'") && text.endsWith("'"))) {
            text = text.slice(1, -1);
          }
          response = text;
        }
        break;
      case 'exit':
        response = 'Closing terminal...';
        setTimeout(() => {
          onClose();
        }, 500);
        break;

      // Basic Unix commands
      case 'pwd':
        response = '/portfolio/profile';
        break;
      case 'date':
        response = new Date().toString();
        break;
      case 'history':
        response = commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
        break;
      case 'alias':
        response = `alias ls='ls --color=auto'
alias ll='ls -alF'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'`;
        break;
      case 'env':
      case 'printenv':
        response = `USER=${portfolioData.profile.name.split(' ')[0].toLowerCase()}
HOME=/home/${portfolioData.profile.name.split(' ')[0].toLowerCase()}
SHELL=/bin/zsh
PATH=/usr/local/bin:/usr/bin:/bin
LANG=en_US.UTF-8
EDITOR=vim
COFFEE_LEVEL=critical
DEBUG_MODE=true
NODE_ENV=portfolio`;
        break;
      case 'man':
        if (args.length === 0) {
          response = 'What manual page do you want?\nTry: man help';
        } else {
          response = `Manual page for ${args[0]}:\n\nNAME\n    ${args[0]} - a command in the portfolio terminal\n\nSYNOPSIS\n    ${args[0]} [options]\n\nDESCRIPTION\n    This is a simulated man page. For real help, type: help\n\nSEE ALSO\n    help(1), help -a(1)`;
        }
        break;
      case 'sudo':
        response = args.length === 0
          ? 'usage: sudo command\n\nNice try! No sudo privileges here.'
          : `[sudo] password for ${portfolioData.profile.name.split(' ')[0].toLowerCase()}: \nSorry, ${portfolioData.profile.name.split(' ')[0].toLowerCase()} is not in the sudoers file. This incident will be reported.`;
        break;

      // Developer commands
      case 'git':
        if (args.length === 0) {
          response = `usage: git [--version] [--help] [-C <path>] <command> [<args>]

These are common Git commands:
   status     Show the working tree status
   log        Show commit logs
   diff       Show changes

Hint: This is a demo portfolio, not a real git repo!`;
        } else if (args[0] === 'status') {
          response = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
        } else if (args[0] === 'log') {
          response = `commit a1b2c3d4 (HEAD -> main, origin/main)
Author: ${portfolioData.profile.name} <${portfolioData.profile.social.email}>
Date:   ${new Date().toDateString()}

    Initial commit: Portfolio v1.0`;
        } else {
          response = `git: '${args[0]}' is not a git command. See 'git --help'.`;
        }
        break;
      case 'npm':
        if (args.length === 0 || args[0] === '--version' || args[0] === '-v') {
          response = '10.2.4';
        } else if (args[0] === 'install') {
          response = `added 1337 packages in 42s

128 packages are looking for funding
  run \`npm fund\` for details`;
        } else if (args[0] === 'start') {
          response = 'Portfolio is already running!';
        } else {
          response = `Unknown command: "${args[0]}"`;
        }
        break;
      case 'node':
        if (args[0] === '-v' || args[0] === '--version') {
          response = 'v20.11.0';
        } else {
          response = 'Welcome to Node.js v20.11.0.\nType ".help" for more information.';
        }
        break;
      case 'python':
        if (args[0] === '--version' || args[0] === '-V') {
          response = 'Python 3.11.7';
        } else {
          response = 'Python 3.11.7\nType "help", "copyright" for more information.';
        }
        break;

      // Fun Easter Eggs
      case 'cowsay':
        const cowText = args.length > 0 ? args.join(' ') : 'Moo!';
        const bubbleLen = cowText.length + 2;
        response = ` ${'_'.repeat(bubbleLen)}
< ${cowText} >
 ${'-'.repeat(bubbleLen)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
        break;
      case 'sl':
        response = `      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__

You meant 'ls', didn't you?`;
        break;
      case 'matrix':
        // Animated matrix sequence
        setIsAnimating(true);
        setHistory(prev => [
          ...prev,
          { type: 'command', content: cmd },
          { type: 'output', content: '' }
        ]);

        const matrixLines = [
          'ｦ ｱ ｳ ｴ ｵ ｶ ｷ ｸ ｹ ｺ ｻ ｼ ｽ ｾ ｿ',
          'ﾀ ﾁ ﾂ ﾃ ﾄ ﾅ ﾆ ﾇ ﾈ ﾉ ﾊ ﾋ ﾌ ﾍ ﾎ',
          'ﾏ ﾐ ﾑ ﾒ ﾓ ﾔ ﾕ ﾖ ﾗ ﾘ ﾙ ﾚ ﾛ ﾜ',
          '0 1 0 1 1 0 1 0 0 1 1 0 1 0 1',
          '',
          'Wake up, Neo... The Matrix has you.'
        ];

        let matrixIndex = 0;
        const runMatrixSequence = () => {
          if (matrixIndex < matrixLines.length) {
            setTimeout(() => {
              setHistory(prev => {
                const lastOutput = prev[prev.length - 1];
                const newContent = matrixIndex === 0
                  ? matrixLines[matrixIndex]
                  : lastOutput.content + '\n' + matrixLines[matrixIndex];
                return [
                  ...prev.slice(0, -1),
                  { ...lastOutput, content: newContent }
                ];
              });
              matrixIndex++;
              runMatrixSequence();
            }, 300);
          } else {
            setIsAnimating(false);
          }
        };
        runMatrixSequence();

        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        return;
      case 'hack':
      case 'hacker':
        // Animated hacker sequence
        setIsAnimating(true);
        setHistory(prev => [
          ...prev,
          { type: 'command', content: cmd },
          { type: 'output', content: '[INITIALIZING HACK SEQUENCE...]' }
        ]);

        const hackSteps = [
          { delay: 500, text: '[====                ] 20%' },
          { delay: 1000, text: '[========            ] 40%' },
          { delay: 1500, text: '[============        ] 60%' },
          { delay: 2000, text: '[================    ] 80%' },
          { delay: 2500, text: '[====================] 100%\n' },
          { delay: 3000, text: 'Accessing mainframe...            [OK]' },
          { delay: 3500, text: 'Bypassing firewall...             [OK]' },
          { delay: 4000, text: 'Decrypting passwords...           [OK]' },
          { delay: 4500, text: 'Installing backdoor...            [OK]\n' },
          { delay: 5000, text: 'HACK COMPLETE' }
        ];

        let currentStep = 0;
        const runHackSequence = () => {
          if (currentStep < hackSteps.length) {
            const step = hackSteps[currentStep];
            const prevDelay = currentStep > 0 ? hackSteps[currentStep - 1].delay : 0;

            setTimeout(() => {
              setHistory(prev => {
                const lastOutput = prev[prev.length - 1];
                const newContent = lastOutput.content + '\n' + step.text;
                return [
                  ...prev.slice(0, -1),
                  { ...lastOutput, content: newContent }
                ];
              });
              currentStep++;
              runHackSequence();
            }, step.delay - prevDelay);
          } else {
            setIsAnimating(false);
          }
        };
        runHackSequence();

        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        return;
      case 'uptime':
        response = ` ${new Date().toLocaleTimeString()} up 1337 days, 13:37, 1 user, load average: 0.42, 0.69, 1.00`;
        break;
      case 'free':
        if (performance.memory) {
          const totalMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
          const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(0);
          const freeMB = (totalMB - usedMB).toFixed(0);
          const totalFormatted = totalMB.padStart(8);
          const usedFormatted = usedMB.padStart(8);
          const freeFormatted = freeMB.padStart(8);

          response = `              total        used        free
Mem:     ${totalFormatted}   ${usedFormatted}   ${freeFormatted} MB

JS Heap Memory (Chrome/Edge only)`;
        } else {
          response = `              total        used        free      shared
Mem:          64000       62000        2000         500
Swap:          8000        7999           1

(Memory API not available in this browser)`;
        }
        break;
      case 'curl':
        if (args.length === 0) {
          response = 'curl: try \'curl --help\' for more information';
        } else {
          let url = args[0];
          // Add https:// if no protocol specified
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }

          response = `Fetching ${url}...`;
          setHistory(prev => [
            ...prev,
            { type: 'command', content: cmd },
            { type: 'output', content: response }
          ]);

          fetch(url)
            .then(res => res.text())
            .then(data => {
              // Truncate if too long
              const maxLength = 2000;
              const displayData = data.length > maxLength
                ? data.substring(0, maxLength) + '\n\n... [output truncated]'
                : data;

              setHistory(prev => [
                ...prev.slice(0, -1),
                { type: 'output', content: displayData }
              ]);
            })
            .catch(error => {
              setHistory(prev => [
                ...prev.slice(0, -1),
                { type: 'output', content: `curl: (6) Could not resolve host: ${url}\n${error.message}` }
              ]);
            });

          setCommandHistory(prev => [...prev, cmd]);
          setHistoryIndex(-1);
          return;
        }
        break;
      case 'say':
        response = args.length > 0 ? `"${args.join(' ')}"` : 'say: no text provided';
        break;
      case 'hire':
        response = `Recruiting ${portfolioData.profile.name}?

Excellent choice! I'm available for:
- Full-stack development
- Cloud architecture (AWS/GCP)
- System design & optimization

Let's connect:
> open linkedin
> open email

Looking forward to working together!`;
        break;
      case 'konami':
        response = `R1 R2 L1 R2 left down right down right up

CHEAT ACTIVATED

Health: MAX
Armor: MAX
Weapons: ALL
Wanted Level: CLEARED
Money: +$250,000`;
        break;
      case 'secret':
        response = `Shhh... You found a secret!

The secret to great code? Coffee, sleep, and refactoring.
Not necessarily in that order.

Try: help -a`;
        break;
      case 'easteregg':
        response = `You found an easter egg!

Congratulations on your curiosity!
Developers who explore are developers who grow.

There are more hidden commands... keep exploring!`;
        break;
      case 'weather':
        // Get user's location and fetch weather
        response = 'Fetching weather data...';
        setHistory(prev => [
          ...prev,
          { type: 'command', content: cmd },
          { type: 'output', content: response }
        ]);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
              );
              const weatherData = await weatherResponse.json();
              const weather = weatherData.current_weather;

              const weatherOutput = `Current Weather

Temperature: ${weather.temperature}°F
Wind Speed: ${weather.windspeed} mph
Conditions: ${getWeatherCondition(weather.weathercode)}

Latitude: ${latitude.toFixed(2)}
Longitude: ${longitude.toFixed(2)}`;

              setHistory(prev => [
                ...prev.slice(0, -1),
                { type: 'output', content: weatherOutput }
              ]);
            } catch (error) {
              setHistory(prev => [
                ...prev.slice(0, -1),
                { type: 'output', content: 'Error fetching weather data.' }
              ]);
            }
          },
          () => {
            setHistory(prev => [
              ...prev.slice(0, -1),
              { type: 'output', content: 'Location access denied. Cannot fetch weather.' }
            ]);
          }
        );
        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        return;

      case 'clear':
        setHistory([]);
        return;
      case '':
        return;
      default:
        response = `Command not found: ${command}. Type "help" for available commands.`;
    }

    if (response !== undefined) {
      setHistory(prev => [
        ...prev,
        { type: 'command', content: cmd },
        { type: 'output', content: response }
      ]);
    }
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    audioSynth.playClick();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
      setSuggestion('');
      audioSynth.playClick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setInput(input + suggestion);
        setSuggestion('');
        audioSynth.playClick();
      }
    } else if (e.key === 'ArrowRight' && suggestion) {
        // Optional: Allow right arrow to complete like zsh-autosuggestions
        setInput(input + suggestion);
        setSuggestion('');
        audioSynth.playClick();
    }
  };

  const handleTouchStart = (e) => {
    // Only track horizontal swipes (not on buttons/input to avoid interfering)
    if (!e.target.closest('button') && !e.target.closest('input')) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    // Only handle if we have a start position and a suggestion exists
    if (touchStartX && suggestion) {
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      // Swipe right gesture (at least 50px)
      if (swipeDistance > 50) {
        setInput(input + suggestion);
        setSuggestion('');
        audioSynth.playClick();
      }
    }
    setTouchStartX(0);
  };

  // Desktop drag handlers
  const handleMouseDown = (e) => {
    // Only allow dragging from the header, and only on desktop (width > 768px)
    if (e.target.closest('.terminal-header') && window.innerWidth > 768) {
      setIsDragging(true);

      const rect = terminalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      e.preventDefault();
    }
  };

  const handleDoubleClick = (e) => {
    // Double-click anywhere on terminal to recenter (desktop only)
    if (window.innerWidth > 768 && position.x !== null && position.y !== null) {
      // Don't trigger if clicking on input or buttons
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
        return;
      }

      // Start recentering animation
      setIsRecentering(true);

      // After animation completes, reset position
      setTimeout(() => {
        setPosition({ x: null, y: null }); // Reset to centered
        setIsRecentering(false);
      }, 500); // Match the CSS transition duration

      e.preventDefault();
    }
  };

  // Add mouse event listeners for dragging
  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging && window.innerWidth > 768) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setPosition({ x: newX, y: newY });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Calculate terminal style based on position
  const getTerminalStyle = () => {
    if (position.x !== null && position.y !== null && window.innerWidth > 768) {
      // Dragged position (desktop only)
      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        animation: 'none'
      };
    }

    // Mobile: Apply visual viewport height and positioning
    if (window.innerWidth <= 768 && visualViewportHeight !== null) {
      const margin = visualViewportHeight * 0.025; // 2.5% margin
      return {
        top: `${margin}px`,
        height: `${visualViewportHeight - (margin * 2)}px` // visual viewport minus top and bottom margins
      };
    }

    return {}; // Use CSS default
  };

  const hasBeenDragged = position.x !== null && position.y !== null;

  return (
    <div
      ref={terminalRef}
      className={`terminal-wrapper ${isClosing ? 'closing' : ''} ${keyboardOpen ? 'keyboard-open' : ''} ${isDragging ? 'dragging' : ''} ${hasBeenDragged ? 'dragged' : ''} ${isRecentering ? 'recentering' : ''}`}
      onClick={() => inputRef.current?.focus()}
      onAnimationEnd={onAnimationEnd}
      onDoubleClick={handleDoubleClick}
      style={getTerminalStyle()}
    >
      <div
        className="terminal-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: window.innerWidth > 768 ? 'move' : 'default' }}
      >
        <span>TERMINAL</span>
        <div className="terminal-controls">
          <button onClick={onClose} className="terminal-control-btn minimize">_</button>
          <button onClick={onClose} className="terminal-control-btn close">x</button>
        </div>
      </div>
      <div
        className="terminal-body"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {history.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.type === 'command' ? '> ' : ''}{line.content}
          </div>
        ))}
        {!isAnimating && (
          <div className="terminal-input-line">
            <span className="terminal-prompt-line">root@${portfolioData.profile.name.split(' ')[0].toLowerCase()}:~/portfolio/{activeTab} $ </span>
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="terminal-input"
                autoFocus
                spellCheck="false"
                autoComplete="off"
              />
              {suggestion && (
                <span className="terminal-suggestion">
                  {input}<span style={{ opacity: 0.5 }}>{suggestion}</span>
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default TerminalComponent;
