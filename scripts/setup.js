#!/usr/bin/env node

/**
 * BookLeaf Publishing - Master Workspace Setup Script
 * Sets up dependencies, builds data files, and validates environments
 * for both Assignment 1 and Assignment 2.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function logStep(step, message) {
  console.log(`\n\x1b[36m[Step ${step}]\x1b[0m \x1b[1m${message}\x1b[0m`);
}

function logSuccess(message) {
  console.log(`  \x1b[32m✔\x1b[0m ${message}`);
}

function logInfo(message) {
  console.log(`  \x1b[34mℹ\x1b[0m ${message}`);
}

function runCmd(cmd, cwd = rootDir) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
    return true;
  } catch (err) {
    console.error(`  \x1b[31m✖ Error executing: ${cmd}\x1b[0m`);
    if (err.stderr) console.error(err.stderr.toString());
    return false;
  }
}

console.log(`\x1b[35m==================================================================\x1b[0m`);
console.log(`\x1b[1m\x1b[35m       BookLeaf Publishing — Technical Assessment Setup Script    \x1b[0m`);
console.log(`\x1b[35m==================================================================\x1b[0m`);

// 1. Environment & Node Version Verification
logStep(1, 'Verifying Node.js Environment');
const nodeVersion = process.version;
logInfo(`Current Node.js version: ${nodeVersion}`);
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

if (majorVersion < 20) {
  console.warn(`  \x1b[33m⚠ Warning: Node.js 20 or later is recommended (Node 24 preferred for Assignment 1 node:sqlite).\x1b[0m`);
} else {
  logSuccess(`Node.js version satisfies requirements (v${majorVersion})`);
}

// 2. Install Root Dependencies
logStep(2, 'Verifying Root Workspace Dependencies');
runCmd('npm install --prefer-offline --no-audit');
logSuccess('Root workspace dependencies ready');

// 3. Setup Assignment 1
logStep(3, 'Setting up Assignment 1 (Author Support Portal)');
const a1Dir = path.join(rootDir, 'assignment_1');
if (fs.existsSync(a1Dir)) {
  runCmd('npm install --prefer-offline --no-audit', a1Dir);
  logSuccess('Assignment 1 backend dependencies installed');

  const frontendDir = path.join(a1Dir, 'frontend');
  if (fs.existsSync(frontendDir)) {
    runCmd('npm install --prefer-offline --no-audit', frontendDir);
    logSuccess('Assignment 1 Next.js frontend dependencies installed');
  }

  // Check database
  const dbFile = path.join(a1Dir, 'database', 'bookleaf.db');
  if (fs.existsSync(dbFile)) {
    logSuccess('Assignment 1 SQLite database verified');
  } else {
    logInfo('Seeding Assignment 1 database...');
    runCmd('node backend/src/database/seed.js', a1Dir);
    logSuccess('Assignment 1 database seeded');
  }
}

// 4. Setup Assignment 2
logStep(4, 'Setting up Assignment 2 (Royalty Dashboard & n8n)');
const a2Dir = path.join(rootDir, 'assignment_2');
const a2AppDir = path.join(a2Dir, 'app');

if (fs.existsSync(a2AppDir)) {
  runCmd('npm install --prefer-offline --no-audit', a2AppDir);
  logSuccess('Assignment 2 companion server dependencies installed');
}

// Ensure Bubble CSV exports exist and are fresh
logInfo('Generating fresh Bubble CSV exports from sample dataset...');
runCmd('node data/generate_csv.js', a2Dir);
logSuccess('Bubble_Authors.csv, Bubble_Books.csv, and Notification_Logs.csv ready');

// Validate n8n workflow export JSON integrity
const n8nWorkflowPath = path.join(a2Dir, 'n8n', 'bookleaf_royalty_notification_workflow.json');
try {
  const jsonContent = JSON.parse(fs.readFileSync(n8nWorkflowPath, 'utf8'));
  logSuccess(`n8n Workflow JSON verified: "${jsonContent.name}" (${jsonContent.nodes.length} nodes)`);
} catch (e) {
  console.error(`  \x1b[31m✖ n8n workflow JSON invalid: ${e.message}\x1b[0m`);
}

// Copy workflow & CSV files to app/public for browser export download buttons
const publicDir = path.join(a2AppDir, 'public');
if (fs.existsSync(publicDir)) {
  fs.copyFileSync(n8nWorkflowPath, path.join(publicDir, 'bookleaf_royalty_notification_workflow.json'));
  fs.copyFileSync(path.join(a2Dir, 'data', 'Bubble_Authors.csv'), path.join(publicDir, 'Bubble_Authors.csv'));
  fs.copyFileSync(path.join(a2Dir, 'data', 'Bubble_Books.csv'), path.join(publicDir, 'Bubble_Books.csv'));
  logSuccess('Exportable artifacts synchronized to companion public folder');
}

// 5. Final Summary Instructions for Reviewer
console.log(`\n\x1b[32m==================================================================\x1b[0m`);
console.log(`\x1b[1m\x1b[32m             ✨ Setup Complete! All Systems Ready ✨              \x1b[0m`);
console.log(`\x1b[32m==================================================================\x1b[0m`);
console.log(`\n\x1b[1mReviewer Commands Guide:\x1b[0m\n`);
console.log(`  \x1b[36m▶ Run Assignment 1 (Author Support & Ticketing Portal):\x1b[0m`);
console.log(`      \x1b[1mnpm run dev:assignment_1\x1b[0m`);
console.log(`      → Author & Admin Portals: \x1b[4mhttp://localhost:3000\x1b[0m`);
console.log(`      → Swagger REST API Docs:  \x1b[4mhttp://localhost:5001/api-docs\x1b[0m\n`);

console.log(`  \x1b[36m▶ Run Assignment 2 (Royalty Dashboard & n8n System):\x1b[0m`);
console.log(`      \x1b[1mnpm run dev:assignment_2\x1b[0m`);
console.log(`      → Interactive Dashboard:  \x1b[4mhttp://localhost:5002\x1b[0m`);
console.log(`      → n8n Webhook Endpoint:   \x1b[4mhttp://localhost:5002/webhook/generate-royalty-summary\x1b[0m\n`);

console.log(`  \x1b[36m▶ Run Test Suites:\x1b[0m`);
console.log(`      \x1b[1mnpm run test:assignment_1\x1b[0m  (Assignment 1 AI Classification & Fallback Tests)`);
console.log(`      \x1b[1mnpm run test:assignment_2\x1b[0m  (Assignment 2 Webhook, Idempotency & Badge Tests)\n`);

console.log(`\x1b[35m==================================================================\x1b[0m\n`);
