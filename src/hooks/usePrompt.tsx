"use client";

import { useState, useCallback } from "react";
import { PromptModal } from "@/components/ui/modal/PromptModal";

interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export function usePrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions>({ message: "" });
  const [resolveRef, setResolveRef] = useState<(value: string | null) => void>(() => { });

  const prompt = useCallback((options: PromptOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<string | null>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback((value: string) => {
    setIsOpen(false);
    resolveRef(value);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef(null);
  }, [resolveRef]);

  const promptDialog = (
    <PromptModal
      isOpen={isOpen}
      title={options.title || "입력"}
      message={options.message}
      placeholder={options.placeholder}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { prompt, PromptDialog: promptDialog };
}