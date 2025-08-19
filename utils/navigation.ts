// navigation.ts

export interface NavLink {
  href: string;
  label: string;
}

export const navigationLinks: NavLink[] = [
  { href: '/technology', label: 'Technology' },
  { href: '/projects', label: 'Projects' },
  { href: '/country', label: 'Countries' },
  { href: '/about-us', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];
  