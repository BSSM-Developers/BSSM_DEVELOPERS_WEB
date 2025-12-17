"use client";

import styled from "@emotion/styled";
import { CodeBlock } from "@/components/ui/codeBlock/CodeBlock";

interface ApiCodeSectionProps {
  sampleCode?: string;
  responseCode?: string;
  languages?: string[];
  libraryOptions?: string[];
}

const defaultSampleCode = `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'post'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/user/add'</span>,
  <span style="color: #9fcef8">headers</span>: {
    <span style="color: #9fcef8">'Authorization'</span>: <span style="color: #9fcef8">'Bearer token'</span>
  },
  <span style="color: #9fcef8">data</span>: {
    <span style="color: #9fcef8">'nickName'</span>: <span style="color: #9fcef8">'사용자명'</span>,
    <span style="color: #9fcef8">'age'</span>: <span style="color: #9fcef8">25</span>
  }
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`;

const defaultResponseCode = `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">200</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> <span style="color: #ff7b72">null</span>
}`;

export function ApiCodeSection({
  sampleCode = defaultSampleCode,
  responseCode = defaultResponseCode,
  languages = ["Shell", "JavaScript", "Java"],
  libraryOptions = ["Axios", "Fetch", "Native"]
}: ApiCodeSectionProps) {
  return (
    <CodeSection>
      <CodeBlock
        title="Request"
        languages={languages}
        libraryOptions={libraryOptions}
        code={sampleCode}
      />
      <CodeBlock
        title="Response"
        code={responseCode}
      />
    </CodeSection>
  );
}

const CodeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 420px;
  flex-shrink: 0;
  margin-left: auto;

  @media (max-width: 1400px) {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    gap: 16px;
    max-width: 400px;
  }
`;