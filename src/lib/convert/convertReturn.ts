import { DocsBlock } from "@/types/docs";

export function convertReturn(blocks: DocsBlock[]) {
  return blocks.map((block) => {
    if (block.listItems) {
      return { module: block.module, listItems: block.listItems };
    }
    return { module: block.module, content: block.content };
  });
}