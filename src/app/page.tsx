import { LandingHero, LandingSections } from "@/components/landing/LandingPage";
import { LandingNav } from "@/components/landing/LandingNav";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-neural-bg">
      <LandingNav />
      <LandingHero />
      <LandingSections />
    </div>
  );
}
