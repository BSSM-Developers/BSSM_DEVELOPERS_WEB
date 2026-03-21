import type { Metadata } from "next";

export const siteUrl = new URL("https://bssm-dev.com");
export const siteName = "BSSM Developers";
export const siteDescription =
  "BSSM Developers는 학생 개발자를 위한 API 공유 및 문서 협업 플랫폼입니다.";
export const defaultOgImage = "/bssm-developers.svg";

const normalizePath = (pathname: string) => {
  if (!pathname) {
    return "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
};

export const absoluteUrl = (pathname: string) => {
  return new URL(normalizePath(pathname), siteUrl).toString();
};

interface CreatePageMetadataInput {
  title: string;
  description: string;
  pathname: string;
  image?: string;
}

export const createPageMetadata = ({
  title,
  description,
  pathname,
  image = defaultOgImage,
}: CreatePageMetadataInput): Metadata => {
  const canonical = normalizePath(pathname);
  const url = absoluteUrl(canonical);
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "ko_KR",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
};
