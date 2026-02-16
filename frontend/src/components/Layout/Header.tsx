import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contacts', href: '#contacts' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={ColoredLogoHorizontal} 
            alt="JobStalker AI" 
            className="h-7 w-auto"
          />
        </Link>

        {/* Desktop Nav Links - Center */}
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            link.href.startsWith('/') ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-blue-800 hover:text-blue-900 font-medium text-sm transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-blue-800 hover:text-blue-900 font-medium text-sm transition-colors"
              >
                {link.label}
              </a>
            )
          ))}
        </div>

        {/* Desktop Auth Buttons - Right */}
        <div className="hidden lg:flex gap-3 items-center">
          <Link to="/login">
            <Button variant="ghost" className="text-blue-800 hover:text-blue-900 font-medium">
              Login
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button className="bg-blue-800 hover:bg-blue-900 text-white font-medium">
              Sign up
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            link.href.startsWith('/') ? (
              <Link
                key={link.href}
                to={link.href}
                className="block text-blue-800 hover:text-blue-900 font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="block text-blue-800 hover:text-blue-900 font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          ))}
          <div className="pt-4 space-y-3 border-t border-gray-100">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-blue-800 hover:text-blue-900">
                Login
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-blue-800 hover:bg-blue-900 text-white">
                Sign up
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
