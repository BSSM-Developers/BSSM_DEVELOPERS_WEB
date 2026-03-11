export interface LandingFeature {
  id: string;
  titleLines: readonly string[];
  descriptionLines: readonly string[];
  buttonLabel: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}

export const landingFeatures: readonly LandingFeature[] = [
  {
    id: "feature-1",
    titleLines: ["쉬운 문서 작성으로", "문서를 작성해보세요"],
    descriptionLines: [
      "BSSM Developers만의 블록형 문서 에디터를 활용하면",
      "보다 쉽게 문서를 완성할 수 있어요",
    ],
    buttonLabel: "API 등록하러 가기",
    href: "/docs/register",
    imageSrc: "/images/main_ex1.png",
    imageAlt: "문서 작성 예시",
  },
  {
    id: "feature-2",
    titleLines: ["깔끔한 API 문서 작성", "UI가 준비 되어있어요"],
    descriptionLines: [
      "API 문서를 작성할 때 불편하지 않도록",
      "최대한 편안한 UI를 제공할 수 있도록 노력했어요",
    ],
    buttonLabel: "API 등록하러 가기",
    href: "/docs/register",
    imageSrc: "/images/main_ex2.png",
    imageAlt: "API 문서 UI 예시",
  },
  {
    id: "feature-3",
    titleLines: ["토큰으로 사용 중인 API를", "관리해요"],
    descriptionLines: [
      "BSSM Developers는 토큰을 발급 받아 원하는 API의",
      "사용 권한을 토큰에 부여 받아서 사용할 수 있어요",
    ],
    buttonLabel: "API 사용하러 가기",
    href: "/apis",
    imageSrc: "/images/main_ex3.png",
    imageAlt: "토큰 관리 예시",
  },
] as const;
