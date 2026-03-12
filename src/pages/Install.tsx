import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20 max-w-lg">
        <div className="text-center mb-8">
          <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Install Our App</h1>
          <p className="text-muted-foreground">Get the full app experience on your phone!</p>
        </div>

        {isInstalled ? (
          <Card className="p-8 text-center bg-card border-primary">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">App Installed! 🎉</h2>
            <p className="text-muted-foreground">You can now use Hotel Jagdamba from your home screen.</p>
          </Card>
        ) : isIOS ? (
          <Card className="p-6 bg-card border-border space-y-6">
            <h2 className="text-xl font-bold text-foreground text-center">Install on iPhone/iPad</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">1</div>
                <p className="text-foreground">Tap the <Share className="inline h-4 w-4" /> <strong>Share</strong> button at the bottom of Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">2</div>
                <p className="text-foreground">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">3</div>
                <p className="text-foreground">Tap <strong>"Add"</strong> to install the app</p>
              </div>
            </div>
          </Card>
        ) : deferredPrompt ? (
          <Card className="p-8 text-center bg-card border-border">
            <Download className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-4">Ready to Install</h2>
            <Button onClick={handleInstall} size="lg" className="bg-primary text-primary-foreground w-full">
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          </Card>
        ) : (
          <Card className="p-6 bg-card border-border space-y-6">
            <h2 className="text-xl font-bold text-foreground text-center">Install on Android</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">1</div>
                <p className="text-foreground">Tap the <MoreVertical className="inline h-4 w-4" /> <strong>menu</strong> button in Chrome</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">2</div>
                <p className="text-foreground">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">3</div>
                <p className="text-foreground">Tap <strong>"Install"</strong> to confirm</p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-foreground text-center">Why install?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '⚡', text: 'Faster loading' },
              { emoji: '📱', text: 'Home screen icon' },
              { emoji: '🔔', text: 'Quick access' },
              { emoji: '🌐', text: 'Works offline' },
            ].map((item, i) => (
              <Card key={i} className="p-3 bg-card border-border text-center">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-sm text-foreground mt-1">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
