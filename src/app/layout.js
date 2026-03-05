import "./globals.css";

export const metadata = {
  title: "pa-Queue – Collaborative Event Music",
  description: "Let your guests suggest and vote on songs in real-time. A collaborative music layer over Spotify for events, parties, and gatherings.",
  keywords: "music, spotify, collaborative, queue, event, party, DJ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {children}
      </body>
    </html>
  );
}
