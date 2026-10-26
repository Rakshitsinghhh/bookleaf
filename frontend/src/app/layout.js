import "./globals.css";

export const metadata = {
  title: "BookLeaf Publishing • Author Support & Communication Portal",
  description: "Internal Author Support and Operations Portal powered by AI-assisted response generation for BookLeaf Publishing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
