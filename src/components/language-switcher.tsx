"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import i18nConfig from "../../i18nConfig"
import { useCurrentLocale } from "next-i18n-router/client"

const languageMap: { [key: string]: string } = {
  es: "Español",
  ca: "Català",
  en: "English",
  de: "Deutsch",
  nl: "Nederlands",
}

export function LanguageSwitcher() {
  const router = useRouter()
  const currentPathname = usePathname()
  const currentLocale = useCurrentLocale(i18nConfig)

  const handleLocaleChange = (newLocale: string) => {
    // set cookie for next-i18n-router
    const days = 30
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = "; expires=" + date.toUTCString()
    document.cookie = `NEXT_LOCALE=${newLocale};expires=${expires};path=/`

    // Construct new path by replacing the locale segment
    const segments = currentPathname.split('/');
    // Check if the second segment is a valid locale (since path starts with /)
    if (i18nConfig.locales.includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      // If no locale in path (e.g. default locale hidden), allow middleware/router to handle or splice it in
      // With prefixDefault: true, this case is rare for valid routes, but safe to just splice
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/');

    router.push(newPath);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languageMap).map(([langCode, langName]) => (
          <DropdownMenuItem
            key={langCode}
            onClick={() => handleLocaleChange(langCode)}
            disabled={currentLocale === langCode}
          >
            {langName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
