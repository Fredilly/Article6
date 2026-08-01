import type { ReactNode } from "react";
import InternalHeader from "./InternalHeader";

interface InternalLayoutProps {
  children: ReactNode;
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <InternalHeader />
      {children}
    </div>
  );
}
