import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local .env

function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  // On serverless/read-only environments (Vercel, AWS Lambda)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    const tmpDb = '/tmp/bookleaf.db';
    if (!fs.existsSync(tmpDb)) {
      const candidates = [
        path.resolve(__dirname, '../../database/bookleaf.db'),
        path.resolve(__dirname, '../../../database/bookleaf.db'),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          try {
            fs.copyFileSync(cand, tmpDb);
            break;
          } catch (e) {
            console.warn('Could not copy db to /tmp:', e.message);
          }
        }
      }
    }
    return tmpDb;
  }

  // Normal local / persistent environment (Render, Railway, local)
  const candidates = [
    path.resolve(__dirname, '../../database/bookleaf.db'),
    path.resolve(__dirname, '../../../database/bookleaf.db'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }

  return path.resolve(__dirname, '../../database/bookleaf.db');
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  jwtSecret: process.env.JWT_SECRET || 'bookleaf-secret-key-production-ready-2026',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  dbPath: resolveDbPath(),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
