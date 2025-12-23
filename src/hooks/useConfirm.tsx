"use client";

import { useState, useCallback } from "react";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolveRef, setResolveRef] = useState<(value: boolean) => void>(() => { });

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef(true);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef(false);
  }, [resolveRef]);

  const ConfirmDialog = () => (
    <ConfirmModal
      isOpen={isOpen}
      title={options.title || "확인"}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog };
}
