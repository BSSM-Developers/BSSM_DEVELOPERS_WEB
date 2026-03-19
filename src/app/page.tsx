"use client";

import { LandingFeatureSection } from "./components/LandingFeatureSection";
import { DeveloperFeatureSection } from "./components/home/DeveloperFeatureSection";
import { HomeHeroSection } from "./components/home/HomeHeroSection";
import { Page, SnapSection } from "./components/home/HomePage.styles";
import { landingFeatures } from "./components/home/landingFeatures";
import { useSnapActiveIndex } from "./components/home/useSnapActiveIndex";

export default function Home() {
  const { activeIndex, sectionRefs } = useSnapActiveIndex(landingFeatures.length + 2);

  return (
    <Page>
      <SnapSection
        data-index={0}
        ref={(element) => {
          sectionRefs.current[0] = element;
        }}
      >
        <HomeHeroSection active={activeIndex === 0} />
      </SnapSection>

      <SnapSection
        data-index={1}
        ref={(element) => {
          sectionRefs.current[1] = element;
        }}
      >
        <DeveloperFeatureSection active={activeIndex === 1} />
      </SnapSection>

      {landingFeatures.map((feature, index) => (
        <SnapSection
          key={feature.id}
          data-index={index + 2}
          ref={(element) => {
            sectionRefs.current[index + 2] = element;
          }}
        >
          <LandingFeatureSection
            titleLines={feature.titleLines}
            descriptionLines={feature.descriptionLines}
            buttonLabel={feature.buttonLabel}
            href={feature.href}
            imageSrc={feature.imageSrc}
            imageAlt={feature.imageAlt}
            active={activeIndex === index + 2}
          />
        </SnapSection>
      ))}
    </Page>
  );
}
