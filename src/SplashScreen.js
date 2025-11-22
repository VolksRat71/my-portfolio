import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const bootSequence = [
      { text: 'BIOS Date 01/01/99 13:37:00 Ver: 1.0.0', delay: 50 },
      { text: 'CPU: Intel(R) Core(TM) i9-9900K CPU @ 5.00GHz', delay: 150 },
      { text: 'Speed: 5000 MHz', delay: 200 },
      { text: 'Press DEL to enter SETUP', delay: 300 },
      { text: ' ', delay: 400 },
      { text: 'Checking NVRAM..', delay: 500 },
      { text: 'NVRAM OK', delay: 700 },
      { text: 'Checking Memory...', delay: 800 },
      { text: '65536KB OK', delay: 1100 },
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
