"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function InstallPWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [iosTipOpen, setIosTipOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setMounted(true);
      return;
    }

    setIos(isIos());

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    const onInstalled = () => {
      setDeferred(null);
      setIosTipOpen(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    setMounted(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onInstall = useCallback(async () => {
    if (ios) {
      setIosTipOpen((v) => !v);
      return;
    }
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setDeferred(null);
    } finally {
      setBusy(false);
    }
  }, [deferred, ios]);

  if (!mounted || isStandalone()) return null;

  const visible = Boolean(deferred) || ios;
  if (!visible) return null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onInstall}
        disabled={busy}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-colors hover:border-[rgba(61,155,253,0.35)] hover:bg-[rgba(61,155,253,0.15)] hover:text-[var(--text)] disabled:opacity-50"
        title={ios ? "Adicionar à tela inicial" : "Instalar aplicativo"}
        aria-label={ios ? "Como adicionar à tela inicial" : "Instalar aplicativo"}
        aria-expanded={ios ? iosTipOpen : undefined}
      >
        <DownloadIcon />
      </button>
      {ios && iosTipOpen ? (
        <div
          role="status"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-xs leading-relaxed text-[var(--muted)] shadow-lg"
        >
          No Safari, toque em <strong className="text-[var(--text)]">Compartilhar</strong> e escolha{" "}
          <strong className="text-[var(--text)]">Adicionar à Tela de Início</strong>.
        </div>
      ) : null}
    </div>
  );
}