import { useEffect, useRef, useState } from 'react';

/**
 * useTypewriter
 * 伪流式打字机效果，适用于后端一次性返回 JSON 的场景。
 */
const useTypewriter = (text, speed = 35, onComplete) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (!text) {
      setIsComplete(true);
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      indexRef.current += 1;
      setDisplayedText(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        window.clearInterval(timerRef.current);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return {
    displayedText,
    isComplete,
  };
};

export default useTypewriter;
