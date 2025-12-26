"use client";

import styled from "@emotion/styled";
import Image from "next/image";

type NavigationItem = {
  label: string;
  href: string;
  active?: boolean;
};

type TopNavigationProps = {
  logoSrc?: string;
  title?: string;
  navItems?: NavigationItem[];
  loginButtonText?: string;
  className?: string;
};

export function TopNavigation({
  logoSrc = "/images/ci-logo.png",
  title = "Developers",
  navItems = [
    { label: "API 둘러보기", href: "/apis", active: true },
    { label: "API 정적처리", href: "/static" },
    { label: "API 사용하기", href: "/usage" },
    { label: "가이드", href: "/guide" }
  ],
  loginButtonText = "로그인",
  className
}: TopNavigationProps) {
  return (
    <Container className={className}>
      <Nav>
        <LogoSection>
          <LogoImage>
            <Image src={logoSrc} alt="Logo" width={72} height={23} />
          </LogoImage>
          <Title>{title}</Title>
        </LogoSection>

        <NavItems>
          {navItems.map((item, index) => (
            <NavItem key={index} active={item.active}>
              {item.label}
            </NavItem>
          ))}
        </NavItems>
      </Nav>

      <LoginButton>{loginButtonText}</LoginButton>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 69px;
  padding: 0 30px;
  border-bottom: 0.5px solid rgba(115, 124, 151, 0.3);
  background: white;
  width: 100%;
  min-width: 1200px; /* Ensure it doesn't break on very small screens if needed, or just 100% */
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  height: 58px;
  flex: 1;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const LogoImage = styled.div`
  width: 72px;
  height: 23px;
  position: relative;
`;

const Title = styled.div`
  font-family: "Flight Sans Title", sans-serif;
  font-size: 28px;
  color: #16335C;
  width: 315px;
  height: 79px;
  display: flex;
  align-items: center;
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const NavItem = styled.div<{ active?: boolean }>`
  height: 35px;
  width: 168px;
  font-family: "Flight Sans", sans-serif;
  font-size: 18px;
  color: ${({ active }) => active ? "#16335C" : "#8B95A1"};
  white-space: pre;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;

  &:hover {
    color: #16335C;
  }
`;

const LoginButton = styled.div`
  height: 35px;
  width: 65px;
  font-family: "Flight Sans", sans-serif;
  font-size: 18px;
  color: #737C97;
  white-space: pre;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;

  &:hover {
    color: #16335C;
  }
`;