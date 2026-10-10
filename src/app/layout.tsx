import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import PwaNotificationPrompt from "@/components/PwaNotificationPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viegas Barber | Mais que um corte",
  description: "Barbearia premium por Diogo Viegas. Marcações rápidas, estilos contemporâneos e atendimento de excelência.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Viegas Barber",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#090909",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased selection:bg-red-500/30 selection:text-red-200" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col bg-background text-foreground font-sans transition-colors duration-300`}>
        <ThemeProvider>
          {children}
          <PwaNotificationPrompt />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      registrations.forEach(function(registration) {
                        registration.unregister();
                      });
                    });
                    return;
                  }
                  navigator.serviceWorker.register('/sw.js').then(
                    function() { console.log('PWA ServiceWorker registado com sucesso'); },
                    function(err) { console.log('Erro ao registar PWA SW: ', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
