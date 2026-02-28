import { HeroSection } from "@/components/hero";
import { LogoCloud } from "@/components/logo-cloud";
import { FeatureSection } from "@/components/feature-section";
import { PricingSection } from "@/components/pricing-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogoCloud />
      <FeatureSection />
      <PricingSection />
    </>
  );
}
