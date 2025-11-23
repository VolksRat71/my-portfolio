import { getWeatherCondition } from './terminalHelpers';

// Async command handlers that manage their own history updates
export const createAsyncCommandHandlers = (setHistory, setIsAnimating, setCommandHistory, setHistoryIndex) => ({

  matrix: (cmd) => {
    setIsAnimating(true);
    setHistory(prev => [
      ...prev,
      { type: 'command', content: cmd },
      { type: 'output', content: '' }
    ]);

    const matrixLines = [
      'ｦ ｱ ｳ ｴ ｵ ｶ ｷ ｸ ｹ ｺ ｻ ｼ ｽ ｾ ｿ',
      'ﾀ ﾁ ﾂ ﾃ ﾄ ﾅ ﾆ ﾇ ﾈ ﾉ ﾊ ﾋ ﾌ ﾍ ﾎ',
      'ﾏ ﾐ ﾑ ﾒ ﾓ ﾔ ﾕ ﾖ ﾗ ﾘ ﾙ ﾚ ﾛ ﾜ',
      '0 1 0 1 1 0 1 0 0 1 1 0 1 0 1',
      '',
      'Wake up, Neo... The Matrix has you.'
    ];

    let matrixIndex = 0;
    const runMatrixSequence = () => {
      if (matrixIndex < matrixLines.length) {
        setTimeout(() => {
          setHistory(prev => {
            const lastOutput = prev[prev.length - 1];
            const newContent = matrixIndex === 0
              ? matrixLines[matrixIndex]
              : lastOutput.content + '\n' + matrixLines[matrixIndex];
            return [
              ...prev.slice(0, -1),
              { ...lastOutput, content: newContent }
            ];
          });
          matrixIndex++;
          runMatrixSequence();
        }, 300);
      } else {
        setIsAnimating(false);
      }
    };
    runMatrixSequence();

    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
  },

  hack: (cmd) => {
    setIsAnimating(true);
    setHistory(prev => [
      ...prev,
      { type: 'command', content: cmd },
      { type: 'output', content: '[INITIALIZING HACK SEQUENCE...]' }
    ]);

    const hackSteps = [
      { delay: 500, text: '[====                ] 20%' },
      { delay: 1000, text: '[========            ] 40%' },
      { delay: 1500, text: '[============        ] 60%' },
      { delay: 2000, text: '[================    ] 80%' },
      { delay: 2500, text: '[====================] 100%\n' },
      { delay: 3000, text: 'Accessing mainframe...            [OK]' },
      { delay: 3500, text: 'Bypassing firewall...             [OK]' },
      { delay: 4000, text: 'Decrypting passwords...           [OK]' },
      { delay: 4500, text: 'Installing backdoor...            [OK]\n' },
      { delay: 5000, text: 'HACK COMPLETE' }
    ];

    let currentStep = 0;
    const runHackSequence = () => {
      if (currentStep < hackSteps.length) {
        const step = hackSteps[currentStep];
        const prevDelay = currentStep > 0 ? hackSteps[currentStep - 1].delay : 0;

        setTimeout(() => {
          setHistory(prev => {
            const lastOutput = prev[prev.length - 1];
            const newContent = lastOutput.content + '\n' + step.text;
            return [
              ...prev.slice(0, -1),
              { ...lastOutput, content: newContent }
            ];
          });
          currentStep++;
          runHackSequence();
        }, step.delay - prevDelay);
      } else {
        setIsAnimating(false);
      }
    };
    runHackSequence();

    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
  },

  weather: (cmd) => {
    const response = 'Fetching weather data...';
    setHistory(prev => [
      ...prev,
      { type: 'command', content: cmd },
      { type: 'output', content: response }
    ]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
          );
          const weatherData = await weatherResponse.json();
          const weather = weatherData.current_weather;

          const weatherOutput = `Current Weather

Temperature: ${weather.temperature}°F
Wind Speed: ${weather.windspeed} mph
Conditions: ${getWeatherCondition(weather.weathercode)}

Latitude: ${latitude.toFixed(2)}
Longitude: ${longitude.toFixed(2)}`;

          setHistory(prev => [
            ...prev.slice(0, -1),
            { type: 'output', content: weatherOutput }
          ]);
        } catch (error) {
          setHistory(prev => [
            ...prev.slice(0, -1),
            { type: 'output', content: 'Error fetching weather data.' }
          ]);
        }
      },
      () => {
        setHistory(prev => [
          ...prev.slice(0, -1),
          { type: 'output', content: 'Location access denied. Cannot fetch weather.' }
        ]);
      }
    );

    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
  },

  curl: (cmd, args) => {
    let url = args[0];
    // Add https:// if no protocol specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const response = `Fetching ${url}...`;
    setHistory(prev => [
      ...prev,
      { type: 'command', content: cmd },
      { type: 'output', content: response }
    ]);

    fetch(url)
      .then(res => res.text())
      .then(data => {
        // Truncate if too long
        const maxLength = 2000;
        const displayData = data.length > maxLength
          ? data.substring(0, maxLength) + '\n\n... [output truncated]'
          : data;

        setHistory(prev => [
          ...prev.slice(0, -1),
          { type: 'output', content: displayData }
        ]);
      })
      .catch(error => {
        setHistory(prev => [
          ...prev.slice(0, -1),
          { type: 'output', content: `curl: (6) Could not resolve host: ${url}\n${error.message}` }
        ]);
      });

    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
  },

  history: (commandHistory) => {
    return commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
  }
});
