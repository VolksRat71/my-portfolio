import React, { useState, useEffect, useRef } from 'react';

const NodeShell = ({ onExit, setHistory, setIsAnimating, terminalEndRef }) => {
  const [input, setInput] = useState('');
  const [shellHistory, setShellHistory] = useState([]);
  const [serverAvailable, setServerAvailable] = useState(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    // Check if server is available
    fetch('http://localhost:3001/eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '1+1', sessionId: sessionIdRef.current })
    })
      .then(() => setServerAvailable(true))
      .catch(() => setServerAvailable(false));

    inputRef.current?.focus();
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalEndRef]);

  useEffect(() => {
    // Scroll on history change
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [shellHistory, terminalEndRef]);

  const evaluateJS = async (code) => {
    try {
      // Handle special commands
      if (code.trim() === '.exit') {
        handleExit();
        return null;
      }
      if (code.trim() === '.help') {
        return `.exit    Exit the REPL
.help    Print this help message`;
      }

      // If server is available, use it
      if (serverAvailable) {
        const response = await fetch('http://localhost:3001/eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            sessionId: sessionIdRef.current
          })
        });

        const data = await response.json();

        if (data.success) {
          return data.result !== undefined ? data.result : 'undefined';
        } else {
          return `Uncaught ${data.error}`;
        }
      } else {
        // Fallback message
        return 'Node REPL server not running. Start it with: node node-repl-server.js';
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const handleExit = () => {
    // Reset session on exit
    if (serverAvailable) {
      fetch('http://localhost:3001/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current })
      }).catch(() => {});
    }
    setIsAnimating(false);
    onExit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const result = await evaluateJS(input);

    if (result !== null) {
      setShellHistory(prev => [...prev, { input, output: result }]);
    }

    setInput('');
  };

  if (serverAvailable === null) {
    return (
      <div className="terminal-line" style={{ color: '#aaa' }}>
        Checking for Node REPL server...
      </div>
    );
  }

  return (
    <>
      {!serverAvailable && (
        <div className="terminal-line" style={{ color: '#ff9800' }}>
          Warning: Node REPL server not detected.
          {'\n'}Start server with: node node-repl-server.js
          {'\n'}
        </div>
      )}
      {shellHistory.map((item, i) => (
        <React.Fragment key={i}>
          <div className="terminal-line">
            <span style={{ color: '#4CAF50' }}>&gt; </span>
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
        <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>&gt; </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="terminal-input"
          autoFocus
          spellCheck="false"
          autoComplete="off"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </form>
    </>
  );
};

export default NodeShell;
