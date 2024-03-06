'use client';

export default function staticImageLoader({ src, width, quality }: { src: string, width: number, quality: number }) {
    return `${src}`;
}