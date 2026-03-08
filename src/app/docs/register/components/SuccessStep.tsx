import React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from "lucide-react";
import {
  SuccessContainer,
  SuccessTitle,
  CheckCircle,
  NextButton
} from '../styles';

export const SuccessStep = () => {
  const router = useRouter();

  return (
    <SuccessContainer>
      <SuccessTitle>API 등록이 완료되었습니다!</SuccessTitle>
      <CheckCircle>
        <Check size={64} color="#16335C" strokeWidth={3} />
      </CheckCircle>
      <NextButton onClick={() => router.push('/apis')} style={{ width: '200px', marginTop: '40px' }}>
        완료
      </NextButton>
    </SuccessContainer>
  );
};
