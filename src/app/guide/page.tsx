import { redirect } from "next/navigation";
import { loadGuideSummaries } from "./data";

export default async function GuidePage() {
  const guides = await loadGuideSummaries();

  if (guides.length === 0) {
    return null;
  }

  redirect(`/guide/${guides[0].slug}`);
}
