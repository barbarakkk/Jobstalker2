import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="JobStalker" className="h-7" />
        <span className="font-bold text-lg">JobStalker</span>
      </div>
      <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
        <a href="#" className="hover:text-blue-600">Features</a>
        <a href="#" className="hover:text-blue-600">Pricing</a>
        <a href="#" className="hover:text-blue-600">About</a>
      </nav>
      <div className="flex gap-2">
        <Button variant="ghost">Log In</Button>
        <Button>Sign Up Free</Button>
      </div>
    </header>
  );
}
