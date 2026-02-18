import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import "./index.css";

type AnimatedBackgroundProps = {
  colors: string[];
};

type Blob = {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  moveX: [string, string, string];
  moveY: [string, string, string];
};

type MeshPoint = {
  color: string;
  index: number;
  x: [string, string];
  y: [string, string];
};

const DEFAULT_COLORS = ["#42b883", "#35495e", "#41d1ff", "#2f495e", "#6ee7b7"];

const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const AnimatedBackground = ({ colors }: AnimatedBackgroundProps) => {
  const [isMobile, setIsMobile] = useState(false);

  const displayColors = useMemo(() => {
    return colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  }, [colors]);

  const colorsKey = useMemo(() => displayColors.join(","), [displayColors]);

  const blobs = useMemo<Blob[]>(() => {
    const blobCount = isMobile ? 6 : 10;
    const newBlobs: Blob[] = [];

    for (let index = 0; index < blobCount; index += 1) {
      const random = seededRandom(index + colorsKey.length);
      const baseX = random() * 100;
      const baseY = random() * 100;

      newBlobs.push({
        id: index,
        initialX: baseX,
        initialY: baseY,
        size: isMobile ? 250 + random() * 200 : 400 + random() * 350,
        color: displayColors[index % displayColors.length],
        duration: 25 + random() * 20,
        delay: random() * 8,
        moveX: [
          `${(random() - 0.5) * 60}%`,
          `${(random() - 0.5) * 60}%`,
          `${(random() - 0.5) * 60}%`,
        ],
        moveY: [
          `${(random() - 0.5) * 60}%`,
          `${(random() - 0.5) * 60}%`,
          `${(random() - 0.5) * 60}%`,
        ],
      });
    }

    return newBlobs;
  }, [isMobile, displayColors, colorsKey]);

  const meshPoints = useMemo<MeshPoint[]>(() => {
    return displayColors.map((color, index) => {
      const random = seededRandom(index + colorsKey.length + 1000);
      return {
        color,
        index,
        x: [`${(random() - 0.5) * 20}%`, `${(random() - 0.5) * 20}%`],
        y: [`${(random() - 0.5) * 20}%`, `${(random() - 0.5) * 20}%`],
      };
    });
  }, [displayColors, colorsKey]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.innerHeight < 600);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const getBlobStyle = (blob: Blob): JSX.CSSProperties => {
    return {
      background: `radial-gradient(circle, ${blob.color}80, ${blob.color}40, ${blob.color}20)`,
      width: `${blob.size}px`,
      height: `${blob.size}px`,
      left: `${blob.initialX}%`,
      top: `${blob.initialY}%`,
      "--blob-duration": `${blob.duration}s`,
      "--blob-delay": `${blob.delay}s`,
      "--blob-x-start": blob.moveX[0],
      "--blob-x-mid": blob.moveX[1],
      "--blob-x-end": blob.moveX[2],
      "--blob-y-start": blob.moveY[0],
      "--blob-y-mid": blob.moveY[1],
      "--blob-y-end": blob.moveY[2],
    } as unknown as JSX.CSSProperties;
  };

  const getMeshPointStyle = (point: MeshPoint): JSX.CSSProperties => {
    return {
      background: `radial-gradient(circle, ${point.color}80, ${point.color}40, transparent)`,
      left: `${(point.index * 25) % 100}%`,
      top: `${(Math.floor(point.index / 4) * 40) % 100}%`,
      "--mesh-duration": `${12 + point.index * 2}s`,
      "--mesh-delay": `${point.index * 0.3}s`,
      "--mesh-x-start": point.x[0],
      "--mesh-x-end": point.x[1],
      "--mesh-y-start": point.y[0],
      "--mesh-y-end": point.y[1],
    } as unknown as JSX.CSSProperties;
  };

  return (
    <div className="animated-background-container">
      <div className="animated-background-blobs-container">
        {blobs.map((blob) => (
          <div
            key={`${blob.id}-${blob.color}`}
            className="animated-background-blob"
            style={getBlobStyle(blob)}
          />
        ))}
      </div>

      <div
        className="animated-background-gradient-overlay"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${displayColors.join(", ")})`,
        }}
      />

      <div className="animated-background-mesh-gradient">
        {meshPoints.map((point) => (
          <div
            key={`${point.color}-${point.index}`}
            className="animated-background-mesh-point"
            style={getMeshPointStyle(point)}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
