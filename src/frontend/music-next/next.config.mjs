/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
    assetPrefix: isProd ? 'https://music.mariolopez.org/next' : '',
};

export default nextConfig;
