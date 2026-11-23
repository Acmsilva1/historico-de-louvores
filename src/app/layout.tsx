import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Histórico de Louvores",
  description: "Controle de louvores cantados — online e offline",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Louvores",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1720",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="mx-auto min-h-screen max-w-3xl px-4 py-5">
          <Nav />
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`,
          }}
        />
      </body>
    </html>
  );
}
