import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';


const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <nav className="container mx-auto flex items-center justify-between py-4 px-2 lg:px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 -ml-1">
          <img 
            src={ColoredLogoHorizontal} 
            alt="JobStalker" 
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex gap-3 items-center">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-gray-100">
              Log In
            </Button>
          </Link>

        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-gray-600 hover:text-blue-600 font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 space-y-3">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-600 hover:text-blue-600 hover:bg-gray-100">
                Log In
              </Button>
            </Link>

          </div>
        </div>
      )}
    </header>
  );
} 