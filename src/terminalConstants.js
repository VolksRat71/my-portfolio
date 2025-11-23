// Standard commands shown in regular help
export const STANDARD_COMMANDS = [
  'help', 'ls', 'cd', 'cat', 'clear', 'neofetch',
  'reboot', 'contact', 'open', 'whoami', 'exit', 'echo'
];

// Easter egg commands shown in help -a
export const EASTER_EGG_COMMANDS = [
  'pwd', 'date', 'history', 'alias', 'env', 'printenv',
  'man', 'sudo', 'cowsay', 'sl', 'matrix', 'hack', 'hacker',
  'git', 'npm', 'node', 'python', 'curl', 'konami',
  'easteregg', 'say', 'weather', 'uptime', 'free'
];

// All commands combined
export const ALL_COMMANDS = [...STANDARD_COMMANDS, ...EASTER_EGG_COMMANDS];

export const FILES = ['profile.json', 'experience.md', 'projects.js', 'contact.txt'];
export const DIRS = ['profile', 'experience', 'projects', 'contact'];
export const OPEN_TARGETS = ['linkedin', 'github', 'email'];
