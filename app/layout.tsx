import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Document to JSON/CSV Converter',
  description: 'Convert documents (PDF, DOCX, TXT, HTML, CSV, XLSX) into structured JSON and CSV.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"' }}>
        {children}
      </body>
    </html>
  );
}
