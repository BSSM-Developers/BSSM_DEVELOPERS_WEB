"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";

export function TopNav() {
  return (
    <Header>
      <Nav>
        <LogoWrapper href="/">
          <Image
            src="/BSM_DEV_LOGO.svg"
            alt="BSSM Developers"
            width={394}
            height={79}
            priority
          />
        </LogoWrapper>

        <Link href="/apis">API 둘러보기</Link>
        <Link href="/static">API 정적처리</Link>
        <Link href="/usage">API 사용하기</Link>
        <Link href="/guide">가이드</Link>
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

const LogoWrapper = styled(Link)`
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
  width: 1447px;
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
  width: 65px;
  height: 35px;
  color: ${({ theme }) => theme.colors.bssmGrey};
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
`;
