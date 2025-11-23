import { FILES } from './terminalConstants';
import { getSystemInfo } from './terminalHelpers';

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

    ls: () => FILES.join('\n'),

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

    cat: (args) => {
      if (args.length === 0) {
        return 'Usage: cat <file>';
      }
      const target = args[0].replace('.json', '').replace('.md', '').replace('.js', '').replace('.txt', '');
      if (target === 'profile') {
        return `{
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
        return portfolioData.experience.map((exp, i) =>
          `## ${exp.company}\n**${exp.role}** (${exp.period})\n${exp.location ? `**Location:** ${exp.location}\n` : ''}${exp.details.map(d => `• ${d}`).join('\n')}`
        ).join('\n\n');
      } else if (target === 'projects') {
        return portfolioData.projects.map((proj, i) =>
          `const project${i + 1} = {\n  title: "${proj.title}",\n  tech: [${proj.tech.map(t => `"${t}"`).join(', ')}],\n  description: "${proj.description}"\n};`
        ).join('\n\n');
      } else if (target === 'contact') {
        return handlers.contact();
      } else {
        return `cat: ${args[0]}: No such file`;
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

    echo: (args) => {
      if (args.length === 0) return '';
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
      } else if (args[0] === 'install') {
        return `added 1337 packages in 42s

128 packages are looking for funding
  run \`npm fund\` for details`;
      } else if (args[0] === 'start') {
        return 'Portfolio is already running!';
      } else {
        return `Unknown command: "${args[0]}"`;
      }
    },

    node: (args) => {
      if (args[0] === '-v' || args[0] === '--version') {
        return 'v20.11.0';
      }
      // Shell version handled in async commands
      return null;
    },

    python: (args) => {
      if (args[0] === '--version' || args[0] === '-V') {
        return 'Python 3.11.7';
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
