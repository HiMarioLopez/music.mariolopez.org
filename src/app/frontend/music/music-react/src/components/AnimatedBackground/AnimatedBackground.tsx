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

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ colors }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [blobs, setBlobs] = useState<Blob[]>([]);

  // Use provided colors or fallback to defaults
  const displayColors = useMemo(() => {
    return colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  }, [colors]);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.innerHeight < 600);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Generate animated blobs based on colors - regenerate when colors change
  useEffect(() => {
    const blobCount = isMobile ? 6 : 10;
    const newBlobs: Blob[] = [];

    for (let i = 0; i < blobCount; i++) {
      const colorIndex = i % displayColors.length;
      const baseX = Math.random() * 100;
      const baseY = Math.random() * 100;

      // Create more interesting movement patterns
      const moveX = [
        `${baseX + (Math.random() - 0.5) * 60}%`,
        `${baseX + (Math.random() - 0.5) * 60}%`,
        `${baseX + (Math.random() - 0.5) * 60}%`,
        `${baseX}%`,
      ];

      const moveY = [
        `${baseY + (Math.random() - 0.5) * 60}%`,
        `${baseY + (Math.random() - 0.5) * 60}%`,
        `${baseY + (Math.random() - 0.5) * 60}%`,
        `${baseY}%`,
      ];

      newBlobs.push({
        id: i,
        initialX: baseX,
        initialY: baseY,
        size: isMobile ? 250 + Math.random() * 200 : 400 + Math.random() * 350,
        color: displayColors[colorIndex],
        duration: 25 + Math.random() * 20, // 25-45 seconds
        moveX,
        moveY,
      });
    }

    setBlobs(newBlobs);
  }, [displayColors, isMobile]);

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
        {displayColors.map((color, index) => (
          <motion.div
            key={`${color}-${index}`}
            className={styles.meshPoint}
            style={{
              background: `radial-gradient(circle, ${color}80, ${color}40, transparent)`,
              left: `${(index * 25) % 100}%`,
              top: `${(Math.floor(index / 4) * 40) % 100}%`,
            }}
            animate={{
              scale: [1, 1.8, 0.7, 1.5, 1],
              opacity: [0.4, 0.8, 0.3, 0.7, 0.4],
              x: [
                `${(Math.random() - 0.5) * 20}%`,
                `${(Math.random() - 0.5) * 20}%`,
              ],
              y: [
                `${(Math.random() - 0.5) * 20}%`,
                `${(Math.random() - 0.5) * 20}%`,
              ],
            }}
            transition={{
              duration: 12 + index * 2,
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
