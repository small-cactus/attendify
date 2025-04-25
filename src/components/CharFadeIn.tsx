import React from 'react';
import { motion } from 'framer-motion';

interface CharFadeInProps {
  text: string;
  className?: string;
  gradient?: boolean;
  delay?: number;
  speed?: number;
  /**
   * Delay (in seconds) before the animation starts (added to delayChildren)
   */
  startAfter?: number;
  /**
   * If provided, will automatically delay this animation until after another CharFadeIn finishes.
   * Pass: { charCount: number, speed: number, stagger?: number }
   * This takes precedence over startAfter.
   */
  chainAfter?: { charCount: number; speed: number; stagger?: number };
}

const CharFadeIn: React.FC<CharFadeInProps> = ({ text, className = '', gradient = true, delay = 0, speed = 1, startAfter = 0, chainAfter }) => {
  // Calculate duration and stagger based on speed
  const baseDuration = 0.7 / speed;
  const staggerDelay = 0.035 / speed;

  // If chaining, compute delay to start after another CharFadeIn
  let effectiveDelay = delay + startAfter;
  if (chainAfter) {
    const { charCount, speed: prevSpeed, stagger: prevStagger } = chainAfter;
    const prevStaggerDelay = prevStagger !== undefined ? prevStagger : 0.035 / prevSpeed;
    const prevBaseDuration = 0.7 / prevSpeed;
    effectiveDelay = (charCount * prevStaggerDelay) + prevBaseDuration;
  }

  return (
    <motion.span
      style={{ display: 'inline-block' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: effectiveDelay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {text.split(/(\s+)/).map((word, wi) =>
        word.trim() === '' ? (
          <span key={wi}>{word}</span>
        ) : (
          <span key={wi} style={{ display: 'inline-block' }}>
            {word.split('').map((char, ci) => (
              <motion.span
                key={ci}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 16,
                    filter: 'blur(16px)',
                    rotate: -2,
                    scale: 0.98,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    rotate: 0,
                    scale: 1,
                    transition: {
                      duration: baseDuration,
                      ease: [0.22, 1, 0.36, 1],
                      filter: { duration: baseDuration * 0.7, ease: [0.4, 0, 0.2, 1] },
                      y: { duration: baseDuration * 0.7, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: baseDuration * 0.6, ease: [0.4, 0, 0.2, 1] },
                      scale: { duration: baseDuration * 0.8, ease: [0.4, 0, 0.2, 1] },
                      rotate: { duration: baseDuration * 0.8, ease: [0.4, 0, 0.2, 1] },
                    },
                  },
                }}
                style={{ display: 'inline-block' }}
                className={gradient ? 'text-transparent bg-clip-text bg-gradient-to-b from-black to-neutral-600' : ''}
              >
                {char}
              </motion.span>
            ))}
          </span>
        )
      )}
    </motion.span>
  );
};

export default CharFadeIn; 