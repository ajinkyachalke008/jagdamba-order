import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Menu } from '@/components/Menu';
import { ComboSection } from '@/components/ComboSection';
import { PhotoGallery } from '@/components/PhotoGallery';
import { BillingSidebar } from '@/components/BillingSidebar';
import { MobileCartButton } from '@/components/MobileCartButton';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Menu />
      <ComboSection />
      <PhotoGallery />
      <BillingSidebar />
      <MobileCartButton />
      <Footer />
    </div>
  );
};

export default Index;
