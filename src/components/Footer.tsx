import { useCart } from '@/contexts/CartContext';
import { MapPin, Phone, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/jagdamba-logo.jpg';
import { t } from '@/lib/translations';

export const Footer = () => {
  const { language } = useCart();

  return (
    <footer id="contact" className="bg-secondary border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <img 
              src={logo} 
              alt="Hotel Jagdamba" 
              className="h-20 w-auto mx-auto md:mx-0 mb-4"
            />
            <p className="text-muted-foreground">
              {t('pureVegService', language)}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">
              {t('contactUs', language)}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Masur–Shamgaon Road, Masur
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="border-2 border-accent bg-accent/10 rounded-md p-3 space-y-2">
                    <div className="text-muted-foreground">
                      <a href="tel:8380809079" className="font-semibold hover:text-primary transition-colors">
                        8380809079
                      </a>
                      <span className="mx-2">:</span>
                      <span>Somnath Chikane</span>
                    </div>
                    <div className="text-muted-foreground">
                      <a href="tel:9860403842" className="font-semibold hover:text-primary transition-colors">
                        9860403842
                      </a>
                      <span className="mx-2">:</span>
                      <span>Ganesh Chikane</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">
              {t('hours', language)}
            </h3>
            <p className="text-muted-foreground">
              {t('openDaily', language)}
            </p>
            <p className="text-muted-foreground mb-4">
              {t('callForHours', language)}
            </p>
            <Link
              to="/track-order"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Search className="h-4 w-4" />
              Track Your Order
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground mb-4">
            © 2025 Hotel Jagdamba. {t('allRightsReserved', language)}
          </p>
          <div className="mt-4">
            <p className="neon-text animate-neon-glow text-sm md:text-base tracking-wider transition-all duration-300">
              Web Developer: <span className="font-bold">AJINKYA ARUN CHALKE</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
