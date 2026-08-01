import { useState } from "react";
import type { ReactNode } from "react";
import InternalHeader from "./InternalHeader";
import InternalResetContext from "./InternalResetContext";

interface InternalLayoutProps {
  children: ReactNode;
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  const [resetVersion, setResetVersion] = useState(0);
  const resetInternalPage = () => setResetVersion((version) => version + 1);

  return (
    <InternalResetContext.Provider value={{ resetVersion, resetInternalPage }}>
      <div className="min-h-screen bg-gray-50">
        <InternalHeader />
        {children}
      </div>
    </InternalResetContext.Provider>
  );
}
