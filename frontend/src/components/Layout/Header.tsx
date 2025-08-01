import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
];

export function Header() {
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="JobStalker Logo" className="h-7 w-auto" />
          <span className="font-bold text-lg text-blue-900">JobStalker</span>
        </div>
        {/* Nav Links */}
        <div className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-gray-700 hover:text-blue-700 font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        {/* Auth Buttons */}
        <div className="flex gap-2">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-700">Log In</Button>
          </Link>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Sign Up Free</Button>
        </div>
      </nav>
    </header>
  );
} 