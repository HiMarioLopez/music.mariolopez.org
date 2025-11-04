import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./AnimatedBackground.module.css";

interface AnimatedBackgroundProps {
  colors: string[];
}

interface Blob {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
  moveX: (number | string)[];
  moveY: (number | string)[];
}

// Default fallback colors if none provided - bright vibrant palette
const DEFAULT_COLORS = ["#ff006e", "#8338ec", "#3a86ff", "#06ffa5", "#fb5607"];

// Simple seeded random number generator for consistent blob generation
const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ colors }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Use provided colors or fallback to defaults
  const displayColors = useMemo(() => {
    return colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  }, [colors]);

  // Create a stable key from colors array to detect actual color changes
  const colorsKey = useMemo(() => {
    return displayColors.join(",");
  }, [displayColors]);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.innerHeight < 600);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoize blob generation to prevent regeneration when colors array reference changes
  // but values remain the same. Only regenerate when colorsKey or isMobile changes.
  const blobs = useMemo(() => {
    const blobCount = isMobile ? 6 : 10;
    const newBlobs: Blob[] = [];

    for (let i = 0; i < blobCount; i++) {
      // Use index as seed for consistent generation
      const random = seededRandom(i + colorsKey.length);
      const baseX = random() * 100;
      const baseY = random() * 100;

      // Create more interesting movement patterns with seeded randomness
      const moveX = [
        `${baseX + (random() - 0.5) * 60}%`,
        `${baseX + (random() - 0.5) * 60}%`,
        `${baseX + (random() - 0.5) * 60}%`,
        `${baseX}%`,
      ];

      const moveY = [
        `${baseY + (random() - 0.5) * 60}%`,
        `${baseY + (random() - 0.5) * 60}%`,
        `${baseY + (random() - 0.5) * 60}%`,
        `${baseY}%`,
      ];

      newBlobs.push({
        id: i,
        initialX: baseX,
        initialY: baseY,
        size: isMobile ? 250 + random() * 200 : 400 + random() * 350,
        color: displayColors[i % displayColors.length],
        duration: 25 + random() * 20, // 25-45 seconds
        moveX,
        moveY,
      });
    }

    return newBlobs;
  }, [colorsKey, isMobile, displayColors]);

  // Memoize mesh gradient animation values to avoid Math.random() in render
  const meshGradientAnimations = useMemo(() => {
    return displayColors.map((color, index) => {
      // Use seeded random for consistent values
      const random = seededRandom(index + colorsKey.length + 1000);
      return {
        color,
        index,
        x: [`${(random() - 0.5) * 20}%`, `${(random() - 0.5) * 20}%`],
        y: [`${(random() - 0.5) * 20}%`, `${(random() - 0.5) * 20}%`],
      };
    });
  }, [displayColors, colorsKey]);

  return (
    <div className={styles.container}>
      {/* Animated gradient blobs */}
      <div className={styles.blobsContainer}>
        {blobs.map((blob) => (
          <motion.div
            key={`${blob.id}-${blob.color}`}
            className={styles.blob}
            style={{
              background: `radial-gradient(circle, ${blob.color}80, ${blob.color}40, ${blob.color}20)`,
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              left: `${blob.initialX}%`,
              top: `${blob.initialY}%`,
            }}
            animate={{
              x: blob.moveX,
              y: blob.moveY,
              scale: [1, 1.3, 0.85, 1.2, 1],
            }}
            transition={{
              duration: blob.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Base gradient overlay with more movement */}
      <motion.div
        className={styles.gradientOverlay}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${displayColors.join(", ")})`,
        }}
        animate={{
          backgroundPosition: [
            "0% 0%",
            "100% 100%",
            "50% 100%",
            "100% 0%",
            "0% 50%",
            "0% 0%",
          ],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated mesh gradient points */}
      <div className={styles.meshGradient}>
        {meshGradientAnimations.map((animation) => (
          <motion.div
            key={`${animation.color}-${animation.index}`}
            className={styles.meshPoint}
            style={{
              background: `radial-gradient(circle, ${animation.color}80, ${animation.color}40, transparent)`,
              left: `${(animation.index * 25) % 100}%`,
              top: `${(Math.floor(animation.index / 4) * 40) % 100}%`,
            }}
            animate={{
              scale: [1, 1.8, 0.7, 1.5, 1],
              opacity: [0.4, 0.8, 0.3, 0.7, 0.4],
              x: animation.x,
              y: animation.y,
            }}
            transition={{
              duration: 12 + animation.index * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
