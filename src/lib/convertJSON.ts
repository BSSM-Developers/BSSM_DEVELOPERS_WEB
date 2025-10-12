import { DocsBlock, ApiDoc } from "@/types/docs";

export function convertJSON(docs: any): DocsBlock[] {
  const blocks: DocsBlock[] = [];

  blocks.push({ type: "heading", content: docs.docs_title });
  blocks.push({ type: "paragraph", content: docs.docs_description });

  docs.docs_sections.forEach((section: any) => {
    blocks.push({ type: "heading", content: section.docs_section_title });

    section.docs_pages.forEach((page: any) => {
      if (page.type === "markdown") {
        blocks.push({
          type: "paragraph",
          content: page.docs_page_description,
        });
      }

      if (page.type === "api") {
        const apiData: ApiDoc = {
          method: page.method,
          endpoint: page.endpoint,
          request: {
            headers: convertArrayToObject(page.request.header),
            body: page.request.body,
          },
          response: {
            status_code: page.response.status_code,
            body: page.response.body,
          },
        };

        blocks.push({
          type: "api",
          apiData,
        });
      }
    });
  });

  return blocks;
}

function convertArrayToObject(arr: string[]) {
  const result: Record<string, string> = {};
  arr.forEach((key) => (result[key] = "string"));
  return result;
}