import Image from 'next/image';

interface DashboardImageProps {
  src: string;
  alt: string;
}

export default function DashboardImage({ src, alt }: DashboardImageProps) {
  const url = `https://ik.imagekit.io/ufokswd8x/${src}`;
  return (
    <div className="relative w-full h-64 md:h-96">
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover rounded-xl"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    </div>
  );
}
