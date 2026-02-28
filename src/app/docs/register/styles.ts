import styled from "@emotion/styled";

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StepContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 80px;
`;

export const LeftPanel = styled.div`
  flex: 1;
`;

export const RightPanel = styled.div`
  width: 400px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 80px;
`;

export const Header = styled.div`
  margin-bottom: 40px;
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

export const Footer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 60px;
`;

export const Button = styled.button`
  padding: 12px 32px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  transition: all 0.2s;
`;

export const PrevButton = styled(Button)`
  background: white;
  border: 1px solid #E5E7EB;
  color: #000;
  
  &:hover {
    background: #F9FAFB;
  }
`;

export const NextButton = styled(Button)`
  background: #16335C;
  border: 1px solid #16335C;
  color: white;

  &:hover {
    background: #1a3a68;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const ConfirmContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

export const ConfirmTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-bottom: 60px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

export const PreviewCardWrapper = styled.div`
  width: 400px;
`;

export const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SuccessTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-bottom: 60px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

export const CheckCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid #16335C;
  display: flex;
  justify-content: center;
  align-items: center;
`;
