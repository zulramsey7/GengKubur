import { Check, Star } from "lucide-react";
import { Package } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  pkg: Package;
  isSelected: boolean;
  onSelect: (pkg: Package) => void;
}

const PackageCard = ({ pkg, isSelected, onSelect }: PackageCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 bg-gradient-card p-6 shadow-card transition-all duration-300 hover:shadow-hover cursor-pointer",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 scale-[1.02]" 
          : "border-border hover:border-primary/50",
        pkg.popular && "ring-2 ring-accent/50"
      )}
      onClick={() => onSelect(pkg)}
    >
      {/* Popular Badge */}
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-accent-foreground shadow-button">
            <Star className="h-3 w-3 fill-current" />
            Popular
          </div>
        </div>
      )}

      {/* Package ID Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
          {pkg.name}
        </span>
        {isSelected && (
          <div className="rounded-full bg-primary p-1.5 animate-scale-in">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">RM {pkg.price}</span>
      </div>

      {/* Description */}
      <p className="mb-4 font-medium text-foreground">{pkg.description}</p>

      {/* Features */}
      <ul className="mb-6 space-y-2">
        {pkg.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      {/* Select Button */}
      <Button
        variant={isSelected ? "default" : "outline"}
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(pkg);
        }}
      >
        {isSelected ? "Terpilih" : "Pilih Pakej"}
      </Button>
    </div>
  );
};

export default PackageCard;
