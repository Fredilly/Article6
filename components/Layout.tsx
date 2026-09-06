// components/Layout.tsx
import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const isParentSurface = router.pathname === '/' || router.pathname === '/contact' || router.pathname === '/approach';

  if (isParentSurface) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
