const express = require('express');
const cors = require('cors');
const { VM } = require('vm2');

const app = express();
app.use(cors());
app.use(express.json());

// Store VM contexts per session
const sessions = new Map();

app.post('/eval', (req, res) => {
  const { code, sessionId = 'default' } = req.body;

  try {
    // Get or create VM for this session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, new VM({
        timeout: 5000,
        sandbox: {
          console: {
            log: (...args) => {
              return args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
            }
          }
        }
      }));
    }

    const vm = sessions.get(sessionId);
    const result = vm.run(code);

    res.json({
      success: true,
      result: result !== undefined ? String(result) : undefined
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.post('/reset', (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Node REPL server running on http://localhost:${PORT}`);
});
