import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { PwaUpdateBanner } from "@/components/PwaUpdateBanner";
import { appBuildId } from "@/lib/build-id";

export const metadata: Metadata = {
  title: "Histórico de Louvores",
  description: "Controle de louvores cantados — online e offline",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        <div className="mx-auto min-h-screen max-w-3xl px-4 py-5 pb-20">
          <Nav />
          {children}
        </div>
        <PwaUpdateBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APP_BUILD__=${JSON.stringify(appBuildId())};`,
          }}
        />
      </body>
    </html>
  );
}
