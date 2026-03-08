import { DocsBlock } from "./DocsBlock";
import { ApiBlock } from "./ApiBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";

export function DocsBlockRender({ blocks } : { blocks : DocsBlockType[]} ){
  return(
    <>
    {
      blocks.map((block, i) => {
        const { module, content, listItems, apiData} = block;

        switch(module){
          case "headline_1":
          case "headline_2":
          case "docs_1":
            return(
              <DocsBlock key={i} module={module}>
                {content}
              </DocsBlock>
            )
          case "list":
            return (
              <DocsBlock key={i} module="list">
                <ul>
                  {listItems?.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </DocsBlock>
            );

          case "api":
            return apiData ? (
              <ApiBlock key={i} apiData={apiData} />
            ) : null;

          default:
            return null;
        }
      })
    }
    </>
  )
}