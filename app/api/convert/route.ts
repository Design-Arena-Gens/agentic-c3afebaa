import { NextRequest, NextResponse } from 'next/server';
import { convertBufferToStructured, convertStructuredToCsv, safeStringify } from '@/lib/converters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const fileEntries = form.getAll('files');
    if (!fileEntries || fileEntries.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const items = await Promise.all(
      fileEntries.map(async (entry) => {
        if (!(entry instanceof File)) {
          return { filename: 'unknown', mimeType: 'application/octet-stream', json: { error: 'Invalid file entry' }, csv: '' };
        }
        const ab = await entry.arrayBuffer();
        const buffer = Buffer.from(ab);
        const structured = await convertBufferToStructured(entry.name, buffer);
        const csv = convertStructuredToCsv(structured);
        const json = {
          filename: structured.filename,
          mimeType: structured.mimeType,
          summary: structured.summary,
          content: structured.content,
          raw: structured.raw
        };
        return {
          filename: structured.filename,
          mimeType: structured.mimeType,
          summary: structured.summary,
          json,
          csv,
          warnings: structured.warnings,
        };
      })
    );

    return NextResponse.json({ items }, { status: 200 });
  } catch (err: any) {
    const message = err?.message || 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
