import { Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { t } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const LoyaltyBadge = () => {
  const { loyaltyPoints, language } = useCart();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-pointer">
          <Star className="h-4 w-4 text-primary fill-primary" />
          <Badge variant="outline" className="border-primary text-primary font-bold text-xs">
            {loyaltyPoints}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-card border-border">
        <p className="font-semibold">{t('loyaltyPoints', language)}: {loyaltyPoints}</p>
        <p className="text-xs text-muted-foreground">{t('earnPoints', language)}</p>
      </TooltipContent>
    </Tooltip>
  );
};
