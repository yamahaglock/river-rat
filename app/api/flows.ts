/**
 * Vercel Serverless Function: GET /api/flows?date=YYYY-MM-DD
 * Serves archived flow data to the frontend.
 *
 * In production, this reads from stored JSON files.
 * For now, it's a placeholder that shows the expected API shape.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { date } = req.query;

  // List available dates
  const available = getAvailableDates();

  if (date && typeof date === 'string') {
    const filePath = join(DATA_DIR, `${date}.json`);
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      return res.status(200).json({ data, available });
    }
    return res.status(200).json({ data: null, available });
  }

  // No date specified — return latest
  if (available.length > 0) {
    const latest = available[available.length - 1];
    const filePath = join(DATA_DIR, `${latest}.json`);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    return res.status(200).json({ data, available });
  }

  return res.status(200).json({ data: null, available: [] });
}

function getAvailableDates(): string[] {
  if (!existsSync(DATA_DIR)) return [];
  return readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
}
