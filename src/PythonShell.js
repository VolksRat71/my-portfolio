import React, { useState, useEffect, useRef } from 'react';

const PythonShell = ({ onExit, setIsAnimating, terminalEndRef }) => {
  const [input, setInput] = useState('');
  const [shellHistory, setShellHistory] = useState([]);
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load Pyodide
    const loadPyodide = async () => {
      try {
        const { loadPyodide: load } = await import('pyodide');
        const pyodideInstance = await load({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });

        // Capture stdout
        await pyodideInstance.runPythonAsync(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.output = []

    def write(self, text):
        if text and text.strip():
            self.output.append(text)

    def flush(self):
        pass

    def get_output(self):
        result = ''.join(self.output)
        self.output = []
        return result

_output_capture = OutputCapture()
sys.stdout = _output_capture
sys.stderr = _output_capture
        `);

        setPyodide(pyodideInstance);
        setLoading(false);
      } catch (error) {
        setShellHistory(prev => [...prev, {
          input: '',
          output: `Failed to load Python: ${error.message}\nFalling back to demo mode.`
        }]);
        setLoading(false);
      }
    };

    loadPyodide();
  }, []);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [shellHistory, loading, terminalEndRef]);

  const evaluatePython = async (code) => {
    // Handle special commands
    if (code.trim() === 'exit()' || code.trim() === 'quit()') {
      handleExit();
      return null;
    }

    if (!pyodide) {
      return 'Python not loaded. Try refreshing the page.';
    }

    try {
      // Run the code
      await pyodide.runPythonAsync(code);

      // Get captured output
      const output = await pyodide.runPythonAsync('_output_capture.get_output()');

      // If there was output, return it
      if (output && output.trim()) {
        return output;
      }

      // If no output, try to evaluate as expression
      try {
        const result = await pyodide.runPythonAsync(`repr(${code})`);
        return result;
      } catch {
        // If that fails, just return empty (was a statement)
        return '';
      }
    } catch (error) {
      // Format Python error
      const errorStr = error.message || String(error);
      return errorStr;
    }
  };

  const handleExit = () => {
    setIsAnimating(false);
    onExit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const result = await evaluatePython(input);

    if (result !== null) {
      setShellHistory(prev => [...prev, { input, output: result }]);
    }

    setInput('');
  };

  if (loading) {
    return (
      <div className="terminal-line" style={{ color: '#aaa' }}>
        Loading Python WebAssembly... (this may take a moment)
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
