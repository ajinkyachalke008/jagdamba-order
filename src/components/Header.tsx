import { Phone } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import logo from '@/assets/jagdamba-logo.jpg';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { LoyaltyBadge } from './LoyaltyBadge';
import { t } from '@/lib/translations';

export const Header = () => {
  const { language } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={logo} 
            alt="Hotel Jagdamba" 
            className="h-12 md:h-16 w-auto animate-glow-pulse"
          />
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#home" className="text-foreground hover:text-primary transition-colors">
            {t('home', language)}
          </a>
          <a href="#menu" className="text-foreground hover:text-primary transition-colors">
            {t('menu', language)}
          </a>
          <a href="#about" className="text-foreground hover:text-primary transition-colors">
            {t('about', language)}
          </a>
          <a href="#contact" className="text-foreground hover:text-primary transition-colors">
            {t('contact', language)}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LoyaltyBadge />
          <ThemeToggle />
          <LanguageSelector />
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
            asChild
          >
            <a href="tel:8380809079">
              <Phone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('callNow', language)}</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};
