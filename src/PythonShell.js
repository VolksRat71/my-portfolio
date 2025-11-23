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
        setBrythonReady(true);
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

    try {
      // Capture stdout
      const outputCapture = [];
      const originalPrint = window.__BRYTHON__.builtins.print;

      window.__BRYTHON__.builtins.print = function(...args) {
        outputCapture.push(args.map(a => String(a)).join(' '));
      };

      try {
        // Use Brython's py_exec to run code directly
        const result = window.__BRYTHON__.py_exec(code, {}, '__main__');

        // Restore print
        window.__BRYTHON__.builtins.print = originalPrint;

        // Return captured output or result
        if (outputCapture.length > 0) {
          return outputCapture.join('\n');
        }

        // If no output and we have a result, return it
        if (result !== undefined && result !== null) {
          if (typeof result === 'string') {
            return `'${result}'`;
          }
          return String(result);
        }

        return '';
      } catch (err) {
        // Restore print
        window.__BRYTHON__.builtins.print = originalPrint;

        // Format error
        let errorMsg = String(err.message || err);

        // Clean up Brython error messages
        if (errorMsg.includes('name \'') && errorMsg.includes('\' is not defined')) {
          return errorMsg;
        }
        if (errorMsg.toLowerCase().includes('syntaxerror')) {
          return errorMsg;
        }

        return errorMsg;
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const handleExit = () => {
    setIsAnimating(false);
    onExit();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !brythonReady) return;

    const result = evaluatePython(input);

    if (result !== null) {
      setShellHistory(prev => [...prev, { input, output: result }]);
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
