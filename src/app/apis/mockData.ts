export interface ApiItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  logo?: string; // URL 또는 컴포넌트 플레이스홀더
  isHot?: boolean;
  type: "INSERT" | "UPDATE" | "DELETE" | "BSM" | "RE:MEDY" | "CUSTOM" | "ORIGINAL";
  author?: string;
}

export const popularApis: ApiItem[] = [
  {
    id: "buma-wiki",
    title: "부마위키",
    description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다",
    tags: ["INSERT"],
    type: "INSERT",
  },
  {
    id: "bsm",
    title: "BSM",
    description: "부산소프트웨어마이스터고등학교 학생들의 마이룸, 상점, 벌점내역을 확인할 수 있는 서비스 BSM의 API입니다",
    tags: ["BSM"],
    type: "BSM",
  },
  {
    id: "remedy",
    title: "RE:MEDY",
    description: "위치 기반 음악 서비스 RE:MEDY의 API입니다",
    tags: ["서정원"],
    type: "RE:MEDY",
    author: "서정원"
  },
  {
    id: "favorite-sign",
    title: "최애의 사인",
    description: "애니 캐릭터 추모 서비스 최애의 사인의 API입니다",
    tags: ["박동현"],
    type: "CUSTOM",
    author: "박동현"
  }
];

export const originalApis: ApiItem[] = [
  {
    id: "auth",
    title: "Auth",
    description: "사용자 인증 및 토큰 관리를 위한 API입니다",
    tags: ["System", "인증"],
    type: "ORIGINAL",
  },
  {
    id: "user",
    title: "User",
    description: "회원가입, 프로필 조회 등 사용자 관련 API입니다",
    tags: ["System", "사용자"],
    type: "ORIGINAL",
  },
  {
    id: "docs-api",
    title: "Docs",
    description: "API 문서 생성 및 관리를 위한 API입니다",
    tags: ["System", "문서"],
    type: "ORIGINAL",
  },
  {
    id: "api-token",
    title: "API Token",
    description: "API 사용을 위한 토큰 발급 및 관리 API입니다",
    tags: ["System", "토큰"],
    type: "ORIGINAL",
  },
  {
    id: "system",
    title: "System",
    description: "서버 상태 확인 및 시스템 관리 API입니다",
    tags: ["System", "관리"],
    type: "ORIGINAL",
  },
  {
    id: "fact",
    title: "Fact",
    description: "사실 관계 확인 및 관리를 위한 API입니다",
    tags: ["System", "Fact"],
    type: "ORIGINAL",
  },
  {
    id: "fact-update",
    title: "Fact Update",
    description: "인지 왜곡 수정 및 업데이트를 위한 API입니다",
    tags: ["System", "Fact"],
    type: "ORIGINAL",
  }
];

export const customApis: ApiItem[] = [
  {
    id: "ioj-custom",
    title: "IOJ",
    description: "INSERT ONLINE JUDGE 서비스의 API입니다",
    tags: ["INSERT"],
    type: "INSERT",
  },
  {
    id: "accidental-story-custom",
    title: "어쩌다 발견한 이야기",
    description: "어쩌다 발견한 이야기 서비스의 API입니다",
    tags: ["박가은"],
    type: "CUSTOM",
    author: "박가은"
  },
  {
    id: "meta-samgukji-custom",
    title: "메타 삼국지",
    description: "메타 삼국지 서비스의 API입니다",
    tags: ["박가은"],
    type: "CUSTOM",
    author: "박가은"
  },
  {
    id: "buma-wiki-custom",
    title: "부마위키",
    description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스입니다",
    tags: ["박우빈"],
    type: "CUSTOM",
    author: "박우빈"
  }
];
