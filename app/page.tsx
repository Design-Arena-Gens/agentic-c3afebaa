"use client";

import React from 'react';
import JSZip from 'jszip';

type ApiResultItem = {
  filename: string;
  mimeType: string;
  summary: {
    wordCount?: number;
    lineCount?: number;
    paragraphCount?: number;
    sheetNames?: string[];
    recordCount?: number;
  };
  json: unknown;
  csv: string;
  warnings?: string[];
};

export default function Page() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState<ApiResultItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) {
      setFiles(prev => [...prev, ...dropped]);
    }
  }

  async function convert() {
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      const res = await fetch('/api/convert', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Conversion failed (${res.status})`);
      const data = await res.json();
      setResults(data.items as ApiResultItem[]);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function downloadAllZip() {
    if (!results) return;
    const zip = new JSZip();
    for (const item of results) {
      const base = item.filename.replace(/\.[^.]+$/, '');
      zip.file(`${base}.json`, JSON.stringify(item.json, null, 2));
      zip.file(`${base}.csv`, item.csv || '');
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadSingle(item: ApiResultItem, kind: 'json' | 'csv') {
    const base = item.filename.replace(/\.[^.]+$/, '');
    const data = kind === 'json' ? JSON.stringify(item.json, null, 2) : item.csv || '';
    const blob = new Blob([data], { type: kind === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Document to JSON/CSV Converter</h1>
        <p className="muted">Upload PDF, DOCX, TXT, HTML, CSV, or XLSX. We extract structured JSON and a CSV representation for download.</p>

        <label
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <input type="file" multiple hidden onChange={onPick} />
          <div>
            Drag & drop files here or click to choose
          </div>
        </label>

        {files.length > 0 && (
          <div className="files">
            {files.map((f, idx) => (
              <span className="badge" key={idx}>{f.name}</span>
            ))}
          </div>
        )}

        <div className="actions">
          <button className="button" onClick={convert} disabled={busy || files.length === 0}>
            {busy ? 'Converting?' : 'Convert'}
          </button>
          <button className="button secondary" onClick={() => { setFiles([]); setResults(null); setError(null); }} disabled={busy}>Clear</button>
          {results && results.length > 0 && (
            <button className="button secondary" onClick={downloadAllZip}>Download All (ZIP)</button>
          )}
        </div>

        {error && (
          <div className="result" style={{ marginTop: 16, color: '#ffb4b4', borderColor: '#5a1e1e', background: '#251018' }}>
            {error}
          </div>
        )}

        {results && (
          <div className="grid" style={{ marginTop: 16 }}>
            {results.map((item, idx) => (
              <div className="result" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.filename}</div>
                    <div className="muted" style={{ margin: 0, fontSize: 12 }}>{item.mimeType}</div>
                    {item.summary && (
                      <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                        {item.summary.recordCount != null && <span>{item.summary.recordCount} records</span>}
                        {item.summary.paragraphCount != null && <span> ? {item.summary.paragraphCount} paragraphs</span>}
                        {item.summary.wordCount != null && <span> ? {item.summary.wordCount} words</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="button secondary" onClick={() => downloadSingle(item, 'json')}>JSON</button>
                    <button className="button secondary" onClick={() => downloadSingle(item, 'csv')}>CSV</button>
                  </div>
                </div>
                {item.warnings && item.warnings.length > 0 && (
                  <div className="muted" style={{ color: '#ffd27d' }}>{item.warnings.join(' ')}
                  </div>
                )}
                <pre className="code" style={{ marginTop: 12, maxHeight: 300 }}>
                  {typeof item.json === 'string' ? item.json : JSON.stringify(item.json, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        <p className="muted" style={{ marginTop: 24 }}>
          By using this tool you agree not to upload sensitive information.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, color: '#9fb0d7' }}>
        Built for Vercel deployment.
      </div>
    </div>
  );
}
