export default function imageLoader({ src }: { src: string }) {
    const isProd = process.env.NODE_ENV === 'production'

    return isProd
        ? `https://music.mariolopez.org/next${src}`
        : `http://localhost:3000${src}`
}