/**
 * Fetches the real USBR Headgate Rock Dam PDF, parses it, and writes
 * JSON data files to public/data/ for the app to consume.
 *
 * Also archives the raw PDF to pdfs/ with a timestamp.
 *
 * Usage: npx tsx scripts/fetch-pdf.ts
 *
 * Requires: pdftotext (from poppler) installed on the system.
 *   macOS:  brew install poppler
 *   Linux:  apt-get install poppler-utils
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const PDF_URL = 'https://www.usbr.gov/lc/region/g4000/hourly/HeadgateReport.pdf';
const PROJECT_ROOT = join(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'public', 'data');
const PDF_DIR = join(PROJECT_ROOT, 'pdfs');

interface HourlyFlow {
  hour: number;
  parkerFlow: number;
  critFlow: number;
  gateFlow: number;
  generatorFlow: number;
  mwh: number;
}

interface DailyFlowData {
  date: string;
  dayOfWeek: string;
  fetchedAt: string;
  source: string;
  hours: HourlyFlow[];
  dailyAverage: number;
  isForecast?: boolean;
}

function parsePdfText(text: string): DailyFlowData[] {
  const days: DailyFlowData[] = [];
  const now = new Date().toISOString();

  // Split by the report header to get each day's section
  const sections = text.split(/Headgate Rock Dam Powerplant Report/);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract date line: "Wednesday, April 8, 2026"
    const dateMatch = section.match(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(\w+\s+\d+,\s+\d{4})/
    );
    if (!dateMatch) continue;

    const dayOfWeek = dateMatch[1];
    const dateStr = dateMatch[2]; // "April 8, 2026"
    const parsedDate = new Date(`${dateStr} 00:00:00`);
    const isoDate = [
      parsedDate.getFullYear(),
      String(parsedDate.getMonth() + 1).padStart(2, '0'),
      String(parsedDate.getDate()).padStart(2, '0'),
    ].join('-');

    // Extract hourly data rows
    const hours: HourlyFlow[] = [];
    const lines = section.split('\n');

    for (const line of lines) {
      // Match rows like: "  1   14021   950   0   13071   15.07"
      // Columns are space-separated, hour is 1-24
      const trimmed = line.trim();
      const parts = trimmed.split(/\s+/);

      if (parts.length >= 6) {
        const hour = parseInt(parts[0], 10);
        if (hour >= 1 && hour <= 24) {
          const parkerFlow = Math.round(parseFloat(parts[1]));
          const critFlow = Math.round(parseFloat(parts[2]));
          const gateFlow = Math.round(parseFloat(parts[3]));
          const generatorFlow = Math.round(parseFloat(parts[4]));
          const mwh = parseFloat(parts[5]);

          // Validate: all should be numbers
          if (!isNaN(parkerFlow) && !isNaN(critFlow) && !isNaN(mwh)) {
            hours.push({ hour, parkerFlow, critFlow, gateFlow, generatorFlow, mwh });
          }
        }
      }
    }

    if (hours.length > 0) {
      // Sort by hour just in case
      hours.sort((a, b) => a.hour - b.hour);

      const dailyAverage = Math.round(
        hours.reduce((sum, h) => sum + h.parkerFlow, 0) / hours.length
      );

      days.push({
        date: isoDate,
        dayOfWeek,
        fetchedAt: now,
        source: 'HeadgateReport.pdf',
        hours,
        dailyAverage,
      });
    }
  }

  return days;
}

async function main() {
  console.log('Fetching PDF from USBR...');

  // Fetch the PDF
  const response = await fetch(PDF_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }
  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  // Archive the raw PDF
  mkdirSync(PDF_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const pdfPath = join(PDF_DIR, `${timestamp}.pdf`);
  writeFileSync(pdfPath, pdfBuffer);
  console.log(`Archived PDF: ${pdfPath}`);

  // Write to a temp file for pdftotext
  const tmpPdf = join(PROJECT_ROOT, '.tmp-report.pdf');
  writeFileSync(tmpPdf, pdfBuffer);

  // Extract text using pdftotext with layout preservation
  let text: string;
  try {
    text = execSync(`pdftotext -layout "${tmpPdf}" -`, { encoding: 'utf-8' });
  } finally {
    try { execSync(`rm "${tmpPdf}"`); } catch { /* ignore */ }
  }

  console.log(`Extracted ${text.length} characters of text`);

  // Parse the text
  const days = parsePdfText(text);
  console.log(`Parsed ${days.length} day(s) of data`);

  if (days.length === 0) {
    console.error('No data parsed from PDF! Text preview:');
    console.error(text.substring(0, 500));
    process.exit(1);
  }

  // Determine which days are forecast (in the future)
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  // Write JSON files
  mkdirSync(DATA_DIR, { recursive: true });
  const availableDates: string[] = [];

  // Load existing available dates from index
  const indexPath = join(DATA_DIR, 'index.json');
  if (existsSync(indexPath)) {
    try {
      const existing = JSON.parse(readFileSync(indexPath, 'utf-8'));
      availableDates.push(...(existing.available || []));
    } catch { /* ignore corrupt index */ }
  }

  for (const day of days) {
    day.isForecast = day.date > todayStr;

    const filePath = join(DATA_DIR, `${day.date}.json`);
    writeFileSync(filePath, JSON.stringify(day, null, 2));
    console.log(`  Wrote ${filePath} (${day.hours.length} hours, avg ${day.dailyAverage} CFS${day.isForecast ? ' [forecast]' : ''})`);

    if (!availableDates.includes(day.date)) {
      availableDates.push(day.date);
    }
  }

  // Update the index
  availableDates.sort();
  writeFileSync(indexPath, JSON.stringify({ available: availableDates, updatedAt: new Date().toISOString() }, null, 2));
  console.log(`\nIndex updated: ${availableDates.length} dates available`);

  // Summary
  for (const day of days) {
    const peakFlow = Math.max(...day.hours.map(h => h.parkerFlow));
    const minFlow = Math.min(...day.hours.map(h => h.parkerFlow));
    const goodHours = day.hours.filter(h => h.parkerFlow >= 8000).length;
    console.log(`  ${day.date} (${day.dayOfWeek}): ${minFlow.toLocaleString()}-${peakFlow.toLocaleString()} CFS, ${goodHours}/24 hours above 8k`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
