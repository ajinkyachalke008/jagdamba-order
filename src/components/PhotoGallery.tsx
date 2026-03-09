import { useCart } from '@/contexts/CartContext';
import { t } from '@/lib/translations';

import paneerImg from '@/assets/gallery/paneer-butter-masala.jpg';
import dalImg from '@/assets/gallery/dal-tadka.jpg';
import breadsImg from '@/assets/gallery/breads.jpg';
import thaliImg from '@/assets/gallery/veg-thali.jpg';
import kajuImg from '@/assets/gallery/kaju-masala.jpg';
import mixVegImg from '@/assets/gallery/mix-veg.jpg';

const galleryImages = [
  { src: paneerImg, labelEn: 'Paneer Butter Masala', labelMr: 'पनीर बटर मसाला', labelHi: 'पनीर बटर मसाला' },
  { src: dalImg, labelEn: 'Dal Tadka', labelMr: 'डाळ तडका', labelHi: 'दाल तड़का' },
  { src: breadsImg, labelEn: 'Fresh Breads', labelMr: 'ताज्या पोळ्या', labelHi: 'ताज़ी रोटियां' },
  { src: thaliImg, labelEn: 'Veg Thali', labelMr: 'व्हेज थाळी', labelHi: 'वेज थाली' },
  { src: kajuImg, labelEn: 'Kaju Masala', labelMr: 'काजू मसाला', labelHi: 'काजू मसाला' },
  { src: mixVegImg, labelEn: 'Mix Veg Curry', labelMr: 'मिक्स व्हेज', labelHi: 'मिक्स वेज' },
];

export const PhotoGallery = () => {
  const { language } = useCart();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            📸 {t('photoGallery', language)}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('gallerySubtitle', language)}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((img, index) => (
            <div
              key={index}
              className="relative group overflow-hidden rounded-xl border border-border hover:border-primary transition-all duration-300"
            >
              <img
                src={img.src}
                alt={img.labelEn}
                loading="lazy"
                className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-foreground font-bold text-lg">
                  {language === 'hi' ? img.labelHi : language === 'mr' ? img.labelMr : img.labelEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
