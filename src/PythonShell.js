import React, { useState, useEffect, useRef } from 'react';
import { loadBrython } from './brythonLoader';
import vfs from './vfs';

const PythonShell = ({ onExit, setIsAnimating, terminalEndRef }) => {
  const [input, setInput] = useState('');
  const [shellHistory, setShellHistory] = useState([]);
  const [brythonReady, setBrythonReady] = useState(false);
  const [error, setError] = useState(null);
  const [multilineBuffer, setMultilineBuffer] = useState([]);
  const [isMultilineMode, setIsMultilineMode] = useState(false);
  const inputRef = useRef(null);
  const contextRef = useRef({});

  useEffect(() => {
    // Expose VFS to window for Python access
    window.vfs = vfs;

    loadBrython()
      .then(() => {
        // Wait for the Python runner to be available
        const checkRunner = setInterval(() => {
          if (window.run_python_code) {
            clearInterval(checkRunner);
            setBrythonReady(true);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkRunner);
          if (!window.run_python_code) {
            setError("Timeout waiting for Python engine");
          }
        }, 10000);
      })
      .catch((err) => {
        setError(err.message);
        setBrythonReady(false);
      });
  }, []);

  useEffect(() => {
    if (brythonReady) {
      inputRef.current?.focus();
    }
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [shellHistory, brythonReady, terminalEndRef]);

  const evaluatePython = (code) => {
    // Handle special commands
    if (code.trim() === 'exit()' || code.trim() === 'quit()') {
      handleExit();
      return null;
    }

    if (!window.__BRYTHON__) {
      return 'Python not loaded. Try refreshing the page.';
    }

    if (!window.run_python_code) {
      return 'Python engine not ready. Please wait...';
    }

    try {
      const result = window.run_python_code(code);
      return result;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const handleExit = () => {
    setIsAnimating(false);
    onExit();
  };

  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n')) {
      e.preventDefault();
      // Execute multiline paste directly like a real terminal
      const result = evaluatePython(pastedText);

      if (result !== null) {
        setShellHistory(prev => [...prev, { input: pastedText, output: result, multiline: true }]);
        setCommandHistory(prev => [...prev, pastedText]);
        setHistoryIndex(-1);
      }

      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Tab: insert 4 spaces for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const cursorPos = e.target.selectionStart;
      const textBefore = input.substring(0, cursorPos);
      const textAfter = input.substring(cursorPos);
      setInput(textBefore + '    ' + textAfter);
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = cursorPos + 4;
      }, 0);
      return;
    }

    // Shift+Enter: add line to multiline buffer
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setMultilineBuffer(prev => [...prev, input]);
      setIsMultilineMode(true);
      setInput('');
      return;
    }

    if (e.key === 'ArrowUp') {
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
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!brythonReady) return;

    // If in multiline mode, combine buffer with current input
    let codeToExecute;
    if (isMultilineMode || multilineBuffer.length > 0) {
      // Empty line or just whitespace submits multiline code
      if (!input.trim()) {
        codeToExecute = multilineBuffer.join('\n');
        const result = evaluatePython(codeToExecute);

        if (result !== null) {
          setShellHistory(prev => [...prev, { input: codeToExecute, output: result, multiline: true }]);
          setCommandHistory(prev => [...prev, codeToExecute]);
          setHistoryIndex(-1);
        }

        setMultilineBuffer([]);
        setIsMultilineMode(false);
        setInput('');
        return;
      } else {
        // Add current line to buffer and continue
        setMultilineBuffer(prev => [...prev, input]);
        setInput('');
        return;
      }
    }

    // Single line execution
    if (!input.trim()) return;

    const result = evaluatePython(input);

    if (result !== null) {
      setShellHistory(prev => [...prev, { input, output: result }]);
      setCommandHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
    }

    setInput('');
  };

  if (error) {
    return (
      <div className="terminal-line" style={{ color: '#ff6b6b' }}>
        Failed to load Python: {error}
      </div>
    );
  }

  if (!brythonReady) {
    return (
      <div className="terminal-line" style={{ color: '#aaa' }}>
        Loading Python...
      </div>
    );
  }

  return (
    <>
      {shellHistory.map((item, i) => (
        <React.Fragment key={i}>
          <div className="terminal-line">
            <span style={{ color: '#4CAF50' }}>&gt;&gt;&gt; </span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{item.input}</span>
          </div>
          {item.output && (
            <div className="terminal-line output" style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>
              {item.output}
            </div>
          )}
        </React.Fragment>
      ))}
      {multilineBuffer.map((line, i) => (
        <div key={`ml-${i}`} className="terminal-line">
          <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>
            {i === 0 ? '>>> ' : '... '}
          </span>
          <span>{line}</span>
        </div>
      ))}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>
          {isMultilineMode || multilineBuffer.length > 0 ? '... ' : '>>> '}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="terminal-input"
          autoFocus
          spellCheck="false"
          autoComplete="off"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 'inherit'
          }}
        />
      </form>
    </>
  );
};

export default PythonShell;
