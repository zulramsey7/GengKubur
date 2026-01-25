import { Package } from "@/types/booking";
import { packages } from "@/data/packages";
import PackageCard from "./PackageCard";

interface PackagesSectionProps {
  selectedPackage: Package | null;
  onSelectPackage: (pkg: Package) => void;
}

const PackagesSection = ({ selectedPackage, onSelectPackage }: PackagesSectionProps) => {
  return (
    <section className="py-12 md:py-16" id="packages">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
            Pilih Pakej Anda
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Kami menawarkan pelbagai pakej penyelenggaraan kubur untuk memenuhi keperluan anda
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PackageCard
                pkg={pkg}
                isSelected={selectedPackage?.id === pkg.id}
                onSelect={onSelectPackage}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
