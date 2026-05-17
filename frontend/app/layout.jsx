import '@/styles/tokens.css';
import '@/styles/board.css';

export const metadata = {
  title: 'GlobalTNA — Service Request Board',
  description:
    'Post a job and get matched with vetted plumbers, sparkies, painters, and joiners in your area.',
  icons: { icon: '/assets/logo-mark.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="gtna">{children}</body>
    </html>
  );
}
