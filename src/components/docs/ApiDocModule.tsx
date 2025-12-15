"use client";

import styled from "@emotion/styled";
import { HttpMethodTag, type HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";
import { ParamItem } from "@/components/ui/param/ParamItem";
import { CodeBlock } from "@/components/ui/codeBlock/CodeBlock";

type ApiDocModuleProps = {
  apiId: string;
  apiName: string;
  method: HttpMethod;
  endpoint: string;
  description: string;
  headerParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  bodyParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  sampleCode?: string;
  responseCode?: string;
};

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

export function ApiDocModule({
  apiName,
  method,
  endpoint,
  description,
  headerParams = [],
  bodyParams = [],
  sampleCode = defaultSampleCode,
  responseCode = defaultResponseCode
}: ApiDocModuleProps) {
  return (
    <Container>
      <ContentWrapper>
        <BreadcrumbSection>
          <Breadcrumb>
            <BreadcrumbItem disabled>API /</BreadcrumbItem>
            <BreadcrumbItem active>user</BreadcrumbItem>
          </Breadcrumb>
        </BreadcrumbSection>

        <DocumentationContent>
          <HeaderSection>
            <TitleSection>
              <MainTitle>{apiName}</MainTitle>
              <Subtitle>{description}</Subtitle>
            </TitleSection>

            <EndpointSection>
              <HttpMethodTag method={method} />
              <EndpointPath>{endpoint}</EndpointPath>
              <TryButton>Try It!</TryButton>
            </EndpointSection>
          </HeaderSection>

          <RequestSection>
            <SectionTitle>Request</SectionTitle>

            {headerParams.length > 0 && (
              <ParamSection>
                <ParamSectionTitle>Header Params</ParamSectionTitle>
                <ParamCard>
                  {headerParams.map((param, index) => (
                    <ParamItem
                      key={index}
                      name={param.name}
                      type={param.type}
                      description={param.description}
                      required={param.required}
                    />
                  ))}
                </ParamCard>
              </ParamSection>
            )}

            {bodyParams.length > 0 && (
              <ParamSection>
                <ParamSectionTitle>Body Params</ParamSectionTitle>
                <ParamCard large>
                  <ParamList>
                    {bodyParams.map((param, index) => (
                      <ParamItem
                        key={index}
                        name={param.name}
                        type={param.type}
                        description={param.description}
                        required={param.required}
                      />
                    ))}
                  </ParamList>
                </ParamCard>
              </ParamSection>
            )}
          </RequestSection>
        </DocumentationContent>
      </ContentWrapper>

      <CodeSection>
        <CodeBlock
          title="Request"
          languages={["Shell", "JavaScript", "Java", "Swift"]}
          libraryOptions={["Axios", "Fetch", "jQuery", "Native", "XHR"]}
          code={sampleCode}
        />
        <CodeBlock
          title="Response"
          code={responseCode}
        />
      </CodeSection>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 32px;
  padding: 24px;
  width: 100%;
  min-height: calc(100vh - 69px);
  overflow-y: auto;

  @media (max-width: 1400px) {
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  flex: 1;
  max-width: 874px;

  @media (max-width: 1400px) {
    max-width: none;
  }
`;

const BreadcrumbSection = styled.div`
  width: 100%;
`;

const Breadcrumb = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  line-height: 1;
  letter-spacing: -0.8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BreadcrumbItem = styled.span<{ disabled?: boolean; active?: boolean }>`
  color: ${({ disabled, active }) =>
    disabled ? "#B0B8C1" : active ? "#4E5968" : "#000000"};
  font-weight: ${({ active }) => active ? 500 : 400};
`;

const DocumentationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 57px;
  width: 100%;
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 19px;
  width: 100%;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
`;

const MainTitle = styled.h1`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: #191F28;
  letter-spacing: -2.4px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 32px;
    letter-spacing: -1.6px;
  }

  @media (max-width: 480px) {
    font-size: 24px;
    letter-spacing: -1.2px;
  }
`;

const Subtitle = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 16px;
  color: #6B7684;
  letter-spacing: -0.8px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const EndpointSection = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 10px;
  background: #F2F4F6;
  border-radius: 7px;
  height: 45px;
  width: 100%;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 0 8px;
    height: 40px;
    flex-wrap: wrap;
    min-height: 45px;
    align-items: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    height: auto;
    gap: 8px;
  }
`;

const EndpointPath = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 16px;
  color: black;
  letter-spacing: -0.8px;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    word-break: break-all;
  }
`;

const TryButton = styled.button`
  background: #16335C;
  border-radius: 7px;
  box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.25);
  border: none;
  width: 96px;
  height: 37px;
  font-family: "Flight Sans", sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: white;
  text-align: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #1a3a68;
  }

  @media (max-width: 768px) {
    width: 80px;
    height: 32px;
    font-size: 12px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 36px;
    font-size: 14px;
  }
`;

const RequestSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 19px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 30px;
  color: #191F28;
  letter-spacing: -1.5px;
  margin: 0;
`;

const ParamSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
`;

const ParamSectionTitle = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: black;
  letter-spacing: -0.8px;
  margin: 0;
`;

const ParamCard = styled.div<{ large?: boolean }>`
  background: white;
  border-radius: 7px;
  box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.25);
  padding: 10px 16px 8px 16px;
  width: 100%;
  min-height: ${({ large }) => large ? "300px" : "125px"};
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    padding: 8px 12px;
    min-height: ${({ large }) => large ? "200px" : "100px"};
  }

  @media (max-width: 480px) {
    padding: 8px;
    min-height: ${({ large }) => large ? "150px" : "80px"};
  }
`;

const ParamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 18px;
`;

const CodeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 26px;
  width: 570px;
  flex-shrink: 0;

  @media (max-width: 1400px) {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    gap: 16px;
  }
`;