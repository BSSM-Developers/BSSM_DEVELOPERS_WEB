"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  hideCancel = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <Overlay>
      <Backdrop onClick={hideCancel ? undefined : onCancel} />
      <ModalContainer>
        <Title>{title}</Title>
        <Message>{message}</Message>
        <ButtonGroup>
          {!hideCancel && <CancelButton onClick={onCancel}>{cancelText}</CancelButton>}
          <ConfirmButton onClick={onConfirm}>{confirmText}</ConfirmButton>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.2s ease-out;
  z-index: 10;

  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const Title = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #191F28;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const Message = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  color: #4B5563;
  margin: 0 0 24px 0;
  line-height: 1.5;
  letter-spacing: -0.3px;
  white-space: pre-wrap;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
`;

const CancelButton = styled(Button)`
  background: #F3F4F6;
  color: #4B5563;
  &:hover {
    background: #E5E7EB;
  }
`;

const ConfirmButton = styled(Button)`
  background: #EF4444;
  color: white;
  &:hover {
    background: #DC2626;
  }
`;
