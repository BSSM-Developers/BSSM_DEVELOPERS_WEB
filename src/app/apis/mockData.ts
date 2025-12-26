export interface ApiItem {
  id: string;
  title: string;
  description: string;
  tags: string[]; // e.g., ["INSERT", "BSM", "서정원", "박동현"]
  logo?: string; // URL or component placeholder
  isHot?: boolean;
  type: "INSERT" | "BSM" | "RE:MEDY" | "CUSTOM" | "ORIGINAL";
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
    id: "ioj",
    title: "IOJ",
    description: "INSERT ONLINE JUDGE 서비스의 API입니다",
    tags: ["INSERT"],
    type: "INSERT",
  },
  {
    id: "accidental-story",
    title: "어쩌다 발견한 이야기",
    description: "어쩌다 발견한 이야기 서비스의 API입니다",
    tags: ["박가은"],
    type: "CUSTOM",
    author: "박가은"
  },
  {
    id: "meta-samgukji",
    title: "메타 삼국지",
    description: "메타 삼국지 서비스의 API입니다",
    tags: ["박가은"],
    type: "CUSTOM",
    author: "박가은"
  },
  {
    id: "buma-wiki-original",
    title: "부마위키",
    description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스입니다",
    tags: ["박우빈"],
    type: "CUSTOM",
    author: "박우빈"
  },
  {
    id: "stumon",
    title: "스튜몬",
    description: "스튜몬 서비스의 API입니다",
    tags: ["김동욱"],
    type: "CUSTOM",
    author: "김동욱"
  },
  {
    id: "hankeon",
    title: "한켠",
    description: "워케이션 관리 서비스 한켠의 API입니다",
    tags: ["박동현"],
    type: "CUSTOM",
    author: "박동현"
  },
  {
    id: "snatchy",
    title: "SNATCHY",
    description: "소액 대출 서비스 SNATCHY의 API입니다",
    tags: ["서정원"],
    type: "CUSTOM",
    author: "서정원"
  },
  {
    id: "on-air",
    title: "ON-AIR",
    description: "원격 방송 서비스 ON-AIR의 소형 API입니다",
    tags: ["서정원"],
    type: "CUSTOM",
    author: "서정원"
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
