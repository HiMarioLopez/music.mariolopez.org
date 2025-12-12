import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildTime = new Date().toISOString();
const content = `// This file is auto-generated during build time
// Do not edit manually
export const BUILD_TIME = '${buildTime}';
`;

const outputPath = join(__dirname, '..', 'src', 'generated', 'build-time.ts');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, 'utf-8');

console.log(`Generated build time: ${buildTime}`);

