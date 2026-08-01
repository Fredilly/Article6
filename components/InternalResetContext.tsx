import { createContext, useContext } from "react";

interface InternalResetContextValue {
  resetVersion: number;
  resetInternalPage: () => void;
}

const InternalResetContext = createContext<InternalResetContextValue>({
  resetVersion: 0,
  resetInternalPage: () => undefined,
});

export function useInternalReset() {
  return useContext(InternalResetContext);
}

export default InternalResetContext;
