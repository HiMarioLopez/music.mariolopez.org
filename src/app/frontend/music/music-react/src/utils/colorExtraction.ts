/**
 * Utility functions to extract colors from images
 * Used to generate dynamic background colors from album artwork
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Extracts dominant colors from an image URL
 * Returns an array of RGB colors sorted by prominence
 */
export const extractColorsFromImage = async (
  imageUrl: string,
  colorCount: number = 5,
): Promise<RGB[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Try to set crossOrigin, but handle CORS errors gracefully
    let corsError = false;
    try {
      img.crossOrigin = 'anonymous';
    } catch (e) {
      corsError = true;
    }

    // Set a timeout to avoid hanging
    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size (smaller for performance)
        canvas.width = 100;
        canvas.height = 100;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data - handle CORS errors
        let imageData;
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (corsError) {
          // If CORS blocks image data access, use a fallback approach
          console.warn('CORS blocked image data access, using fallback colors');
          reject(new Error('CORS blocked'));
          return;
        }

        const data = imageData.data;

        // Extract colors and count occurrences
        const colorMap = new Map<string, { rgb: RGB; count: number }>();

        // Sample pixels (every 4th pixel for performance)
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize colors to reduce similar shades
          const quantizedR = Math.round(r / 32) * 32;
          const quantizedG = Math.round(g / 32) * 32;
          const quantizedB = Math.round(b / 32) * 32;

          const key = `${quantizedR},${quantizedG},${quantizedB}`;
          const rgb: RGB = { r: quantizedR, g: quantizedG, b: quantizedB };

          if (colorMap.has(key)) {
            colorMap.get(key)!.count++;
          } else {
            colorMap.set(key, { rgb, count: 1 });
          }
        }

        // Convert to array and sort by count (most prominent first)
        const colors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, colorCount)
          .map((item) => item.rgb);

        // If we don't have enough colors, fill with variations
        if (colors.length < colorCount && colors.length > 0) {
          const baseColor = colors[0];
          while (colors.length < colorCount) {
            const variation = {
              r: Math.max(0, Math.min(255, baseColor.r + (Math.random() - 0.5) * 60)),
              g: Math.max(0, Math.min(255, baseColor.g + (Math.random() - 0.5) * 60)),
              b: Math.max(0, Math.min(255, baseColor.b + (Math.random() - 0.5) * 60)),
            };
            colors.push(variation);
          }
        }

        resolve(colors.length > 0 ? colors : getDefaultColors());
      } catch (error) {
        clearTimeout(timeout);
        console.error('Error extracting colors:', error);
        reject(error);
      }
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      console.warn('Image load error:', error);
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
};

/**
 * Converts RGB object to hex string
 */
export const rgbToHex = (rgb: RGB): string => {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;
};

/**
 * Converts RGB object to CSS rgb string
 */
export const rgbToCss = (rgb: RGB): string => {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};

/**
 * Gets default fallback colors
 */
export const getDefaultColors = (): RGB[] => {
  return [
    { r: 250, g: 87, b: 60 },   // #fa573c
    { r: 97, g: 218, b: 251 },  // #61dafb
    { r: 96, g: 164, b: 244 },  // #60a4f4
    { r: 250, g: 87, b: 60 },   // #fa573c
    { r: 31, g: 35, b: 120 },   // #1f2378
  ];
};

/**
 * Generates vibrant colors if extraction fails
 * Creates a colorful palette based on a seed color
 */
export const generateVibrantColors = (seedColor?: RGB): RGB[] => {
  if (seedColor) {
    // Generate variations from seed color
    const colors: RGB[] = [seedColor];
    const hue = rgbToHue(seedColor);
    
    for (let i = 1; i < 5; i++) {
      const newHue = (hue + (i * 72)) % 360; // Spread colors around color wheel
      colors.push(hueToRgb(newHue, 70, 50));
    }
    return colors;
  }
  
  return getDefaultColors();
};

/**
 * Converts RGB to HSL hue value
 */
const rgbToHue = (rgb: RGB): number => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / (max - min)) % 6;
  } else if (max === g) {
    h = (b - r) / (max - min) + 2;
  } else {
    h = (r - g) / (max - min) + 4;
  }
  
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
};

/**
 * Converts HSL hue to RGB
 */
const hueToRgb = (h: number, s: number, l: number): RGB => {
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = (l / 100) - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

