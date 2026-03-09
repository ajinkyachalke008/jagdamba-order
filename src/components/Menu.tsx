import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { menuItems, categories } from '@/data/menuData';
import { MenuCard } from './MenuCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { t } from '@/lib/translations';

export const Menu = () => {
  const { language } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    if (!searchQuery.trim()) return matchesCategory;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.nameEn.toLowerCase().includes(query) ||
      item.nameMr.includes(searchQuery) ||
      (item.nameHi && item.nameHi.includes(searchQuery)) ||
      (item.descriptionEn && item.descriptionEn.toLowerCase().includes(query));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="menu" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t('ourMenu', language)}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('menuSubtitle', language)}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', language)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={selectedCategory === category 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]' 
                : 'border-primary text-primary hover:bg-primary/10'}
            >
              {t(category, language)}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <p className="text-center text-muted-foreground text-lg py-12">
            {t('noResults', language)}
          </p>
        )}
      </div>
    </section>
  );
};
