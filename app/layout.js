import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'dapur.aduhp.com — 1 Admin 3 Platform (Web, Android, iPhone)',
  description: 'Admin Panel Rahasia aduHP: Kelola HP Baru (BNIB), HP Second Grade A+, IMEI, dan Quality Control 35 Titik Inspeksi terintegrasi ke Supabase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
