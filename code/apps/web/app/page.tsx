import { Nav } from '../components/landing/Nav';
import { Hero } from '../components/landing/Hero';
import { StatStrip, FeatureGrid } from '../components/landing/Features';
import { HowItWorks, StandardsBand, CtaBand, Footer } from '../components/landing/Closing';

/**
 * Marketing landing for Strings — the first impression for prospects and
 * stakeholders. Hero → stats → feature bento → how-it-works → standards → CTA.
 * The dev launcher (every page built so far) is reachable from the footer.
 */
export default function LandingPage() {
  return (
    <main className="relative bg-bg">
      <Nav />
      <Hero />
      <StatStrip />
      <FeatureGrid />
      <HowItWorks />
      <StandardsBand />
      <CtaBand />
      <Footer />
    </main>
  );
}
