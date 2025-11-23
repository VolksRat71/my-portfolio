// Helper function to convert weather codes to conditions
export const getWeatherCondition = (code) => {
  const conditions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return conditions[code] || 'Unknown';
};

// Get browser information from user agent
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge ' + ua.match(/Edg\/(\d+)/)?.[1];
  if (ua.includes('Chrome/')) return 'Chrome ' + ua.match(/Chrome\/(\d+)/)?.[1];
  if (ua.includes('Firefox/')) return 'Firefox ' + ua.match(/Firefox\/(\d+)/)?.[1];
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari ' + ua.match(/Version\/(\d+)/)?.[1];
  return 'Unknown';
};

// Get OS information from user agent
export const getOSInfo = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
};

// Get system info for neofetch
export const getSystemInfo = () => {
  const cores = navigator.hardwareConcurrency || 'Unknown';
  const memory = performance.memory
    ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)}MiB / ${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(0)}MiB`
    : 'N/A';
  const resolution = `${window.screen.width}x${window.screen.height}`;
  const uptime = Math.floor(performance.now() / 1000 / 60);

  return {
    os: getOSInfo(),
    browser: getBrowserInfo(),
    cores,
    memory,
    resolution,
    uptime,
    language: navigator.language,
    platform: navigator.platform,
    online: navigator.onLine
  };
};
