import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { audioSynth } from './AudioSynth';
import { portfolioData } from './contentData';

const COMMANDS = ['help', 'ls', 'cd', 'cat', 'clear', 'neofetch', 'reboot', 'contact', 'open'];
const FILES = ['profile.json', 'experience.md', 'projects.js', 'contact.txt'];
const DIRS = ['profile', 'experience', 'projects', 'contact'];
const OPEN_TARGETS = ['linkedin', 'github', 'email'];

const TerminalComponent = ({ onNavigate, activeTab, onClose, isClosing, onAnimationEnd, onReboot }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'output', content: 'Welcome to the interactive terminal. Type "help" for commands.' }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');

  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    if (input) {
      const parts = input.split(' ');
      const cmd = parts[0];
      const arg = parts.slice(1).join(' ');

      if (parts.length === 1) {
        // Suggest commands
        const match = COMMANDS.find(c => c.startsWith(cmd));
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
  }, [input]);

  const handleCommand = (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let response = '';

    switch (command) {
      case 'help':
        response = `Available commands:
  help               - Show this help message
  ls                 - List available files
  cat <file>         - Display file contents in terminal
  cd <section>       - Navigate to a page section
  contact            - View contact information
  open <target>      - Open links (linkedin, github, email)
  neofetch           - Display system information
  reboot             - Reboot the system
  clear              - Clear terminal history`;
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
            // Auto-close after 1.5s
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            response = `cd: ${args[0]}: No such directory`;
          }
        }
        break;
      case 'neofetch':
        response = `
       _,met$$$$$gg.          root@nathaniel
    ,g$$$$$$$$$$$$$$$P.       --------------
  ,g$$P"     """Y$$.".        OS: Debian GNU/Linux 12 (bookworm) x86_64
 ,$$P'              \`$$$.     Host: Hackermans Laptop
',$$P       ,ggs.     \`$$b:   Kernel: 5.10.0-8-amd64
\`d$$'     ,$P"'   .    $$$    Uptime: 1337 days, 42 mins
 $$P      d$'     ,    $$P    Packages: 1984 (dpkg)
 $$:      $$.   -    ,d$$'    Shell: zsh 5.8
 $$;      Y$b._   _,d$P'      Resolution: 1920x1080
 Y$$.    \`.\`"Y$$$$P"'         DE: GNOME
 \`$$b      "-.__              WM: Mutter
  \`Y$$                        Terminal: React-Term-V1
   \`Y$$.                      CPU: Intel i9-9900K (16) @ 5.000GHz
     \`$$b.                    GPU: NVIDIA GeForce RTX 3090
       \`Y$$b.                 Memory: 32000MiB / 64000MiB
          \`"Y$b._
             \`"""
`;
        break;
      case 'clear':
        setHistory([]);
        return;
      case '':
        return;
      default:
        response = `Command not found: ${command}. Type "help" for available commands.`;
    }

    setHistory(prev => [
      ...prev,
      { type: 'command', content: cmd },
      { type: 'output', content: response }
    ]);
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

  return (
    <div
      className={`terminal-wrapper ${isClosing ? 'closing' : ''}`}
      onClick={() => inputRef.current?.focus()}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="terminal-header">
        <span>TERMINAL</span>
        <div className="terminal-controls">
          <button onClick={onClose} className="terminal-control-btn minimize">_</button>
          <button onClick={onClose} className="terminal-control-btn close">x</button>
        </div>
      </div>
      <div className="terminal-body">
        {history.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.type === 'command' ? '> ' : ''}{line.content}
          </div>
        ))}
        <div className="terminal-input-line">
          <span>root@nathaniel:~/portfolio/{activeTab} $ </span>
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
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default TerminalComponent;
