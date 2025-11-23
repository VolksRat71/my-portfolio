import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Get real system info with fallbacks
    const cores = navigator.hardwareConcurrency || 4;
    const memoryMB = performance.memory
      ? Math.floor(performance.memory.jsHeapSizeLimit / 1024)
      : 65536;
    const ua = navigator.userAgent || '';

    const getBrowser = () => {
      try {
        if (ua.includes('Edg/')) {
          const version = ua.match(/Edg\/(\d+)/)?.[1];
          return version ? `Edge ${version}` : 'Edge';
        }
        if (ua.includes('Chrome/')) {
          const version = ua.match(/Chrome\/(\d+)/)?.[1];
          return version ? `Chrome ${version}` : 'Chrome';
        }
        if (ua.includes('Firefox/')) {
          const version = ua.match(/Firefox\/(\d+)/)?.[1];
          return version ? `Firefox ${version}` : 'Firefox';
        }
        if (ua.includes('Safari/') && !ua.includes('Chrome')) {
          const version = ua.match(/Version\/(\d+)/)?.[1];
          return version ? `Safari ${version}` : 'Safari';
        }
        return 'Web Browser';
      } catch (e) {
        return 'Web Browser';
      }
    };

    const getOS = () => {
      try {
        if (ua.includes('Win')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        return 'Generic OS';
      } catch (e) {
        return 'Generic OS';
      }
    };

    const bootSequence = [
      { text: 'BIOS Date 01/01/99 13:37:00 Ver: Portfolio-1.0', delay: 50 },
      { text: `Host OS: ${getOS()}`, delay: 150 },
      { text: `Browser: ${getBrowser()}`, delay: 200 },
      { text: `CPU Cores: ${cores}`, delay: 250 },
      { text: 'Press DEL to enter SETUP', delay: 350 },
      { text: ' ', delay: 450 },
      { text: 'Checking NVRAM..', delay: 550 },
      { text: 'NVRAM OK', delay: 750 },
      { text: 'Checking Memory...', delay: 850 },
      { text: `${memoryMB}KB OK`, delay: 1100 },
      { text: ' ', delay: 1200 },
      { text: 'Loading Kernel...', delay: 1300 },
      { text: 'Kernel Loaded.', delay: 1600 },
      { text: 'Mounting Filesystems...', delay: 1750 },
      { text: 'Starting ReactOS...', delay: 2000 },
      { text: 'Ready.', delay: 2250 }
    ];

    let timeouts = [];

    bootSequence.forEach(({ text, delay }) => {
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, text]);
      }, delay);
      timeouts.push(timeout);
    });

    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500); // Wait for fade out
    }, 2500);
    timeouts.push(exitTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${isExiting ? 'fade-out' : ''}`}>
      {lines.map((line, index) => (
        <div key={index} className="bios-text">{line}</div>
      ))}
      <div className="cursor-block"></div>
    </div>
  );
};

export default SplashScreen;
