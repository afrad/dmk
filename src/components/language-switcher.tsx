'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    const currentPathname = pathname;
    const segments = currentPathname.split('/');

    // Remove current locale from path
    if (['en', 'de', 'fr', 'ar'].includes(segments[1])) {
      segments.splice(1, 1);
    }

    // Add new locale (unless it's English and we want clean URLs)
    const newPath = newLocale === 'en' ? segments.join('/') || '/' : `/${newLocale}${segments.join('/') || ''}`;

    router.push(newPath);
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">
        {currentLanguage?.flag} {currentLanguage?.name}
      </span>
      <div className="flex space-x-1">
        {languages
          .filter(lang => lang.code !== locale)
          .map(lang => (
            <Button
              key={lang.code}
              variant="ghost"
              size="sm"
              onClick={() => switchLanguage(lang.code)}
              className="text-xs"
            >
              {lang.flag}
            </Button>
          ))}
      </div>
    </div>
  );
}