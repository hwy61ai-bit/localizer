import { FeatureFlagProvider } from "@/lib/tourrouter/FeatureFlagContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <FeatureFlagProvider>{children}</FeatureFlagProvider>;
}
