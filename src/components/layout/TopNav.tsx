"use client";

import styled from "@emotion/styled";
import Image from "next/image";

export function TopNav() {
  return (
    <Header>
      <Image src="/BSM_DEV_LOGO.svg" alt="BSSM Developers" width={394} height={79} />
      <Nav>
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
  height: 69px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.bssmGrey};
  background: #ffffff;
`;

const Logo = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
`;

const Nav = styled.nav`
  display: flex;
  gap: 32px;

  a {
    color: ${({ theme }) => theme.colors.grey[500]};
    font-weight: 500;
    font-size: 15px;
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.bssmBlue};
    }
  }
`;

const LoginButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.bssmGrey};
  cursor: pointer;
`;