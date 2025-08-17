// components/Layout.tsx
import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import NavBar from './NavBar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const isHome = router.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className={`flex-grow ${isHome ? '' : 'pt-16'}`}>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
