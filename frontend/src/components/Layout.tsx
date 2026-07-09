import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  useMock: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, useMock }) => {
  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand">
          <strong>JobFit</strong>
          <span>Career gap planner</span>
        </div>
        <span className="mode-pill">
          {useMock ? 'Local demo' : 'API ready'}
        </span>
      </header>
      
      <div className="main-wrapper">
        <div className="centered-hero">
          <h2>공고와 내 경험 사이의 빈틈을 확인하세요.</h2>
          <p>
            지금 가진 경험으로 어필할 수 있는 부분과, 4~8주 안에 보완할 프로젝트를 정리해드립니다.
          </p>
        </div>
        
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
};
