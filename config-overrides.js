const webpack = require('webpack');

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

  // Use NormalModuleReplacementPlugin to handle node: protocol imports
  config.plugins = [
    ...config.plugins,
    new webpack.NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        const moduleName = resource.request.replace(/^node:/, '');
        // Replace with empty module
        resource.request = 'data:text/javascript,export default {}';
      }
    )
  ];

  // Ignore warnings about dynamic imports in Pyodide
  config.ignoreWarnings = [
    /Critical dependency: the request of a dependency is an expression/
  ];

  return config;
};
