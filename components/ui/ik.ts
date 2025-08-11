export const ik = (src: string, tr = 'tr=w-1600,q-80,fo-auto'): string =>
  src.endsWith('?') ? `${src}${tr}` : src.includes('?') ? `${src}&${tr}` : `${src}?${tr}`;
