// Singleton to ensure Brython only loads once
let brythonPromise = null;
let brythonLoaded = false;

export const loadBrython = () => {
  // If already loaded, return immediately
  if (brythonLoaded && window.__BRYTHON__) {
    return Promise.resolve(window.__BRYTHON__);
  }

  // If currently loading, return the existing promise
  if (brythonPromise) {
    return brythonPromise;
  }

  // Start loading
  brythonPromise = new Promise((resolve, reject) => {
    // Check if scripts already exist in DOM
    const existingScript = document.getElementById('brython-main-script');
    const existingStdlib = document.getElementById('brython-stdlib-script');

    if (existingScript && existingStdlib && window.__BRYTHON__) {
      brythonLoaded = true;
      resolve(window.__BRYTHON__);
      return;
    }

    // Load main Brython script
    const script = document.createElement('script');
    script.id = 'brython-main-script';
    script.src = 'https://cdn.jsdelivr.net/npm/brython@3.12.3/brython.min.js';

    script.onload = () => {
      // Load stdlib
      const stdlibScript = document.createElement('script');
      stdlibScript.id = 'brython-stdlib-script';
      stdlibScript.src = 'https://cdn.jsdelivr.net/npm/brython@3.12.3/brython_stdlib.js';

      stdlibScript.onload = () => {
        // Initialize Brython only if not already initialized
        if (!window.__BRYTHON__ || !window.__BRYTHON__.imported) {
          try {
            window.brython({ debug: 0, indexedDB: false });
            brythonLoaded = true;
            resolve(window.__BRYTHON__);
          } catch (error) {
            reject(error);
          }
        } else {
          brythonLoaded = true;
          resolve(window.__BRYTHON__);
        }
      };

      stdlibScript.onerror = () => reject(new Error('Failed to load Brython stdlib'));

      if (!existingStdlib) {
        document.head.appendChild(stdlibScript);
      } else {
        stdlibScript.onload();
      }
    };

    script.onerror = () => reject(new Error('Failed to load Brython'));

    if (!existingScript) {
      document.head.appendChild(script);
    } else {
      script.onload();
    }
  });

  return brythonPromise;
};
