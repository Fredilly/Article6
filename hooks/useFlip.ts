import { useState } from 'react';

const useFlip = (initial = false) => {
  const [isFlipped, setIsFlipped] = useState(initial);

  const toggle = () => setIsFlipped(!isFlipped);

  return [isFlipped, toggle];
};

export default useFlip;
