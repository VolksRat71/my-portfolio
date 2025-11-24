import { getSystemInfo } from './terminalHelpers';
import vfs from './vfs';

// Command handlers - each returns a response string or handles async operations
export const createCommandHandlers = (portfolioData, setHistory, setIsAnimating, setCommandHistory, setHistoryIndex) => {

  const handlers = {
    help: (args) => {
      if (args[0] === '-a' || args[0] === '--all') {
        return `Available commands:
  help          - Show this help message
  help -a       - Show all commands (including easter eggs)
  ls            - List available files
  cat <file>    - Display file contents
  echo <text>   - Print text (use > to write to file)
  touch <file>  - Create empty file
  rm <file>     - Delete file
  cd <section>  - Navigate to a page section
  contact       - View contact information
  open <target> - Open links (linkedin, github, email)
  whoami        - Display current user information
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
  node          - Start Node.js shell
  python        - Start Python shell
  curl <url>    - Fetch URL
  konami        - Konami code easter egg
  secret        - Find the secret
  easteregg     - Another easter egg
  say <text>    - Text-to-speech style output
  weather       - Check weather at your location
  uptime        - System uptime
  free          - Memory usage`;
      } else {
        return `Available commands:
  help          - Show this help message
  help -a       - Show all commands (including easter eggs)
  ls            - List available files
  cat <file>    - Display file contents
  cd <section>  - Navigate to a page section
  contact       - View contact information
  open <target> - Open links (linkedin, github, email)
  whoami        - Display current user information
  echo <text>   - Print text to the terminal
  python        - Start Python shell
  node          - Start Node.js shell
  neofetch      - Display system information
  reboot        - Reboot the system
  exit          - Close the terminal
  clear         - Clear terminal history

Hint: Try 'help -a' to see hidden commands!`;
      }
    },

    ls: async () => {
      try {
        const files = await vfs.readdir('/');
        if (files.length === 0) {
          return 'No files found';
        }
        return files.map(f => {
          const name = f.path.split('/').pop();
          return f.type === 'directory' ? name + '/' : name;
        }).join('\n');
      } catch (error) {
        return error.message;
      }
    },

    contact: () => `
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
└────────────────────────────────────────┘`,

    open: (args) => {
      if (args.length === 0) {
        return 'Usage: open <target>\nAvailable targets: linkedin, github, email';
      }
      const target = args[0].toLowerCase();
      if (target === 'linkedin') {
        window.open(portfolioData.profile.social.linkedin, '_blank');
        return 'Opening LinkedIn profile in new tab...';
      } else if (target === 'github') {
        window.open(portfolioData.profile.social.github, '_blank');
        return 'Opening GitHub profile in new tab...';
      } else if (target === 'email') {
        window.open(`mailto:${portfolioData.profile.social.email}`, '_blank');
        return `Opening email client to ${portfolioData.profile.social.email}...`;
      } else {
        return `Unknown target: ${target}\nAvailable targets: linkedin, github, email`;
      }
    },

    cat: async (args) => {
      if (args.length === 0) {
        return 'Usage: cat <file>';
      }
      try {
        const content = await vfs.readFile(args[0]);
        return content;
      } catch (error) {
        return error.message;
      }
    },

    touch: async (args) => {
      if (args.length === 0) {
        return 'Usage: touch <file>';
      }
      try {
        await vfs.touch(args[0]);
        return '';
      } catch (error) {
        return error.message;
      }
    },

    rm: async (args) => {
      if (args.length === 0) {
        return 'Usage: rm <file>';
      }
      try {
        await vfs.deleteFile(args[0]);
        return '';
      } catch (error) {
        return error.message;
      }
    },

    neofetch: () => {
      const info = getSystemInfo();
      return `
       _,met$$$$$gg.          root@${portfolioData.profile.name.split(' ')[0].toLowerCase()}
    ,g$$$$$$$$$$$$$$$P.       --------------
  ,g$$P"     """Y$$.".        OS: ${info.os}
 ,$$P'              \`$$$.     Host: Portfolio Terminal
',$$P       ,ggs.     \`$$b:   Browser: ${info.browser}
\`d$$'     ,$P"'   .    $$$    Uptime: ${info.uptime} mins
 $$P      d$'     ,    $$P    Resolution: ${info.resolution}
 $$:      $$.   -    ,d$$'    Shell: zsh 5.8
 $$;      Y$b._   _,d$P'      Terminal: React-Term-V1
 Y$$.    \`.\`"Y$$$$P"'         CPU Cores: ${info.cores}
 \`$$b      "-.__              Memory: ${info.memory}
  \`Y$$                        Language: ${info.language}
   \`Y$$.                      Platform: ${info.platform}
     \`$$b.                    Online: ${info.online ? 'Yes' : 'No'}
       \`Y$$b.
          \`"Y$b._
             \`"""
`;
    },

    whoami: () => `${portfolioData.profile.name}
${portfolioData.profile.role}
Location: ${portfolioData.profile.location}

"${portfolioData.profile.tagline}"`,

    echo: async (args) => {
      if (args.length === 0) return '';

      // Check if there's a redirect operator
      const redirectIndex = args.indexOf('>');
      if (redirectIndex !== -1) {
        // echo text > file
        const text = args.slice(0, redirectIndex).join(' ');
        const filename = args[redirectIndex + 1];

        if (!filename) {
          return 'Usage: echo <text> > <file>';
        }

        // Protected files that cannot be overwritten
        const protectedFiles = [
          'profile.json',
          '/profile.json',
          'contact.txt',
          '/contact.txt',
          'experience.md',
          '/experience.md',
          'projects.js',
          '/projects.js',
          'README.md',
          '/README.md',
          'hello.py',
          '/hello.py',
          'demo.js',
          '/demo.js'
        ];

        if (protectedFiles.includes(filename)) {
          return `echo: cannot overwrite '${filename}': File is protected`;
        }

        let content = text;
        if ((content.startsWith('"') && content.endsWith('"')) ||
            (content.startsWith("'") && content.endsWith("'"))) {
          content = content.slice(1, -1);
        }

        try {
          await vfs.writeFile(filename, content);
          return '';
        } catch (error) {
          return error.message;
        }
      }

      // Regular echo
      let text = args.join(' ');
      if ((text.startsWith('"') && text.endsWith('"')) ||
          (text.startsWith("'") && text.endsWith("'"))) {
        text = text.slice(1, -1);
      }
      return text;
    },

    pwd: () => '/portfolio/profile',

    date: () => new Date().toString(),

    alias: () => `alias ls='ls --color=auto'
alias ll='ls -alF'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'`,

    env: () => `USER=${portfolioData.profile.name.split(' ')[0].toLowerCase()}
HOME=/home/${portfolioData.profile.name.split(' ')[0].toLowerCase()}
SHELL=/bin/zsh
PATH=/usr/local/bin:/usr/bin:/bin
LANG=en_US.UTF-8
EDITOR=vim
DEBUG_MODE=true
NODE_ENV=portfolio`,

    man: (args) => {
      if (args.length === 0) {
        return 'What manual page do you want?\nTry: man help';
      }
      return `Manual page for ${args[0]}:\n\nNAME\n    ${args[0]} - a command in the portfolio terminal\n\nSYNOPSIS\n    ${args[0]} [options]\n\nDESCRIPTION\n    This is a simulated man page. For real help, type: help\n\nSEE ALSO\n    help(1), help -a(1)`;
    },

    sudo: (args) => {
      return args.length === 0
        ? 'usage: sudo command\n\nNice try! No sudo privileges here.'
        : `[sudo] password for ${portfolioData.profile.name.split(' ')[0].toLowerCase()}: \nSorry, ${portfolioData.profile.name.split(' ')[0].toLowerCase()} is not in the sudoers file. This incident will be reported.`;
    },

    git: (args) => {
      if (args.length === 0) {
        return `usage: git [--version] [--help] [-C <path>] <command> [<args>]

These are common Git commands:
   status     Show the working tree status
   log        Show commit logs
   diff       Show changes

Hint: This is a demo portfolio, not a real git repo!`;
      } else if (args[0] === 'status') {
        return `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
      } else if (args[0] === 'log') {
        return `commit a1b2c3d4 (HEAD -> main, origin/main)
Author: ${portfolioData.profile.name} <${portfolioData.profile.social.email}>
Date:   ${new Date().toDateString()}

    Initial commit: Portfolio v1.0`;
      } else {
        return `git: '${args[0]}' is not a git command. See 'git --help'.`;
      }
    },

    npm: (args) => {
      if (args.length === 0 || args[0] === '--version' || args[0] === '-v') {
        return '10.2.4';
      } else if (args[0] === 'install' || args[0] === 'i') {
        return `added 1337 packages in 42s

128 packages are looking for funding
  run \`npm fund\` for details`;
      } else if (args[0] === 'start') {
        return 'Portfolio is already running!';
      } else {
        return `Unknown command: "${args[0]}"`;
      }
    },

    node: async (args) => {
      if (args[0] === '-v' || args[0] === '--version') {
        return 'v20.11.0';
      }
      // If a file argument is provided, execute it
      if (args.length > 0) {
        const filename = args[0];
        try {
          const code = await vfs.readFile(filename);

          // Create a mock console that captures output
          let output = [];
          const mockConsole = {
            log: (...args) => {
              output.push(args.map(a =>
                typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
              ).join(' '));
            }
          };

          // Execute the code
          try {
            const func = new Function('console', code);
            func(mockConsole);
            return output.length > 0 ? output.join('\n') : '';
          } catch (error) {
            return `Error executing ${filename}:\n${error.message}`;
          }
        } catch (error) {
          return error.message;
        }
      }
      // Shell version handled in async commands
      return null;
    },

    python: async (args) => {
      if (args[0] === '--version' || args[0] === '-V') {
        return 'Python 3.11.7';
      }
      // If a file argument is provided, execute it
      if (args.length > 0) {
        const filename = args[0];
        try {
          const code = await vfs.readFile(filename);

          // Check if Brython is available
          if (!window.run_python_code) {
            return 'Python engine not loaded. Please wait a moment and try again.';
          }

          // Execute the Python code
          try {
            const result = window.run_python_code(code);
            return result || '';
          } catch (error) {
            return `Error executing ${filename}:\n${error.message}`;
          }
        } catch (error) {
          return error.message;
        }
      }
      // Shell version handled in async commands
      return null;
    },

    cowsay: (args) => {
      const cowText = args.length > 0 ? args.join(' ') : 'Moo!';
      const bubbleLen = cowText.length + 2;
      return ` ${'_'.repeat(bubbleLen)}
< ${cowText} >
 ${'-'.repeat(bubbleLen)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
    },

    sl: () => `      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__

You meant 'ls', didn't you?`,

    uptime: () => {
      const uptimeMs = performance.now();
      const uptimeSec = Math.floor(uptimeMs / 1000);
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      const secs = uptimeSec % 60;

      let uptimeStr = '';
      if (days > 0) {
        uptimeStr = `${days} day${days !== 1 ? 's' : ''}, ${hours}:${mins.toString().padStart(2, '0')}`;
      } else if (hours > 0) {
        uptimeStr = `${hours}:${mins.toString().padStart(2, '0')}`;
      } else if (mins > 0) {
        uptimeStr = `${mins} min${mins !== 1 ? 's' : ''}`;
      } else {
        uptimeStr = `${secs} sec${secs !== 1 ? 's' : ''}`;
      }

      return ` ${new Date().toLocaleTimeString()} up ${uptimeStr}, 1 user, load average: 0.42, 0.69, 1.00`;
    },

    free: () => {
      if (performance.memory) {
        const totalMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
        const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(0);
        const freeMB = (totalMB - usedMB).toFixed(0);
        const totalFormatted = totalMB.padStart(8);
        const usedFormatted = usedMB.padStart(8);
        const freeFormatted = freeMB.padStart(8);

        return `              total        used        free
Mem:     ${totalFormatted}   ${usedFormatted}   ${freeFormatted} MB

JS Heap Memory (Chrome/Edge only)`;
      } else {
        return `              total        used        free      shared
Mem:          64000       62000        2000         500
Swap:          8000        7999           1

(Memory API not available in this browser)`;
      }
    },

    say: (args) => args.length > 0 ? `"${args.join(' ')}"` : 'say: no text provided',
    konami: () => `R1 R2 L1 R2 left down right down right up

CHEAT ACTIVATED

Health: MAX
Armor: MAX
Weapons: ALL
Wanted Level: CLEARED
Money: +$250,000`,

    easteregg: () => `You found an easter egg!

Congratulations on your curiosity!
Developers who explore are developers who grow.

There are more hidden commands... keep exploring!`,
  };

  // Add aliases
  handlers.printenv = handlers.env;
  handlers.hacker = handlers.hack;

  return handlers;
};
