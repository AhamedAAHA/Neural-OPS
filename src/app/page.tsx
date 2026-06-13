import { LandingHero, LandingSections } from "@/components/landing/LandingPage";
import { LandingNav } from "@/components/landing/LandingNav";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <LandingSections />
    </>
  );
}
