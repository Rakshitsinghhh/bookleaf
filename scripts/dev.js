import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting BookLeaf Publishing Full-Stack Platform...');
console.log('   - Backend Server on http://localhost:5001');
console.log('   - Frontend Portal on http://localhost:3000');
console.log('   - Interactive Swagger API Docs on http://localhost:5001/api-docs\n');

const backend = spawn('node', ['--watch', 'backend/src/server.js'], {
  cwd: rootDir,
  stdio: 'inherit'
});

const frontend = spawn('npm', ['run', 'dev', '--prefix', 'frontend'], {
  cwd: rootDir,
  stdio: 'inherit'
});

function cleanup() {
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
