import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const IOS_KEY = "avalix:pwa-ios-dismissed";
const ANDROID_KEY = "avalix:pwa-android-dismissed";

function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function isInStandaloneMode() {
  return (
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Já instalado como PWA — não mostra nada
    if (isInStandaloneMode()) return;

    // iOS — mostra instrução de "Adicionar à Tela de Início"
    if (isIOS()) {
      const dismissed = localStorage.getItem(IOS_KEY);
      if (!dismissed) setShowIOS(true);
      return;
    }

    // Android / Chrome — captura o evento nativo de instalação
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissed = localStorage.getItem(ANDROID_KEY);
      if (!dismissed) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowAndroid(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
      setDeferredPrompt(null);
    }
  };

  const dismissAndroid = () => {
    localStorage.setItem(ANDROID_KEY, "1");
    setShowAndroid(false);
  };

  const dismissIOS = () => {
    localStorage.setItem(IOS_KEY, "1");
    setShowIOS(false);
  };

  // Banner Android/Chrome
  if (showAndroid) {
    return (
      <div className="fixed bottom-20 inset-x-0 z-50 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div
            className="rounded-2xl border border-primary/30 shadow-2xl p-4 flex items-center gap-3"
            style={{ background: "var(--gradient-header, #0d111a)" }}
          >
            <img
              src="/logo-avalix.png"
              alt="Avalix"
              className="h-12 w-12 rounded-xl flex-shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Instalar Avalix
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Acesse direto da tela inicial, funciona offline
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="h-9 px-4 rounded-lg btn-primary-corp text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </button>
            <button
              onClick={dismissAndroid}
              className="h-8 w-8 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner iOS — instrução manual
  if (showIOS) {
    return (
      <div className="fixed bottom-20 inset-x-0 z-50 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div
            className="rounded-2xl border border-primary/30 shadow-2xl p-4"
            style={{ background: "var(--gradient-header, #0d111a)" }}
          >
            <div className="flex items-start gap-3">
              <img
                src="/logo-avalix.png"
                alt="Avalix"
                className="h-12 w-12 rounded-xl flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Instalar Avalix no iPhone
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Toque em{" "}
                  <span className="font-bold text-foreground">
                    Compartilhar{" "}
                    <span className="inline-block">⎙</span>
                  </span>{" "}
                  e depois em{" "}
                  <span className="font-bold text-foreground">
                    "Adicionar à Tela de Início"
                  </span>
                </p>
              </div>
              <button
                onClick={dismissIOS}
                className="h-8 w-8 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
