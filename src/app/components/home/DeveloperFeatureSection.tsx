"use client";

import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

interface DeveloperFeatureSectionProps {
  active: boolean;
}

interface AccordionItem {
  title: string;
  description: string;
}

const accordionItems: readonly AccordionItem[] = [
  {
    title: "코드 한 줄로 연동되는 결제",
    description: "문서에 결제 API를 연결하면 요청/응답 예시를 자동으로 생성해 빠르게 공개할 수 있어요.",
  },
  {
    title: "노코드 결제수단 운영",
    description: "문서 편집 화면에서 토글만으로 결제수단 노출을 조정하고 변경사항을 바로 반영할 수 있어요.",
  },
  {
    title: "코드 수정 없이 디자인 커스텀",
    description: "개발자의 도움 없이 문서 테마와 컴포넌트 스타일을 커스텀할 수 있어요.",
  },
] as const;

const paymentOptions = [
  { id: "card", label: "신용·체크카드" },
  { id: "virtual", label: "가상계좌" },
  { id: "naver", label: "네이버페이" },
  { id: "kakao", label: "카카오페이" },
  { id: "toss", label: "토스페이" },
] as const;

export function DeveloperFeatureSection({ active }: DeveloperFeatureSectionProps) {
  const [openIndex, setOpenIndex] = useState(2);
  const [selectedPayment, setSelectedPayment] = useState<(typeof paymentOptions)[number]["id"]>("card");

  const previewContent = useMemo(() => {
    if (openIndex === 0) {
      return (
        <PreviewSurface>
          <PreviewTitleRow>
            <PreviewDot />
            <PreviewChip>SDK</PreviewChip>
          </PreviewTitleRow>
          <CodeBlock>
            {`import { bsdevPay } from "@bsdev/pay"\n\nbsdevPay.open({\n  orderId: "order_1294",\n  amount: 29000,\n  onSuccess: "/success"\n})`}
          </CodeBlock>
        </PreviewSurface>
      );
    }

    if (openIndex === 1) {
      return (
        <PreviewSurface>
          <PreviewHeaderBar>
            <BackArrow>&lt;</BackArrow>
            <PreviewHeaderTitle>결제 운영</PreviewHeaderTitle>
            <BackArrow aria-hidden> </BackArrow>
          </PreviewHeaderBar>
          <NoCodeList>
            <NoCodeItem>
              <NoCodeLabel>신용·체크카드</NoCodeLabel>
              <NoCodeBadge>활성</NoCodeBadge>
            </NoCodeItem>
            <NoCodeItem>
              <NoCodeLabel>가상계좌</NoCodeLabel>
              <NoCodeBadge disabled>비활성</NoCodeBadge>
            </NoCodeItem>
            <NoCodeItem>
              <NoCodeLabel>간편결제</NoCodeLabel>
              <NoCodeBadge>활성</NoCodeBadge>
            </NoCodeItem>
          </NoCodeList>
        </PreviewSurface>
      );
    }

    return (
      <PreviewSurface>
        <PreviewHeaderBar>
          <BackArrow>&lt;</BackArrow>
          <PreviewHeaderTitle>주문서</PreviewHeaderTitle>
          <BackArrow aria-hidden> </BackArrow>
        </PreviewHeaderBar>
        <PaymentTitle>결제 수단</PaymentTitle>
        <PaymentList role="radiogroup" aria-label="결제 수단 선택">
          {paymentOptions.map((option) => {
            const checked = selectedPayment === option.id;
            return (
              <PaymentOption key={option.id}>
                <PaymentRadio
                  type="radio"
                  name="payment-option"
                  checked={checked}
                  onChange={() => setSelectedPayment(option.id)}
                  aria-label={option.label}
                />
                <PaymentLabel>{option.label}</PaymentLabel>
              </PaymentOption>
            );
          })}
        </PaymentList>
        <CardCompanyBox>
          <CardCompanyLabel>카드사 선택</CardCompanyLabel>
          <ChevronDown>∨</ChevronDown>
        </CardCompanyBox>
        <BottomFade />
      </PreviewSurface>
    );
  }, [openIndex, selectedPayment]);

  return (
    <SectionFrame active={active}>
      <SectionInner>
        <LeftPane>
          <SectionTitle>개발자의 시간을 아껴드려요</SectionTitle>
          <AccordionList>
            {accordionItems.map((item, index) => {
              const expanded = openIndex === index;
              return (
                <AccordionItemRow key={item.title} expanded={expanded}>
                  <AccordionTrigger
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    aria-expanded={expanded}
                    aria-controls={`feature-accordion-panel-${index}`}
                  >
                    <AccordionTitle expanded={expanded}>{item.title}</AccordionTitle>
                    <AccordionIcon>{expanded ? "∧" : "∨"}</AccordionIcon>
                  </AccordionTrigger>
                  <AccordionPanel
                    id={`feature-accordion-panel-${index}`}
                    expanded={expanded}
                    aria-hidden={!expanded}
                  >
                    <AccordionDescription>{item.description}</AccordionDescription>
                  </AccordionPanel>
                </AccordionItemRow>
              );
            })}
          </AccordionList>
        </LeftPane>

        <RightPane>
          <PreviewCardOuter>
            <PreviewAnimation key={openIndex}>{previewContent}</PreviewAnimation>
          </PreviewCardOuter>
        </RightPane>
      </SectionInner>
    </SectionFrame>
  );
}

const previewEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const SectionFrame = styled.div<{ active: boolean }>`
  width: 100%;
  background: #0d0d0d;
  opacity: ${({ active }) => (active ? 1 : 0.45)};
  transform: ${({ active }) => (active ? "translateY(0)" : "translateY(18px)")};
  transition: opacity 0.45s ease, transform 0.45s ease;
`;

const SectionInner = styled.div`
  width: min(1160px, calc(100% - 72px));
  margin: 0 auto;
  padding: 78px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 44px;
  align-items: center;

  @media (max-width: 1023px) {
    width: calc(100% - 40px);
    gap: 24px;
    padding: 58px 0;
    grid-template-columns: 1.05fr 0.95fr;
  }

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 46px 0;
  }
`;

const LeftPane = styled.div`
  width: 100%;
`;

const SectionTitle = styled.h2`
  margin: 0 0 22px 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(28px, 3vw, 32px);
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
`;

const AccordionList = styled.div`
  width: 100%;
`;

const AccordionItemRow = styled.div<{ expanded: boolean }>`
  border-top: 1px solid ${({ expanded }) => (expanded ? "#00c4b4" : "#262b31")};
  padding: 14px 0 10px 0;
  transition: border-color 0.25s ease-in-out;

  &:last-of-type {
    border-bottom: 1px solid ${({ expanded }) => (expanded ? "#00c4b4" : "#262b31")};
  }
`;

const AccordionTrigger = styled.button`
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const AccordionTitle = styled.span<{ expanded: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: ${({ expanded }) => (expanded ? "#00c4b4" : "#aaaaaa")};
  transition: color 0.25s ease-in-out;

  @media (max-width: 767px) {
    font-size: 20px;
  }
`;

const AccordionIcon = styled.span`
  color: #d4d8de;
  font-size: 18px;
`;

const AccordionPanel = styled.div<{ expanded: boolean }>`
  max-height: ${({ expanded }) => (expanded ? "120px" : "0px")};
  overflow: hidden;
  transition: max-height 0.25s ease-in-out;
`;

const AccordionDescription = styled.p`
  margin: 10px 0 0 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #cccccc;
  word-break: keep-all;
`;

const RightPane = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const PreviewCardOuter = styled.div`
  width: min(520px, 100%);
  min-height: 520px;
  border-radius: 22px;
  background: linear-gradient(155deg, #00c4b4 0%, #12d5c1 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;

  @media (max-width: 1023px) {
    min-height: 470px;
    padding: 16px;
  }
`;

const PreviewAnimation = styled.div`
  width: 100%;
  height: 100%;
  animation: ${previewEnter} 0.3s ease-in-out;
`;

const PreviewSurface = styled.div`
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 18px;
  position: relative;
  padding: 18px 18px 24px 18px;
  display: flex;
  flex-direction: column;
`;

const PreviewTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PreviewDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #00c4b4;
`;

const PreviewChip = styled.span`
  background: #e9fbf8;
  color: #06867c;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
`;

const CodeBlock = styled.pre`
  margin: 16px 0 0 0;
  width: 100%;
  border-radius: 14px;
  background: #0f1729;
  color: #d4e2ff;
  font-family: "Fira Code", "Menlo", monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 16px;
  overflow: auto;
`;

const PreviewHeaderBar = styled.div`
  display: grid;
  grid-template-columns: 20px 1fr 20px;
  align-items: center;
  margin-bottom: 14px;
`;

const BackArrow = styled.span`
  font-size: 14px;
  color: #667084;
  text-align: left;
`;

const PreviewHeaderTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  text-align: center;
`;

const NoCodeList = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NoCodeItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NoCodeLabel = styled.span`
  font-size: 14px;
  color: #111827;
  font-weight: 500;
`;

const NoCodeBadge = styled.span<{ disabled?: boolean }>`
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ disabled }) => (disabled ? "#6b7280" : "#07756b")};
  background: ${({ disabled }) => (disabled ? "#eef1f4" : "#e3faf7")};
`;

const PaymentTitle = styled.h3`
  margin: 6px 0 14px 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const PaymentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PaymentOption = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const PaymentRadio = styled.input`
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: #00c4b4;
`;

const PaymentLabel = styled.span`
  font-size: 14px;
  color: #151b2c;
`;

const CardCompanyBox = styled.div`
  margin-top: auto;
  min-height: 52px;
  border: 1px solid #d4d8de;
  border-radius: 12px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardCompanyLabel = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

const ChevronDown = styled.span`
  font-size: 14px;
  color: #667084;
`;

const BottomFade = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 76px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #ffffff 86%);
  pointer-events: none;
`;
