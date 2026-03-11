"use client";

import { useEffect, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const TEXT_INPUT_TYPES = new Set(["text", "search", "url", "email", "password", "tel"]);
const DEFAULT_INPUT_MAX_LENGTH = 240;
const DEFAULT_TEXTAREA_MAX_LENGTH = 4000;
const ALMOST_FULL_RATIO = 0.92;
const NOTICE_COOLDOWN_MS = 1200;

const isTargetInput = (target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement => {
  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly && target.dataset.lengthGuard !== "off";
  }

  if (target instanceof HTMLInputElement) {
    return (
      !target.disabled &&
      !target.readOnly &&
      target.dataset.lengthGuard !== "off" &&
      TEXT_INPUT_TYPES.has(target.type)
    );
  }

  return false;
};

const getEffectiveLimit = (target: HTMLInputElement | HTMLTextAreaElement): number => {
  const baseLimit =
    target.maxLength > 0
      ? target.maxLength
      : target instanceof HTMLTextAreaElement
        ? DEFAULT_TEXTAREA_MAX_LENGTH
        : DEFAULT_INPUT_MAX_LENGTH;
  return Math.max(1, Math.floor(baseLimit * ALMOST_FULL_RATIO));
};

const getPredictedLength = (
  target: HTMLInputElement | HTMLTextAreaElement,
  event: InputEvent
): number => {
  if (event.inputType.startsWith("delete")) {
    return target.value.length;
  }

  const selectionStart = target.selectionStart ?? target.value.length;
  const selectionEnd = target.selectionEnd ?? selectionStart;
  const selectedLength = selectionEnd - selectionStart;
  const insertedLength =
    typeof event.data === "string"
      ? event.data.length
      : event.inputType === "insertLineBreak" || event.inputType === "insertParagraph"
        ? 1
        : 1;
  return target.value.length - selectedLength + insertedLength;
};

export function InputLengthGuard() {
  const { confirm, ConfirmDialog } = useConfirm();
  const lastNotifiedAtRef = useRef(new WeakMap<HTMLInputElement | HTMLTextAreaElement, number>());

  const notifyLimitReached = (target: HTMLInputElement | HTMLTextAreaElement) => {
    const now = Date.now();
    const previous = lastNotifiedAtRef.current.get(target) ?? 0;
    if (now - previous < NOTICE_COOLDOWN_MS) {
      return;
    }
    lastNotifiedAtRef.current.set(target, now);
    void confirm({
      title: "입력 제한",
      message: "입력 가능한 길이에 도달했습니다. 내용을 줄인 뒤 다시 입력해 주세요.",
      confirmText: "확인",
      hideCancel: true,
    });
  };

  useEffect(() => {
    const handleBeforeInput = (event: Event) => {
      const inputEvent = event as InputEvent;
      const target = event.target;
      if (!isTargetInput(target)) {
        return;
      }
      const limit = getEffectiveLimit(target);
      const predictedLength = getPredictedLength(target, inputEvent);

      if (predictedLength <= limit) {
        return;
      }

      event.preventDefault();
      notifyLimitReached(target);
    };

    const handleInput = (event: Event) => {
      const target = event.target;
      if (!isTargetInput(target)) {
        return;
      }
      const limit = getEffectiveLimit(target);
      if (target.value.length <= limit) {
        return;
      }
      target.value = target.value.slice(0, limit);
      notifyLimitReached(target);
    };

    document.addEventListener("beforeinput", handleBeforeInput, true);
    document.addEventListener("input", handleInput, true);
    return () => {
      document.removeEventListener("beforeinput", handleBeforeInput, true);
      document.removeEventListener("input", handleInput, true);
    };
  }, [confirm]);

  return <>{ConfirmDialog}</>;
}
