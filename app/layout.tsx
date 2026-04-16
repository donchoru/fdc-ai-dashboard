import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FDC AI Dashboard — Semiconductor Fault Detection & Classification',
  description:
    'AI-powered FDC monitoring dashboard for semiconductor fabrication with real-time anomaly detection, SPC analysis, and intelligent root cause analysis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head />
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
