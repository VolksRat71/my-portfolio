import React, { useState, useEffect, useRef } from 'react';
import { loadBrython } from './brythonLoader';

const PythonShell = ({ onExit, setIsAnimating, terminalEndRef }) => {
  const [input, setInput] = useState('');
  const [shellHistory, setShellHistory] = useState([]);
  const [brythonReady, setBrythonReady] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const contextRef = useRef({});

  useEffect(() => {
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

  const handleKeyDown = (e) => {
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
    if (!input.trim() || !brythonReady) return;

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
            {item.input}
          </div>
          {item.output && (
            <div className="terminal-line output" style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>
              {item.output}
            </div>
          )}
        </React.Fragment>
      ))}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>&gt;&gt;&gt; </span>
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
