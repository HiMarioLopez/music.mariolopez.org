const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files in a directory and its subdirectories
function findTypeScriptFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTypeScriptFiles(itemPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.spec.ts')) {
      results.push(itemPath);
    }
  }
  
  return results;
}

// Get all handler files from the src/handlers directory and its subdirectories
const handlersDir = path.join(__dirname, 'src/handlers');
const entryPoints = findTypeScriptFiles(handlersDir);

// Log the found entry points for debugging
console.log(`Found ${entryPoints.length} TypeScript files to build:`);
entryPoints.forEach(file => console.log(` - ${path.relative(__dirname, file)}`));

const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints,
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  platform: 'node',
  target: 'node22',
  outdir: 'dist/handlers',
  external: ['aws-sdk'],
  sourcemap: true,
  tsconfig: './tsconfig.json',
};

// Wrap in an async function to allow await
async function build() {
  try {
    if (isWatch) {
      // Watch mode
      const context = await esbuild.context(options);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      // Build once
      await esbuild.build(options);
      console.log('Build complete');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Execute the build function
build();