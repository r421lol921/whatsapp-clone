'use client';
import { useEffect, useRef, useState } from 'react';

interface OdometerCounterProps {
  value: number;
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// Single digit column that animates vertically
function DigitColumn({ digit, prev }: { digit: string; prev: string }) {
  const [displayed, setDisplayed] = useState(prev);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (digit !== displayed) {
      setAnimating(true);
      const t = setTimeout(() => {
        setDisplayed(digit);
        setAnimating(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [digit, displayed]);

  const isLetter = isNaN(Number(digit));

  if (isLetter) {
    return (
      <span
        className="inline-block font-mono font-bold leading-none"
        style={{ transition: 'transform 0.2s ease', display: 'inline-block' }}
      >
        {digit}
      </span>
    );
  }

  return (
    <span
      className="inline-block overflow-hidden font-mono font-bold leading-none"
      style={{ height: '1.1em', verticalAlign: 'bottom' }}
    >
      <span
        style={{
          display: 'block',
          transform: animating ? 'translateY(-100%)' : 'translateY(0%)',
          transition: animating ? 'transform 0.18s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        {displayed}
      </span>
    </span>
  );
}

export default function OdometerCounter({ value, className = '' }: OdometerCounterProps) {
  const prevStrRef = useRef(formatCount(value));
  const [chars, setChars] = useState(() => formatCount(value).split(''));
  const [prevChars, setPrevChars] = useState(() => formatCount(value).split(''));

  useEffect(() => {
    const newStr = formatCount(value);
    const oldStr = prevStrRef.current;
    if (newStr !== oldStr) {
      setPrevChars(oldStr.split(''));
      setChars(newStr.split(''));
      prevStrRef.current = newStr;
    }
  }, [value]);

  return (
    <span className={`inline-flex items-end ${className}`} aria-label={formatCount(value)}>
      {chars.map((ch, i) => (
        <DigitColumn key={i} digit={ch} prev={prevChars[i] ?? ch} />
      ))}
    </span>
  );
}
