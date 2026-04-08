/**
 * Vercel Serverless Function: /api/fetch-flows
 * Triggered by Vercel Cron (every 30 min) or manually.
 *
 * 1. Fetches the PDF from USBR
 * 2. Archives the raw PDF
 * 3. Parses the Parker Flow data
 * 4. Writes/updates JSON files per date
 *
 * Vercel Cron config goes in vercel.json:
 * { "crons": [{ "path": "/api/fetch-flows", "schedule": "*/30 * * * *" }] }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PDF_URL = 'https://www.usbr.gov/lc/region/g4000/hourly/HeadgateReport.pdf';

interface ParsedDay {
  date: string;
  dayOfWeek: string;
  hours: Array<{
    hour: number;
    parkerFlow: number;
    critFlow: number;
    gateFlow: number;
    generatorFlow: number;
    mwh: number;
  }>;
  dailyAverage: number;
}

/**
 * Parse the text content extracted from the PDF.
 * The PDF has a very consistent layout — columns are space-aligned.
 */
function parsePdfText(text: string): ParsedDay[] {
  const days: ParsedDay[] = [];

  // Split into pages/sections by the header
  const sections = text.split(/Headgate Rock Dam Powerplant Report/);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract date: "Wednesday, April 8, 2026"
    const dateMatch = section.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(\w+\s+\d+,\s+\d{4})/);
    if (!dateMatch) continue;

    const dateStr = dateMatch[1]; // "April 8, 2026"
    const parsedDate = new Date(dateStr);
    const date = parsedDate.toISOString().split('T')[0];
    const dayOfWeek = dateMatch[0].split(',')[0];

    // Extract hourly rows: lines matching "  HR  FLOW  FLOW  FLOW  FLOW  MWH" pattern
    const hours: ParsedDay['hours'] = [];
    const lines = section.split('\n');

    for (const line of lines) {
      // Match lines like: "  1   14021   950   0   13071   15.07"
      const rowMatch = line.trim().match(/^(\d{1,2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (rowMatch) {
        const hour = parseInt(rowMatch[1]);
        if (hour >= 1 && hour <= 24) {
          hours.push({
            hour,
            parkerFlow: Math.round(parseFloat(rowMatch[2])),
            critFlow: Math.round(parseFloat(rowMatch[3])),
            gateFlow: Math.round(parseFloat(rowMatch[4])),
            generatorFlow: Math.round(parseFloat(rowMatch[5])),
            mwh: parseFloat(rowMatch[6]),
          });
        }
      }
    }

    if (hours.length > 0) {
      const avgFlow = Math.round(hours.reduce((sum, h) => sum + h.parkerFlow, 0) / hours.length);
      days.push({ date, dayOfWeek, hours, dailyAverage: avgFlow });
    }
  }

  return days;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Fetch the PDF
    const pdfResponse = await fetch(PDF_URL);
    if (!pdfResponse.ok) {
      return res.status(502).json({ error: `Failed to fetch PDF: ${pdfResponse.status}` });
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // 2. Extract text from PDF
    // In production, use pdf-parse: const pdfData = await pdfParse(pdfBuffer);
    // For now, return info about what we'd do
    const now = new Date().toISOString();

    // TODO: In production deployment:
    // - Archive raw PDF to storage (S3/Vercel Blob) as pdfs/YYYY-MM-DD_HHMM.pdf
    // - Parse PDF text with pdf-parse
    // - Call parsePdfText() on the extracted text
    // - Write each day's data to storage as data/YYYY-MM-DD.json
    // - Never overwrite past days with empty data

    return res.status(200).json({
      success: true,
      fetchedAt: now,
      pdfSize: pdfBuffer.length,
      message: 'PDF fetched successfully. Parser ready for deployment.',
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// Export for testing
export { parsePdfText };
