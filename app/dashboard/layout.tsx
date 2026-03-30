import { FeatureFlagProvider } from "@/lib/tourrouter/FeatureFlagContext";
import { ProductBrandingProvider } from "@/lib/tourrouter/ProductBrandingContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagProvider>
      <ProductBrandingProvider>{children}</ProductBrandingProvider>
    </FeatureFlagProvider>
  );
}
