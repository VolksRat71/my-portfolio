import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const COMMANDS = ['help', 'ls', 'cd', 'cat', 'clear', 'neofetch'];
const FILES = ['profile.json', 'experience.md', 'projects.js'];
const DIRS = ['profile', 'experience', 'projects'];

const TerminalComponent = ({ onNavigate, activeTab, onClose }) => {
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
      const match = COMMANDS.find(cmd => cmd.startsWith(input)) ||
                    FILES.find(file => file.startsWith(input)) ||
                    DIRS.find(dir => dir.startsWith(input));
      if (match && match !== input) {
        setSuggestion(match.slice(input.length));
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
  help          - Show this help message
  ls            - List available sections
  cd <section>  - Navigate to a section
  cat <file>    - View file content (same as cd)
  neofetch      - Display system information
  clear         - Clear terminal history`;
        break;
      case 'ls':
        response = FILES.join('\n');
        break;
      case 'cd':
      case 'cat':
        if (args.length === 0) {
          response = 'Usage: cd <section> or cat <file>';
        } else {
          const target = args[0].replace('.json', '').replace('.md', '').replace('.js', '');
          if (DIRS.includes(target)) {
            onNavigate(target);
            response = `Navigating to ${target}...`;
          } else {
            response = `Directory or file not found: ${args[0]}`;
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
      setSuggestion('');
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
      }
    } else if (e.key === 'ArrowRight' && suggestion) {
        // Optional: Allow right arrow to complete like zsh-autosuggestions
        setInput(input + suggestion);
        setSuggestion('');
    }
  };

  return (
    <div className="terminal-wrapper" onClick={() => inputRef.current?.focus()}>
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
              onChange={(e) => setInput(e.target.value)}
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
