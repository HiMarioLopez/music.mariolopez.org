const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['index.ts'],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/index.js',
    external: ['aws-sdk'], // AWS Lambda already includes this
    absWorkingDir: __dirname,
    outbase: '.'
}).catch(() => process.exit(1)); 