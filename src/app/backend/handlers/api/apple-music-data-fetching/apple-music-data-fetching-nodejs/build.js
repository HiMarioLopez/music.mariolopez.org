const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
    entryPoints: ['index.ts'],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/index.js',
    external: ['aws-sdk'], // AWS Lambda already includes this
    absWorkingDir: __dirname,
    outbase: '.',
    alias: {
        'shared': path.resolve(__dirname, '../../../shared')
    }
}).catch(() => process.exit(1)); 