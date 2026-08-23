import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export default function Logo({
  href = '/',
  className = '',
  markClassName = '',
  textClassName = '',
}: LogoProps) {
  const content = (
    <>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-forest-800 text-[11px] font-extrabold tracking-tight text-white shrink-0 ${markClassName}`}
      >
        A6
      </span>
      <span className={`text-sm font-semibold text-forest-700 ${textClassName}`}>
        Article6
      </span>
    </>
  );

  const linkClasses = `preview-focus-ring flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1 transition-colors hover:bg-forest-50 ${className}`;

  if (href) {
    return (
      <Link href={href} className={linkClasses}>
        {content}
      </Link>
    );
  }

  return <span className={linkClasses}>{content}</span>;
}
