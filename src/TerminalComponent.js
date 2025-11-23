import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { audioSynth } from './AudioSynth';
import { portfolioData } from './contentData';

const COMMANDS = ['help', 'ls', 'cd', 'cat', 'clear', 'neofetch', 'reboot', 'contact', 'open', 'whoami', 'exit', 'echo'];
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
  }, [input, commandHistory]);

  const handleCommand = (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let response = '';

    switch (command) {
      case 'help':
        response = `Available commands:
  help          - Show this help message
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
  clear         - Clear terminal history`;
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
        response = `
       _,met$$$$$gg.          root@${portfolioData.profile.name.split(' ')[0].toLowerCase()}
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
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default TerminalComponent;
