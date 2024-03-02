/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
    /**
     * Exporting as a static site for production builds. This requires a custom image loader.
     * REF: https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
     */
    output: isProd ? 'export' : 'standalone',

    /**
     * A loader is a function returning a URL string for the image, given the parameters 'src',
     * 'width', and 'quality'. Setting this here will configure every instance of next/image in
     * your application, without passing a prop.
     * REF: https://nextjs.org/docs/pages/api-reference/next-config-js/images
     */
    images: isProd ? {
        loader: 'custom',
        loaderFile: './src/utilities/static-image-loader.ts',
    } : undefined,

    /**
     * Matches the output directory from all other projects.
     * REF: https://nextjs.org/docs/pages/api-reference/next-config-js/distDir
     */
    distDir: 'dist',

    /**
     * To deploy a Next.js application under a sub-path of a domain you can use the basePath config
     * option. When using the next/image component, you will need to add the basePath in front of src.
     * REF: https://nextjs.org/docs/pages/api-reference/next-config-js/basePath
     */
    basePath: isProd ? '/next' : '',

    /**
     * Next.js will automatically use your asset prefix for the JavaScript and CSS files it loads
     * from the /_next/ path (.next/static/ folder). This is NOT for the images, unfortunately.
     * REF: https://nextjs.org/docs/pages/api-reference/next-config-js/assetPrefix
    */
    assetPrefix: isProd ? 'https://music.mariolopez.org/next' : undefined,
};

export default nextConfig;
