import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

export const Container = styled.div`
  min-height: calc(100vh - 69px);
  background: white;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
`;

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PageTitle = styled.h1`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
`;

export const PageDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 0;
`;

export const SaveButton = styled.button`
  height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  min-height: calc(100vh - 205px);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

export const SidePanel = styled.aside`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.grey[50]};
  min-height: 640px;
`;

export const EditorPanel = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 12px;
  background: white;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
  font-weight: 700;
`;

export const Input = styled.input`
  height: 42px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 8px;
  padding: 0 12px;
  background: white;
  color: ${({ theme }) => theme.colors.grey[900]};
  ${({ theme }) => applyTypography(theme, "Body_4")};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

export const TextArea = styled.textarea`
  min-height: 96px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 8px;
  padding: 10px 12px;
  background: white;
  color: ${({ theme }) => theme.colors.grey[900]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 10px;
  padding: 10px 12px;
  background: white;
`;

export const ToggleTitle = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[800]};
  font-weight: 700;
`;

export const ToggleButton = styled.button<{ active: boolean }>`
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid ${({ theme, active }) => (active ? theme.colors.bssmDarkBlue : theme.colors.grey[300])};
  background: ${({ theme, active }) => (active ? theme.colors.bssmDarkBlue : "white")};
  color: ${({ theme, active }) => (active ? "white" : theme.colors.grey[700])};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  cursor: pointer;
`;

export const SelectedPage = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 10px;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.grey[50]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

export const BlocksArea = styled.div`
  min-height: 280px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const EmptyText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 0;
`;

export const StatusText = styled.p<{ error?: boolean }>`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme, error }) => (error ? theme.colors.bssmRed : theme.colors.grey[500])};
  margin: 0;
`;

export const Section = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 12px;
  background: white;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SectionTitle = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
`;

export const SectionDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 0;
`;

export const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

export const Button = styled.button`
  height: 40px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  cursor: pointer;
`;

export const GhostButton = styled(Button)`
  background: white;
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
`;

export const Select = styled.select`
  height: 40px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 8px;
  padding: 0 12px;
  background: white;
  color: ${({ theme }) => theme.colors.grey[900]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
`;

export const CodeArea = styled.textarea`
  width: 100%;
  min-height: 260px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 8px;
  padding: 12px;
  background: white;
  color: ${({ theme }) => theme.colors.grey[900]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  resize: vertical;
`;

export const DocsEditContentArea = styled.div`
  min-height: 500px;
  padding: 0 48px 120px;
  display: flex;
  flex-direction: column;
`;

export const DocsEditSaveButton = styled.button`
  width: 132px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #16335c;
  color: white;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(22, 51, 92, 0.2);

  &:hover {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DocsEditFloatingActions = styled.div`
  position: fixed;
  right: 32px;
  bottom: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 4000;

  @media (max-width: 1280px) {
    right: 20px;
    bottom: 20px;
  }
`;

export const DocsEditEmptyText = styled.div`
  padding: 20px 0;
  color: #9ca3af;
`;

export const DocsEditReadonlyNotice = styled.div`
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
`;

export const DocsEditErrorBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
`;

export const DocsEditMarqueeSelectionBox = styled.div`
  position: fixed;
  border: 1px solid rgba(59, 130, 246, 0.8);
  background: rgba(59, 130, 246, 0.14);
  pointer-events: none;
  z-index: 5000;
`;
