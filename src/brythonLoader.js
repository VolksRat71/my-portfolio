export const loadBrython = () => {
  return new Promise((resolve, reject) => {
    const checkBrython = setInterval(() => {
      if (window.brython && window.__BRYTHON__) {
        clearInterval(checkBrython);
        resolve(window.__BRYTHON__);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkBrython);
      if (window.brython && window.__BRYTHON__) {
        resolve(window.__BRYTHON__);
      } else {
        reject(new Error("Timeout waiting for Brython to load from CDN"));
      }
    }, 10000);
  });
};
