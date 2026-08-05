import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MessageCircle, ShoppingBag, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/jagdamba-logo.png';
import { t } from '@/lib/translations';

export const Hero = () => {
  const { language } = useCart();
  const navigate = useNavigate();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-primary/60 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-accent rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-1/3 w-4 h-4 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="mb-8 flex justify-center animate-scale-in">
          <img 
            src={logo} 
            alt="Hotel Jagdamba" 
            className="h-32 md:h-48 w-auto animate-glow-pulse"
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up text-foreground">
          {t('heroTitle', language)}
        </h1>

        <p className="text-xl md:text-3xl mb-8 text-primary animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {t('heroSubtitle', language)}
        </p>

        <p className="text-muted-foreground mb-12 text-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          📍 Masur–Shamgaon Road, Masur | 📞 8380809079 / 9860403842
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button 
            size="lg"
            onClick={scrollToMenu}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.8)] transition-all"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {t('orderNow', language)}
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            asChild
          >
            <a href="https://wa.me/918380809079" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              {t('whatsappOrder', language)}
            </a>
          </Button>
          {!isStandalone && (
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate('/install')}
            >
              <Download className="mr-2 h-5 w-5" />
              {language === 'mr' ? 'अॅप इन्स्टॉल करा' : language === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App'}
            </Button>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
