import './globals.css';
import AppShell from '../components/AppShell';
import { ThemeProvider } from '../context/ThemeContext';

export const metadata = {
  title: 'dapur.aduhp.com — 1 Admin 3 Platform (Web, Android, iPhone)',
  description: 'Admin Panel Rahasia aduHP: Kelola HP Baru (BNIB), HP Second Grade A+, IMEI, dan Quality Control 35 Titik Inspeksi terintegrasi ke Supabase.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('dapur_theme');
                  var theme = saved ? saved : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
