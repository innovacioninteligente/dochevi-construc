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
import { Moon, Sun, Palette } from "lucide-react"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  const themeColors = [
    { name: "Blue", class: "theme-blue" },
    { name: "Green", class: "theme-green" },
    { name: "Orange", class: "theme-orange" },
  ]

  const isDarkMode = theme?.startsWith('dark-')
  const currentBaseTheme = isDarkMode ? theme.substring(5) : theme

  const toggleDarkMode = () => {
    const baseTheme = currentBaseTheme || "theme-blue"
    setTheme(isDarkMode ? baseTheme : `dark-${baseTheme}`)
  }

  const handleSetBaseTheme = (newBaseTheme: string) => {
    setTheme(isDarkMode ? `dark-${newBaseTheme}` : newBaseTheme)
  }

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
            onClick={() => handleSetBaseTheme(color.class)}
            disabled={currentBaseTheme === color.class}
          >
            {color.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleDarkMode}>
          {isDarkMode ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
