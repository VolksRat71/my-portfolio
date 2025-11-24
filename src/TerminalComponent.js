import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { audioSynth } from './AudioSynth';
import { portfolioData } from './contentData';
import { STANDARD_COMMANDS, EASTER_EGG_COMMANDS, FILES, DIRS, OPEN_TARGETS } from './terminalConstants';
import { createCommandHandlers } from './terminalCommands';
import { createAsyncCommandHandlers } from './terminalAsyncCommands';
import NodeShell from './NodeShell';
import PythonShell from './PythonShell';
import vfs from './vfs';

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
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRecentering, setIsRecentering] = useState(false);
  const [visualViewportHeight, setVisualViewportHeight] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: null, height: null });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [inNodeShell, setInNodeShell] = useState(false);
  const [inPythonShell, setInPythonShell] = useState(false);

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

  // Initialize VFS on component mount
  useEffect(() => {
    vfs.initializeDefaults(portfolioData).catch(err => {
      console.error('Failed to initialize VFS:', err);
    });
  }, []);

  // Track visual viewport height for mobile
  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport && window.innerWidth <= 768) {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight.current - currentHeight;

        setVisualViewportHeight(currentHeight);

        if (heightDiff > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
        }
      }
    };

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

  // Autocomplete suggestions
  useEffect(() => {
    const updateSuggestions = async () => {
      if (input) {
        const historyMatch = [...commandHistory].reverse().find(h => h.startsWith(input) && h !== input);

        if (historyMatch) {
          setSuggestion(historyMatch.slice(input.length));
          return;
        }

        const parts = input.split(' ');
        const cmd = parts[0];
        const arg = parts.slice(1).join(' ');

        if (parts.length === 1) {
          const standardMatch = STANDARD_COMMANDS.find(c => c.startsWith(cmd));
          const easterEggMatch = EASTER_EGG_COMMANDS.find(c => c.startsWith(cmd));
          const match = standardMatch || easterEggMatch;

          if (match && match !== cmd) {
            setSuggestion(match.slice(cmd.length));
          } else {
            setSuggestion('');
          }
        } else if (cmd === 'cd') {
          // cd uses the navigation sections, not VFS
          const match = DIRS.find(o => o.startsWith(arg));
          if (match && match !== arg) {
            setSuggestion(match.slice(arg.length));
          } else {
            setSuggestion('');
          }
        } else if (['cat', 'rm', 'node', 'python', 'touch', 'echo'].includes(cmd)) {
          // Get files from VFS for autocomplete
          try {
            const files = await vfs.readdir('/');
            const options = files.map(f => {
              const name = f.path.split('/').pop();
              return f.type === 'directory' ? name + '/' : name;
            });

            const match = options.find(o => o.startsWith(arg));
            if (match && match !== arg) {
              setSuggestion(match.slice(arg.length));
            } else {
              setSuggestion('');
            }
          } catch (error) {
            // Fallback to FILES if VFS not ready
            const match = FILES.find(o => o.startsWith(arg));
            if (match && match !== arg) {
              setSuggestion(match.slice(arg.length));
            } else {
              setSuggestion('');
            }
          }
        } else if (cmd === 'open') {
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
    };

    updateSuggestions();
  }, [input, commandHistory]);

  const handleCommand = async (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Get command handlers
    const handlers = createCommandHandlers(portfolioData, setHistory, setIsAnimating, setCommandHistory, setHistoryIndex);
    const asyncHandlers = createAsyncCommandHandlers(setHistory, setIsAnimating, setCommandHistory, setHistoryIndex);

    let response = '';

    // Handle special navigation commands
    if (command === 'cd') {
      if (args.length === 0) {
        response = 'Usage: cd <section>';
      } else {
        const target = args[0].replace('.json', '').replace('.md', '').replace('.js', '').replace('.txt', '');
        if (DIRS.includes(target)) {
          onNavigate(target);
          response = `Navigating to ${target}...`;
          setTimeout(() => {
            onClose();
          }, 500);
        } else {
          response = `cd: ${args[0]}: No such directory`;
        }
      }
    } else if (command === 'reboot') {
      response = 'Rebooting system...';
      setTimeout(() => {
        onReboot();
      }, 1000);
    } else if (command === 'exit') {
      response = 'Closing terminal...';
      setTimeout(() => {
        onClose();
      }, 500);
    } else if (command === 'clear') {
      setHistory([]);
      return;
    } else if (command === '') {
      return;
    }
    // Handle async/animated commands
    else if (command === 'matrix') {
      asyncHandlers.matrix(cmd);
      return;
    } else if (command === 'hack' || command === 'hacker') {
      asyncHandlers.hack(cmd);
      return;
    } else if (command === 'weather') {
      asyncHandlers.weather(cmd);
      return;
    } else if (command === 'curl') {
      if (args.length === 0) {
        response = 'curl: try \'curl --help\' for more information';
      } else {
        asyncHandlers.curl(cmd, args);
        return;
      }
    } else if (command === 'history') {
      response = asyncHandlers.history(commandHistory);
    } else if (command === 'python' && args.length === 0) {
      // Start Python shell
      setHistory(prev => [
        ...prev,
        { type: 'command', content: cmd },
        { type: 'output', content: 'Python 3.11.7\nType "help", "copyright", "credits" or "license" for more information.' }
      ]);
      setInPythonShell(true);
      setIsAnimating(true);
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
      return;
    } else if (command === 'node' && args.length === 0) {
      // Start Node shell
      setHistory(prev => [
        ...prev,
        { type: 'command', content: cmd },
        { type: 'output', content: 'Welcome to Node.js v20.11.0.\nType ".help" for more information.' }
      ]);
      setInNodeShell(true);
      setIsAnimating(true);
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
      return;
    }
    // Handle synchronous and async commands
    else if (handlers[command]) {
      response = await handlers[command](args);
      // If handler returned null, check async handlers
      if (response === null && command === 'python') {
        asyncHandlers.python(cmd);
        return;
      }
      if (response === null && command === 'node') {
        // Already handled above
        return;
      }
    } else {
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
      setInput(input + suggestion);
      setSuggestion('');
      audioSynth.playClick();
    }
  };

  const handleTouchStart = (e) => {
    if (!e.target.closest('button') && !e.target.closest('input')) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX && suggestion) {
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      if (swipeDistance > 50) {
        setInput(input + suggestion);
        setSuggestion('');
        audioSynth.playClick();
      }
    }
    setTouchStartX(0);
  };

  const handleMouseDown = (e) => {
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
    if (window.innerWidth > 768 && position.x !== null && position.y !== null) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
        return;
      }

      setIsRecentering(true);

      setTimeout(() => {
        setPosition({ x: null, y: null });
        setIsRecentering(false);
      }, 500);

      e.preventDefault();
    }
  };

  const handleResizeStart = (e, direction) => {
    if (window.innerWidth <= 768) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = terminalRef.current.getBoundingClientRect();
    setIsResizing(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    });
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging && window.innerWidth > 768) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setPosition({ x: newX, y: newY });
      } else if (isResizing && window.innerWidth > 768) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        if (isResizing.includes('e')) {
          newWidth = Math.max(400, resizeStart.width + deltaX);
        }
        if (isResizing.includes('w')) {
          newWidth = Math.max(400, resizeStart.width - deltaX);
        }
        if (isResizing.includes('s')) {
          newHeight = Math.max(300, resizeStart.height + deltaY);
        }
        if (isResizing.includes('n')) {
          newHeight = Math.max(300, resizeStart.height - deltaY);
        }

        setSize({ width: newWidth, height: newHeight });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, dragOffset, isResizing, resizeStart]);

  const getTerminalStyle = () => {
    const style = {};

    if (position.x !== null && position.y !== null && window.innerWidth > 768) {
      style.left = `${position.x}px`;
      style.top = `${position.y}px`;
      style.transform = 'none';
      style.animation = 'none';
    }

    if (size.width !== null && size.height !== null && window.innerWidth > 768) {
      style.width = `${size.width}px`;
      style.height = `${size.height}px`;
    }

    if (window.innerWidth <= 768 && visualViewportHeight !== null) {
      const margin = visualViewportHeight * 0.025;
      style.top = `${margin}px`;
      style.height = `${visualViewportHeight - (margin * 2)}px`;
    }

    return style;
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
        {inPythonShell ? (
          <PythonShell
            onExit={() => setInPythonShell(false)}
            setIsAnimating={setIsAnimating}
            terminalEndRef={terminalEndRef}
          />
        ) : inNodeShell ? (
          <NodeShell
            onExit={() => setInNodeShell(false)}
            setHistory={setHistory}
            setIsAnimating={setIsAnimating}
            terminalEndRef={terminalEndRef}
          />
        ) : !isAnimating && (
          <div className="terminal-input-line">
            <span className="terminal-prompt-line">root@{portfolioData.profile.name.split(' ')[0].toLowerCase()}:~/portfolio/{activeTab} $ </span>
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
      {window.innerWidth > 768 && (
        <>
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  );
};

export default TerminalComponent;
