import React, { ReactNode } from 'react';
import PreviewHeader from './PreviewHeader';
import PreviewFooter from './PreviewFooter';

interface PreviewLayoutProps {
  children: ReactNode;
}

const PreviewLayout: React.FC<PreviewLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PreviewHeader />
      <main className="flex-grow">{children}</main>
      <PreviewFooter />
    </div>
  );
};

export default PreviewLayout;
