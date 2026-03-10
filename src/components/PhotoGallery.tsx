import { useCart } from '@/contexts/CartContext';
import { t } from '@/lib/translations';

import mixVegImg from '@/assets/gallery/mix-veg.jpg';
import vegKolhapuriImg from '@/assets/gallery/veg-kolhapuri.jpg';
import greenPeasImg from '@/assets/gallery/green-peas-masala.jpg';
import akkaMasoorImg from '@/assets/gallery/akka-masoor.jpg';
import dalTadkaImg from '@/assets/gallery/dal-tadka.jpg';
import dalKolhapuriImg from '@/assets/gallery/dal-kolhapuri.jpg';
import paneerTikkaImg from '@/assets/gallery/paneer-tikka.jpg';
import kajuMasalaImg from '@/assets/gallery/kaju-masala.jpg';
import kajuCurryImg from '@/assets/gallery/kaju-curry.jpg';
import paneerMasalaImg from '@/assets/gallery/paneer-masala.jpg';
import kajuButterImg from '@/assets/gallery/kaju-butter-masala.jpg';
import paneerButterImg from '@/assets/gallery/paneer-butter-masala.jpg';
import masurLasunImg from '@/assets/gallery/masur-lasun-tadka.jpg';
import plainRotiImg from '@/assets/gallery/plain-roti.jpg';
import butterRotiImg from '@/assets/gallery/butter-roti.jpg';
import naanImg from '@/assets/gallery/naan.jpg';

const galleryImages = [
  { src: mixVegImg, labelEn: 'Mix Veg', labelMr: 'मिक्स व्हेज', labelHi: 'मिक्स वेज', price: 120 },
  { src: vegKolhapuriImg, labelEn: 'Veg Kolhapuri', labelMr: 'व्हेज कोल्हापुरी', labelHi: 'वेज कोल्हापुरी', price: 150 },
  { src: greenPeasImg, labelEn: 'Green Peas Masala', labelMr: 'हिरवी वाटाणा मसाला', labelHi: 'हरे मटर मसाला', price: 120 },
  { src: akkaMasoorImg, labelEn: 'Akka Masoor', labelMr: 'अक्का मसूर', labelHi: 'अक्खा मसूर', price: 100 },
  { src: dalTadkaImg, labelEn: 'Dal Tadka', labelMr: 'डाळ तडका', labelHi: 'दाल तड़का', price: 100 },
  { src: dalKolhapuriImg, labelEn: 'Dal Kolhapuri', labelMr: 'डाळ कोल्हापुरी', labelHi: 'दाल कोल्हापुरी', price: 100 },
  { src: paneerTikkaImg, labelEn: 'Paneer Tikka', labelMr: 'पनीर टिक्का', labelHi: 'पनीर टिक्का', price: 170 },
  { src: kajuMasalaImg, labelEn: 'Kaju Masala', labelMr: 'काजू मसाला', labelHi: 'काजू मसाला', price: 150 },
  { src: kajuCurryImg, labelEn: 'Kaju Curry', labelMr: 'काजू करी', labelHi: 'काजू करी', price: 140 },
  { src: paneerMasalaImg, labelEn: 'Paneer Masala', labelMr: 'पनीर मसाला', labelHi: 'पनीर मसाला', price: 150 },
  { src: kajuButterImg, labelEn: 'Kaju Butter Masala', labelMr: 'काजू बटर मसाला', labelHi: 'काजू बटर मसाला', price: 160 },
  { src: paneerButterImg, labelEn: 'Paneer Butter Masala', labelMr: 'पनीर बटर मसाला', labelHi: 'पनीर बटर मसाला', price: 160 },
  { src: masurLasunImg, labelEn: 'Akkha Masur Lasun Tadka', labelMr: 'अक्का मसूर लसूण तडका', labelHi: 'अक्खा मसूर लहसुन तड़का', price: 110 },
  { src: plainRotiImg, labelEn: 'Plain Roti', labelMr: 'साधी पोळी', labelHi: 'सादी रोटी', price: 15 },
  { src: butterRotiImg, labelEn: 'Butter Roti', labelMr: 'बटर पोळी', labelHi: 'बटर रोटी', price: 20 },
  { src: naanImg, labelEn: 'Naan', labelMr: 'नान', labelHi: 'नान', price: 30 },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <div>
                  <p className="text-foreground font-bold text-sm md:text-base leading-tight">
                    {language === 'hi' ? img.labelHi : language === 'mr' ? img.labelMr : img.labelEn}
                  </p>
                  <p className="text-primary font-semibold text-sm">₹{img.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
