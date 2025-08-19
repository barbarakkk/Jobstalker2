import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
	const { isDarkMode, toggleTheme } = useTheme();
	return (
		<Button
			variant="outline"
			size="icon"
			aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			onClick={toggleTheme}
			className="border-input"
		>
			{isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
		</Button>
	);
}



