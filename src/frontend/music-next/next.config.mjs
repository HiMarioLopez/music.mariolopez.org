/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
    output: isProd ? 'export' : 'standalone',
    distDir: 'dist', // Matches the output directory from all other projects
    basePath: isProd ? '/next' : '',
    assetPrefix: isProd ? 'https://music.mariolopez.org/next' : '',
    images: {
        loader: 'custom',
        loaderFile: './image-loader.ts',
    }
};

export default nextConfig;
