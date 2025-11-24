import React, { useState, useEffect, useRef } from 'react';
import vfs from './vfs';

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
  }, [shellHistory, terminalEndRef, multilineBuffer]);

  const evaluateJS = (code) => {
    try {
      // Handle special commands
      if (code.trim() === '.exit') {
        handleExit();
        return null;
      }
      if (code.trim() === '.help') {
        return `.exit    Exit the REPL
.help    Print this help message

File I/O available:
  fs.readFileSync(path)     - Read file contents
  fs.writeFileSync(path, data) - Write file contents
  fs.readdirSync()          - List files`;
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

      // Create mock fs module with VFS integration
      // Note: These are synchronous wrappers around async VFS operations
      // They will block execution briefly
      const fsObj = {
        readFileSync: (path) => {
          let result = null;
          let error = null;
          let done = false;

          vfs.readFile(path).then(
            content => { result = content; done = true; },
            err => { error = err; done = true; }
          );

          // Busy wait for async operation (not ideal but works for demo)
          let timeout = 0;
          while (!done && timeout < 10000) {
            timeout++;
          }

          if (error) throw new Error(error.message);
          if (!done) throw new Error('Timeout reading file');
          return result;
        },

        writeFileSync: (path, data) => {
          let error = null;
          let done = false;

          vfs.writeFile(path, String(data)).then(
            () => { done = true; },
            err => { error = err; done = true; }
          );

          let timeout = 0;
          while (!done && timeout < 10000) {
            timeout++;
          }

          if (error) throw new Error(error.message);
          if (!done) throw new Error('Timeout writing file');
        },

        readdirSync: (path = '/') => {
          let result = null;
          let error = null;
          let done = false;

          vfs.readdir(path).then(
            files => {
              result = files.map(f => {
                const name = f.path.split('/').pop();
                return f.type === 'directory' ? name + '/' : name;
              });
              done = true;
            },
            err => { error = err; done = true; }
          );

          let timeout = 0;
          while (!done && timeout < 10000) {
            timeout++;
          }

          if (error) throw new Error(error.message);
          if (!done) throw new Error('Timeout listing directory');
          return result;
        },

        existsSync: (path) => {
          let result = false;
          let done = false;

          vfs.exists(path).then(
            exists => { result = exists; done = true; },
            () => { result = false; done = true; }
          );

          let timeout = 0;
          while (!done && timeout < 10000) {
            timeout++;
          }

          return result;
        }
      };

      // Get all variable names from context
      const varNames = Object.keys(contextRef.current.vars);
      const varValues = varNames.map(name => contextRef.current.vars[name]);

      let result;
      let isExpression = true;

      // Try as expression first
      try {
        const func = new Function('console', 'fs', ...varNames, `return (${code})`);
        result = func(consoleObj, fsObj, ...varValues);
      } catch (exprError) {
        // If expression fails, try as statement
        isExpression = false;
        try {
          const func = new Function('console', 'fs', ...varNames, code);
          result = func(consoleObj, fsObj, ...varValues);
        } catch (stmtError) {
          throw exprError; // Throw the original expression error
        }
      }

      // Update context with any new variables declared
      // First, re-execute the code to populate local scope, then extract variables
      const varMatches = Array.from(code.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g));
      if (varMatches.length > 0) {
        // Re-create function with all current vars plus execute the code
        const allVarNames = ['console', 'fs', ...varNames];
        const allVarValues = [consoleObj, fsObj, ...varValues];

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

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n')) {
      e.preventDefault();
      // Execute multiline paste directly like a real terminal
      const result = evaluateJS(pastedText);

      if (result !== null) {
        setShellHistory(prev => [...prev, { input: pastedText, output: result, multiline: true }]);
        setCommandHistory(prev => [...prev, pastedText]);
        setHistoryIndex(-1);
      }

      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Cmd+Enter or Ctrl+Enter: add line to multiline buffer (Node REPL style)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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

    // If in multiline mode, combine buffer with current input
    if (isMultilineMode || multilineBuffer.length > 0) {
      // Empty line or just whitespace submits multiline code
      if (!input.trim()) {
        const codeToExecute = multilineBuffer.join('\n');
        const result = evaluateJS(codeToExecute);

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
            {'>'}
          </span>
          <span>{line}</span>
        </div>
      ))}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>
          {isMultilineMode || multilineBuffer.length > 0 ? '... ' : '> '}
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
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </form>
    </>
  );
};

export default NodeShell;
