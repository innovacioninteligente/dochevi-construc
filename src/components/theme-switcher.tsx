"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, Palette } from "lucide-react"

export function ThemeSwitcher() {
  const { setTheme, theme, themes } = useTheme()

  const themeColors = [
    { name: "Blue", class: "theme-blue" },
    { name: "Green", class: "theme-green" },
    { name: "Orange", class: "theme-orange" },
  ]

  const handleSetTheme = (newTheme: string) => {
    const currentColorScheme = theme?.startsWith('dark-') ? 'dark-' : '';
    const baseTheme = newTheme.split('-')[1] || newTheme;
    setTheme(`${currentColorScheme}${baseTheme}`);
  }

  const toggleDarkMode = () => {
    const isDark = theme?.startsWith('dark-');
    const baseTheme = theme?.replace('dark-', '') || 'theme-blue';
    setTheme(isDark ? baseTheme : `dark-${baseTheme}`);
  }

  const isDarkMode = theme?.startsWith('dark-');
  const currentBaseTheme = theme?.replace('dark-', '');


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Color Scheme</DropdownMenuLabel>
        {themeColors.map((color) => (
          <DropdownMenuItem
            key={color.class}
            onClick={() => setTheme(isDarkMode ? `dark-${color.class}` : color.class)}
            disabled={currentBaseTheme === color.class}
          >
            {color.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
         <DropdownMenuItem onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
