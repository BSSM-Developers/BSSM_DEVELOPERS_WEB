import { remark } from "remark";
import remarkParse from "remark-parse";
import { DocsBlock } from "@/types/docs";

export async function convertMDX(content: string): Promise<DocsBlock[]> {
  const tree = remark().use(remarkParse).parse(content);
  const blocks: DocsBlock[] = [];

  const walk = (node: any) : void => {
    if (node.type === "heading") {
      blocks.push({
        type: "heading",
        content: node.children.map((c: any) => c.value).join(" "),
      });
    }
    if (node.type === "paragraph") {
      blocks.push({
        type: "paragraph",
        content: node.children.map((c: any) => c.value).join(" "),
      });
    }
    if (node.type === "list") {
      blocks.push({
        type: "list",
        listItems: node.children.map((item: any) =>
          item.children.map((c: any) => c.value).join(" ")
        ),
      });
    }
    if (node.type === "code") {
      blocks.push({
        type: "code",
        content: node.value,
        language: node.lang,
      });
    }
    if (node.children) node.children.forEach(walk);
  }

  walk(tree);

  return blocks;
}