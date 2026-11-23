import {
  HeroSection,
  QuickActions,
  BentoTools,
  LearningPath,
  ArticlesSection,
  ExploreMore,
  CustomizerFab,
  HomeImagesProvider,
} from "@/components/home";
import { organizationJsonLd } from "@/lib/organization";

export default function Home() {
  return (
    <HomeImagesProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <main id="main-content" className="bg-[#090c14] text-slate-100 pb-16 overflow-x-hidden transition-colors duration-300">
        {/* 1. Hero: prompt box + demo card */}
        <HeroSection />

        {/* 2. Quick actions: 3 cards */}
        <QuickActions />

        {/* 3. Bento grid: tools & apps */}
        <BentoTools />

        {/* 4. Learning path: 3 stages */}
        <LearningPath />

        {/* 5. Articles: 3 latest */}
        <ArticlesSection />

        {/* 6. Explore more + CTA band */}
        <ExploreMore />

        {/* 7. Customizer & Visual Admin FAB */}
        <CustomizerFab />
      </main>
    </HomeImagesProvider>
  );
}
