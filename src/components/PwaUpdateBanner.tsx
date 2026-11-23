"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appBuildId } from "@/lib/build-id";

type WaitingWorker = ServiceWorker;

function listenForWaiting(
  registration: ServiceWorkerRegistration,
  onWaiting: (worker: WaitingWorker) => void,
) {
  if (registration.waiting) {
    onWaiting(registration.waiting);
    return;
  }

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        onWaiting(installing);
      }
    });
  });
}

export function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const waitingRef = useRef<WaitingWorker | null>(null);
  const clientBuild = appBuildId();
  const reloadingRef = useRef(false);

  const applyUpdate = useCallback(() => {
    const worker = waitingRef.current;
    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    reloadingRef.current = true;
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    const onWaiting = (worker: WaitingWorker) => {
      waitingRef.current = worker;
      setVisible(true);
    };

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.register("/sw.js").then((reg) => {
      registration = reg;
      listenForWaiting(reg, onWaiting);
    });

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void registration?.update();
        void checkRemoteBuild();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    async function checkRemoteBuild() {
      try {
        const res = await fetch("/api/healthz", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { build?: string };
        if (json.build && json.build !== clientBuild && json.build !== "dev") {
          waitingRef.current = null;
          setVisible(true);
        }
      } catch {
        /* ignore */
      }
    }

    const interval = window.setInterval(() => {
      void registration?.update();
      void checkRemoteBuild();
    }, 5 * 60 * 1000);

    void checkRemoteBuild();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.clearInterval(interval);
    };
  }, [clientBuild]);

  if (!visible) return null;

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <p className="update-banner-text">Nova versão disponível</p>
      <button type="button" className="update-banner-btn touch-target-sm" onClick={applyUpdate}>
        Atualizar
      </button>
    </div>
  );
}