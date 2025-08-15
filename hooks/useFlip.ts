import { useState } from 'react';

const useFlip = (initial: boolean = false) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(initial);

  const toggle = () => setIsFlipped((f) => !f);

  return [isFlipped, toggle] as const;
};

export default useFlip;
