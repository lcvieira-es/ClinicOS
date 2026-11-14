import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ClinicOS · gestão integrada para clínicas médicas',
    template: '%s · ClinicOS',
  },
  description:
    'Plataforma multi-clínica para gestão de agenda, prontuário, financeiro e relacionamento com pacientes.',
  applicationName: 'ClinicOS',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-sky-50 text-ink-900">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
