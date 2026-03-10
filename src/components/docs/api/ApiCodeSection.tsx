"use client";

import styled from "@emotion/styled";
import { useState, useEffect } from "react";
import { CodeBlock } from "@/components/ui/codeBlock/CodeBlock";
import { generateRequestCode, generateResponseTemplate, type Language, type Library, defaultLibraryMap, libraryLanguageMap } from "@/utils/apiUtils/codeTemplateUtils";
import { highlightJson } from "@/utils/apiUtils/highlightUtils";
import type { ApiDoc } from "@/types/docs";

interface ApiCodeSectionProps {
  apiDoc?: ApiDoc;
  sampleCode?: string;
  responseCode?: string;
  languages?: string[];
  libraryOptions?: string[];
  baseUrl?: string;
  includeAuth?: boolean;
  authType?: 'bearer' | 'basic' | 'apikey';
  responseData?: unknown;
  responseStatus?: number;
  responseMessage?: string;
}

export function ApiCodeSection({
  apiDoc,
  sampleCode,
  responseCode,
  languages = ["Shell", "JavaScript", "Python"],
  baseUrl = "",
  includeAuth = false,
  authType = 'bearer',
  responseData = null,
  responseStatus = 200,
  responseMessage = "성공"
}: ApiCodeSectionProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('shell');
  const [currentLibrary, setCurrentLibrary] = useState<Library>(defaultLibraryMap['shell']);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedResponse, setGeneratedResponse] = useState<string>('');

  const getAvailableLibraries = (lang: Language): Library[] => {
    return Object.entries(libraryLanguageMap)
      .filter(([, supportedLangs]) => supportedLangs.includes(lang))
      .map(([lib]) => lib as Library);
  };

  useEffect(() => {
    if (apiDoc) {
      try {
        const code = generateRequestCode(apiDoc, {
          language: currentLanguage,
          library: currentLibrary,
          baseUrl,
          includeAuth,
          authType
        });
        setGeneratedCode(code);
      } catch {
        setGeneratedCode(sampleCode || getDefaultSampleCode());
      }
    } else {
      setGeneratedCode(sampleCode || getDefaultSampleCode());
    }

    if (responseData) {
      const actualResponse = highlightJson(JSON.stringify({
        status: responseStatus,
        message: responseMessage,
        data: responseData
      }, null, 2));
      setGeneratedResponse(actualResponse);
      return;
    }

    const response = generateResponseTemplate(responseStatus, responseMessage, apiDoc?.responseParams);
    setGeneratedResponse(responseCode || response);
  }, [apiDoc, currentLanguage, currentLibrary, baseUrl, includeAuth, authType, sampleCode, responseCode, responseStatus, responseMessage, responseData]);

  useEffect(() => {
    const availableLibraries = getAvailableLibraries(currentLanguage);
    if (availableLibraries.length > 0 && !availableLibraries.includes(currentLibrary)) {
      setCurrentLibrary(availableLibraries[0]);
    }
  }, [currentLanguage, currentLibrary]);

  const languageMap: Record<string, Language> = {
    'JavaScript': 'javascript',
    'Python': 'python',
    'Shell': 'shell'
  };

  const libraryMap: Record<string, Library> = {
    'Axios': 'axios',
    'Fetch': 'fetch',
    'jQuery': 'jquery',
    'Requests': 'requests',
    'cURL': 'native'
  };

  const handleLanguageChange = (language: string) => {
    const lang = languageMap[language] || language.toLowerCase() as Language;
    setCurrentLanguage(lang);

    const defaultLib = defaultLibraryMap[lang];
    if (defaultLib) {
      setCurrentLibrary(defaultLib);
    }
  };

  const handleLibraryChange = (library: string) => {
    const lib = libraryMap[library] || library.toLowerCase() as Library;
    setCurrentLibrary(lib);
  };

  const availableLibraryNames = getAvailableLibraries(currentLanguage).map(lib => {
    const entry = Object.entries(libraryMap).find(([, v]) => v === lib);
    return entry ? entry[0] : lib.charAt(0).toUpperCase() + lib.slice(1);
  });

  const selectedLanguageName = Object.entries(languageMap).find(([, v]) => v === currentLanguage)?.[0] || currentLanguage;
  const selectedLibraryName = Object.entries(libraryMap).find(([, v]) => v === currentLibrary)?.[0] || currentLibrary;

  return (
    <CodeSection>
      <CodeBlock
        title="Request"
        languages={languages as ("Shell" | "JavaScript" | "Python")[]}
        libraryOptions={availableLibraryNames as ("Axios" | "Fetch" | "jQuery" | "Requests" | "cURL")[]}
        selectedLanguage={selectedLanguageName}
        selectedLibrary={selectedLibraryName}
        code={generatedCode}
        onLanguageChange={handleLanguageChange}
        onLibraryChange={handleLibraryChange}
      />
      <CodeBlock
        title="Response"
        code={generatedResponse}
      />
    </CodeSection>
  );
}

function getDefaultSampleCode(): string {
  return `<span style="color: #ff7b72">const</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">const</span> response = <span style="color: #ff7b72">await</span> <span style="color: #cda3f9">axios</span>({
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'post'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/api/endpoint'</span>,
  <span style="color: #9fcef8">headers</span>: {},
  <span style="color: #9fcef8">data</span>: {
    <span style="color: #9fcef8">'key'</span>: <span style="color: #9fcef8">'value'</span>
  }
});

<span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(response.data);`;
}

const CodeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 420px;
  flex-shrink: 0;
  margin-left: auto;
  transform: translateX(16px);

  @media (max-width: 1400px) {
    width: 100%;
    margin: 0;
    transform: none;
  }

  @media (max-width: 768px) {
    gap: 16px;
  }
`;
