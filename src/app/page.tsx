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

export default function Home() {
  return (
    <HomeImagesProvider>
      <main id="main-content" className="bg-[#f4f7ff] text-[#0c1526] pb-16 overflow-x-hidden transition-colors duration-300">
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
