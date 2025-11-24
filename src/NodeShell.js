import React, { useState, useEffect, useRef } from 'react';

const NodeShell = ({ onExit, setHistory, setIsAnimating, terminalEndRef }) => {
  const [input, setInput] = useState('');
  const [shellHistory, setShellHistory] = useState([]);
  const [multilineBuffer, setMultilineBuffer] = useState([]);
  const [isMultilineMode, setIsMultilineMode] = useState(false);
  const contextRef = useRef({
    // Create a persistent context that survives across evaluations
    vars: {},
    consoleOutput: []
  });
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    // Scroll to bottom
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [shellHistory, terminalEndRef]);

  const evaluateJS = (code) => {
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

      // Reset console output
      contextRef.current.consoleOutput = [];

      // Create console object that captures output
      const consoleObj = {
        log: (...args) => {
          const output = args.map(a =>
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ');
          contextRef.current.consoleOutput.push(output);
        }
      };

      // Get all variable names from context
      const varNames = Object.keys(contextRef.current.vars);
      const varValues = varNames.map(name => contextRef.current.vars[name]);

      let result;
      let isExpression = true;

      // Try as expression first
      try {
        const func = new Function('console', ...varNames, `return (${code})`);
        result = func(consoleObj, ...varValues);
      } catch (exprError) {
        // If expression fails, try as statement
        isExpression = false;
        try {
          const func = new Function('console', ...varNames, code);
          result = func(consoleObj, ...varValues);
        } catch (stmtError) {
          throw exprError; // Throw the original expression error
        }
      }

      // Update context with any new variables declared
      // First, re-execute the code to populate local scope, then extract variables
      const varMatches = Array.from(code.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g));
      if (varMatches.length > 0) {
        // Re-create function with all current vars plus execute the code
        const allVarNames = [...varNames];
        const allVarValues = [...varValues];

        for (const match of varMatches) {
          const varName = match[1];
          try {
            // Execute the code and then extract the new variable
            const extractFunc = new Function(...allVarNames, `
              ${code}
              return ${varName};
            `);
            const value = extractFunc(...allVarValues);
            contextRef.current.vars[varName] = value;
          } catch (e) {
            // Variable extraction failed, skip
          }
        }
      }

      // Check for simple assignments like: varName = value
      const assignMatch = code.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        contextRef.current.vars[varName] = result;
      }

      // If console.log was called, return that output
      if (contextRef.current.consoleOutput.length > 0) {
        return contextRef.current.consoleOutput.join('\n');
      }

      // Format the result
      if (result === undefined && !isExpression) {
        return 'undefined';
      }
      if (result === undefined) {
        return 'undefined';
      }
      if (typeof result === 'function') {
        return `[Function: ${result.name || 'anonymous'}]`;
      }
      if (typeof result === 'object' && result !== null) {
        return JSON.stringify(result, null, 2);
      }
      return String(result);
    } catch (error) {
      return `Uncaught ${error.name}: ${error.message}`;
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
    if (!input.trim()) return;

    const result = evaluateJS(input);

    if (result !== null) {
      setShellHistory(prev => [...prev, { input, output: result }]);
      setCommandHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
    }

    setInput('');
  };

  return (
    <>
      {shellHistory.map((item, i) => (
        <React.Fragment key={i}>
          <div className="terminal-line">
            <span style={{ color: '#4CAF50' }}>&gt; </span>
            {item.input}
          </div>
          {item.output && (
            <div className="terminal-line output" style={{ color: '#aaa' }}>
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
          onKeyDown={handleKeyDown}
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
