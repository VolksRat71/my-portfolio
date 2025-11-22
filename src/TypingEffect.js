import React, { useState, useEffect } from 'react';
import { audioSynth } from './AudioSynth';

const TypingEffect = ({ text, speed = 100 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    // The user's provided edit removes the initial setDisplayedText('') here.
    // To match the provided edit exactly, we will remove it.
    // If the intention was to reset the text on prop change,
    // the useState initialization handles the first render,
    // but subsequent `text` changes would not reset `displayedText`
    // unless `setDisplayedText('')` was explicitly called here.
    // However, following the instruction faithfully.

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        audioSynth.playClick(); // Play click sound
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default TypingEffect;
