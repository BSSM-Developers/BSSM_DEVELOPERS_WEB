import { useState, useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { HttpMethodTag, type HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";

type VerificationState = 'idle' | 'success' | 'fail';

interface ApiHeaderProps {
  title: string;
  description?: string;
  domain?: string;
  method: HttpMethod;
  endpoint: string;
  mappingEndpoint?: string;
  onTryClick?: () => void;
  editable?: boolean;
  onChange?: (updated: { title: string; description: string; method: HttpMethod; endpoint: string; mappingEndpoint: string }) => void;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "UPDATE"];

export function ApiHeader({
  title,
  description = "",
  domain,
  method,
  endpoint,
  mappingEndpoint = "",
  onTryClick,
  editable = false,
  onChange
}: ApiHeaderProps) {
  const [verifyState, setVerifyState] = useState<VerificationState>('idle');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (onTryClick) {
      onTryClick();
      return;
    }

    if (!domain || !endpoint) {
      alert("도메인과 엔드포인트를 모두 입력해주세요.");
      return;
    }

    try {
      setIsVerifying(true);

      const cleanDomain = domain.replace(/\/$/, "");
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const url = `${cleanDomain}${cleanEndpoint}`;

      const res = await fetch(url, {
        method: 'GET',
        mode: 'no-cors'
      });

      if (res) {
        setVerifyState('success');
      }
    } catch {
      setVerifyState('fail');
    } finally {
      setIsVerifying(false);
    }
  };

  if (editable) {
    return (
      <HeaderSection>
        <TitleSection>
          <EditTitleInput
            value={title}
            onChange={(e) => onChange?.({ title: e.target.value, description, method, endpoint, mappingEndpoint })}
            placeholder="API 제목"
          />
          <EditDescInput
            value={description}
            onChange={(e) => onChange?.({ title, description: e.target.value, method, endpoint, mappingEndpoint })}
            placeholder="API 설명"
          />
        </TitleSection>

        <EndpointSection>
          <MethodSelect
            value={method}
            onChange={(m) => onChange?.({ title, description, method: m as HttpMethod, endpoint, mappingEndpoint })}
          />
          <EditEndpointInput
            value={endpoint}
            onChange={(e) => onChange?.({ title, description, method, endpoint: e.target.value, mappingEndpoint })}
            placeholder="실제 엔드포인트 (e.g. /api/v1/user)"
          />
          <VerifyButton
            state={verifyState}
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? "검증 중..." :
              verifyState === 'success' ? "검증 완료" :
                verifyState === 'fail' ? "검증 실패" : "검증"}
          </VerifyButton>
        </EndpointSection>

        <EndpointSection>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <Label style={{ width: 'auto', color: '#58A6FF' }}>MAPPING</Label>
            <EditEndpointInput
              value={mappingEndpoint}
              onChange={(e) => onChange?.({ title, description, method, endpoint, mappingEndpoint: e.target.value })}
              placeholder="매핑 엔드포인트 (e.g. /user/profile)"
            />
          </div>
        </EndpointSection>
      </HeaderSection>
    );
  }

  return (
    <HeaderSection>
      <TitleSection>
        <MainTitle>{title}</MainTitle>
        {description && <Subtitle>{description}</Subtitle>}
      </TitleSection>

      <EndpointSection>
        <HttpMethodTag method={method} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <EndpointPath>{endpoint}</EndpointPath>
          {mappingEndpoint && <MappingPath>Mapping: {mappingEndpoint}</MappingPath>}
        </div>
        <VerifyButton
          state={verifyState}
          onClick={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? "검증 중..." :
            verifyState === 'success' ? "검증 완료" :
              verifyState === 'fail' ? "검증 실패" : "Try It!"}
        </VerifyButton>
      </EndpointSection>
    </HeaderSection>
  );
}

function MethodSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <SelectContainer ref={wrapperRef}>
      <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
        <HttpMethodTag method={value as HttpMethod} />
        <Arrow isOpen={isOpen}>▼</Arrow>
      </SelectTrigger>
      {isOpen && (
        <SelectOptions>
          {METHODS.map((m) => (
            <SelectOption
              key={m}
              onClick={() => {
                onChange(m);
                setIsOpen(false);
              }}
            >
              <HttpMethodTag method={m} />
            </SelectOption>
          ))}
        </SelectOptions>
      )}
    </SelectContainer>
  );
}

const EditTitleInput = styled.input`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 700;
  font-size: 36px;
  color: #191F28;
  letter-spacing: -1.8px;
  border: none;
  outline: none;
  width: 100%;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  &:focus {
    box-shadow: 0 0 0 2px #58A6FF;
  }
`;

const EditDescInput = styled.input`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 14px;
  color: #6B7684;
  letter-spacing: -0.7px;
  border: none;
  outline: none;
  width: 100%;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  &:focus {
    box-shadow: 0 0 0 2px #58A6FF;
  }
`;

const EditEndpointInput = styled.input`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 14px;
  color: black;
  letter-spacing: -0.7px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 4px 8px;
  outline: none;
  flex: 1;
  background: white;
  &:focus {
    border-color: #58A6FF;
  }
`;

const Label = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #58A6FF;
  background: #F0F7FF;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #58A6FF;
  flex-shrink: 0;
  text-transform: uppercase;
`;

const MappingPath = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #8B95A1;
  letter-spacing: -0.6px;
`;

const SelectContainer = styled.div`
  position: relative;
  min-width: 80px;
`;

const SelectTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #F3F4F6;
  }
`;

const Arrow = styled.span<{ isOpen: boolean }>`
  font-size: 10px;
  transition: transform 0.2s ease;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0)")};
  color: #9CA3AF;
`;

const SelectOptions = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 120px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
`;

const SelectOption = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  &:hover {
    background: #F3F4F6;
  }
`;

const SelectBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
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
  font-size: 36px;
  color: #191F28;
  letter-spacing: -1.8px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 28px;
    letter-spacing: -1.4px;
  }

  @media (max-width: 480px) {
    font-size: 24px;
    letter-spacing: -1.2px;
  }
`;

const Subtitle = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 14px;
  color: #6B7684;
  letter-spacing: -0.7px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const EndpointSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 12px;
  background: white;
  border-radius: 8px;
  height: 42px;
  width: 100%;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 0 8px;
    height: 40px;
    flex-wrap: wrap;
    min-height: 42px;
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
  font-size: 14px;
  color: black;
  letter-spacing: -0.7px;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    word-break: break-all;
  }
`;

const TryButton = styled.button`
  background: #16335C;
  border-radius: 7px;
  box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.25);
  border: none;
  width: 80px;
  height: 32px;
  font-family: "Flight Sans", sans-serif;
  font-weight: 700;
  font-size: 12px;
  color: white;
  text-align: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #1a3a68;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 36px;
    font-size: 14px;
  }
`;

const VerifyButton = styled.button<{ state: VerificationState }>`
  background: ${({ state }) =>
    state === 'success' ? '#0CA678' :
      state === 'fail' ? '#FA5252' : '#16335C'};
  border-radius: 7px;
  box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.25);
  border: none;
  width: 80px;
  height: 32px;
  font-family: "Flight Sans", sans-serif;
  font-weight: 700;
  font-size: 12px;
  color: white;
  text-align: center;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ state, disabled }) =>
    disabled ? (state === 'success' ? '#0CA678' : state === 'fail' ? '#FA5252' : '#16335C') :
      state === 'success' ? '#099268' :
        state === 'fail' ? '#E03131' : '#1a3a68'};
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 36px;
    font-size: 14px;
  }
`;