"use client";

import styled from "@emotion/styled";
import { useState } from "react";

type Language = "Shell" | "JavaScript" | "Python";
type LibraryOption = "Axios" | "Fetch" | "jQuery" | "Requests" | "cURL";

type CodeBlockProps = {
  title: "Request" | "Response";
  languages?: Language[];
  libraryOptions?: LibraryOption[];
  selectedLanguage?: string;
  selectedLibrary?: string;
  code: string;
  className?: string;
  onLanguageChange?: (language: string) => void;
  onLibraryChange?: (library: string) => void;
};

export function CodeBlock({
  title,
  languages = ["JavaScript"],
  libraryOptions = ["Axios"],
  selectedLanguage,
  selectedLibrary,
  code,
  className,
  onLanguageChange,
  onLibraryChange
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (language: Language) => {
    onLanguageChange?.(language);
  };

  const handleLibraryChange = (library: LibraryOption) => {
    onLibraryChange?.(library);
  };

  const handleCopy = async () => {
    const plainText = code.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <Container className={className}>
      <Header>
        <HeaderContent>
          <Title>{title}</Title>
          <HeaderRight>
            {languages.length > 1 && (
              <LanguageTabs>
                {languages.map(lang => (
                  <LanguageTab
                    key={lang}
                    active={selectedLanguage === lang}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    {lang}
                  </LanguageTab>
                ))}
              </LanguageTabs>
            )}
            <CopyButton onClick={handleCopy} copied={copied}>
              {copied ? "Copied!" : "Copy"}
            </CopyButton>
          </HeaderRight>
        </HeaderContent>

        {title === "Request" && libraryOptions.length > 0 && (
          <LibraryOptions>
            {libraryOptions.map(lib => (
              <LibraryButton
                key={lib}
                active={selectedLibrary === lib}
                onClick={() => handleLibraryChange(lib)}
              >
                {lib}
              </LibraryButton>
            ))}
          </LibraryOptions>
        )}
      </Header>

      <CodeContent>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: code }} />
        </pre>
      </CodeContent>
    </Container>
  );
}

const Container = styled.div`
  background: #0F1728;
  border-radius: 7px;
  width: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 15px 20px 15px 20px;

  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    gap: 12px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const Title = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  letter-spacing: -0.7px;
  white-space: pre;
`;

const CopyButton = styled.button<{ copied: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: ${({ copied }) => copied ? "#F3A941" : "#8B95A1"};
  background: transparent;
  border: 1px solid ${({ copied }) => copied ? "#F3A941" : "#4E5968"};
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #F3A941;
    border-color: #F3A941;
  }
`;

const LanguageTabs = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const LanguageTab = styled.button<{ active: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: ${({ active }) => active ? "#F3A941" : "#4E5968"};
  letter-spacing: -0.7px;
  white-space: pre;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #F3A941;
  }
`;

const LibraryOptions = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const LibraryButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 19px;
  width: auto;
  padding: 0 10px;
  min-width: 48px;
  border-radius: 3px;
  background: ${({ active }) => active ? "#FFFFFF" : "transparent"};
  border: none;
  cursor: pointer;

  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: ${({ active }) => active ? "#191F28" : "#8B95A1"};
  text-align: center;
  letter-spacing: -0.6px;

  &:hover {
    background: #FFFFFF;
    color: #191F28;
  }

  @media (max-width: 480px) {
    width: 44px;
    font-size: 11px;
  }
`;

const CodeContent = styled.div`
  padding: 0 15px 15px 20px;

  pre {
    margin: 0;
    padding: 0;
    overflow-x: auto;

    code {
      font-family: "Spoqa Han Sans Neo", sans-serif;
      font-weight: 300;
      font-size: 16px;
      color: #D1D6DB;
      line-height: 1.45;
      white-space: pre;
    }
  }

  @media (max-width: 768px) {
    padding: 0 12px 12px 16px;

    pre code {
      font-size: 14px;
      line-height: 1.4;
    }
  }

  @media (max-width: 480px) {
    padding: 0 8px 8px 12px;

    pre code {
      font-size: 12px;
      line-height: 1.3;
    }
  }
`;
