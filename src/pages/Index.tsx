import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Menu } from '@/components/Menu';
import { ComboSection } from '@/components/ComboSection';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Footer } from '@/components/Footer';
import { FloatingCart } from '@/components/FloatingCart';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Menu />
      <ComboSection />
      <PhotoGallery />
      <Footer />
      <FloatingCart />
    </div>
  );
};

export default Index;
