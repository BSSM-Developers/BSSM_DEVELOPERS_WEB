"use client";

import styled from "@emotion/styled";
import Image from "next/image";

export function TopNav() {
  return (
    <Header>
      <Nav>
      <LogoWrapper>
        <Image
          src="/BSM_DEV_LOGO.svg"
          alt="BSSM Developers"
          width={394}
          height={79}
          priority
        />
      </LogoWrapper>

        <a href="#">API 둘러보기</a>
        <a href="#">API 공유하기</a>
        <a href="#">API 사용하기</a>
        <a href="#">가이드</a>
      </Nav>

      <LoginButton>로그인</LoginButton>
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  height: 69px;
  padding: 0 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[200]};
  background: ${({ theme }) => theme.colors.background};
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    object-fit: contain;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  width:1447px;
  gap: 69px;

  a {
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.grey[400]};
    text-decoration: none;
  }
`;

const LoginButton = styled.button`
  border: none;
  background: none;
  width:65px;
  height:35px;
  color: ${({ theme }) => theme.colors.bssmGrey};
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
`;
