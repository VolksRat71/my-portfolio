module.exports = function override(config, env) {
  // Add fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "child_process": false,
    "crypto": false,
    "fs": false,
    "fs/promises": false,
    "path": false,
    "url": false,
    "vm": false,
    "constants": false,
    "stream": false,
    "util": false,
    "buffer": false,
    "process": false
  };

  // Add resolve alias to handle node: protocol
  config.resolve.alias = {
    ...config.resolve.alias,
    "node:child_process": false,
    "node:crypto": false,
    "node:fs": false,
    "node:fs/promises": false,
    "node:path": false,
    "node:url": false,
    "node:vm": false
  };

  // Ignore warnings about dynamic imports in Pyodide
  config.ignoreWarnings = [
    /Critical dependency: the request of a dependency is an expression/
  ];

  return config;
};
