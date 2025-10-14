import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { menuItems, categories } from '@/data/menuData';
import { MenuCard } from './MenuCard';
import { Button } from '@/components/ui/button';

export const Menu = () => {
  const { language } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const categoryTranslations: Record<string, string> = {
    'All': 'सर्व',
    'Curry': 'करी',
    'Dal': 'डाळ',
    'Paneer': 'पनीर',
    'Special': 'विशेष',
    'Bread': 'ब्रेड'
  };

  return (
    <section id="menu" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {language === 'en' ? 'Our Menu' : 'आमचा मेनू'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {language === 'en' 
              ? 'Authentic vegetarian delicacies made with love' 
              : 'प्रेमाने बनवलेले प्रामाणिक शाकाहारी पदार्थ'}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={selectedCategory === category 
                ? 'bg-primary text-white shadow-[0_0_15px_hsl(var(--primary)/0.5)]' 
                : 'border-primary text-primary hover:bg-primary/10'}
            >
              {language === 'en' ? category : categoryTranslations[category]}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};
