import { Check, Package, User, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStepsProps {
  currentStep: number; // 0: Package, 1: Info, 2: Payment
}

const steps = [
  { label: "Pakej", icon: Package },
  { label: "Maklumat", icon: User },
  { label: "Bayaran", icon: CreditCard },
];

export const ProgressSteps = ({ currentStep }: ProgressStepsProps) => {
  return (
    <div className="w-full py-2 mb-8 border-b border-muted/30 pb-6">
      <div className="flex items-center justify-between relative max-w-sm mx-auto px-4">
        {/* Background Line */}
        <div className="absolute top-5 left-8 right-8 h-[2px] bg-muted z-0" />
        
        {/* Active Line */}
        <div 
          className="absolute top-5 left-8 h-[2px] bg-primary z-0 transition-all duration-700 ease-in-out" 
          style={{ 
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 64px)'
          }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                  isActive ? "bg-background border-primary text-primary shadow-lg scale-110" : 
                  "bg-background border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span 
                className={cn(
                  "text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
