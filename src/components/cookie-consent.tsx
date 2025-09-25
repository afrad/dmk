'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { translate, Language, TranslationKey } from '@/lib/translations';

interface CookieConsentProps {
  language: Language;
}

// Add cookie consent translations
const cookieTranslations = {
  en: {
    'cookie_title': 'We use cookies',
    'cookie_message': 'This website uses essential cookies to ensure you get the best experience. We use cookies for functionality, analytics, and to remember your preferences.',
    'cookie_accept': 'Accept all cookies',
    'cookie_essential': 'Accept essential only',
    'cookie_learn_more': 'Learn more'
  },
  de: {
    'cookie_title': 'Wir verwenden Cookies',
    'cookie_message': 'Diese Website verwendet notwendige Cookies, um Ihnen die beste Erfahrung zu bieten. Wir verwenden Cookies für Funktionalität, Analysen und um Ihre Präferenzen zu speichern.',
    'cookie_accept': 'Alle Cookies akzeptieren',
    'cookie_essential': 'Nur notwendige akzeptieren',
    'cookie_learn_more': 'Mehr erfahren'
  },
  ar: {
    'cookie_title': 'نحن نستخدم ملفات تعريف الارتباط',
    'cookie_message': 'يستخدم هذا الموقع ملفات تعريف الارتباط الأساسية لضمان حصولك على أفضل تجربة. نستخدم ملفات تعريف الارتباط للوظائف والتحليلات ولتذكر تفضيلاتك.',
    'cookie_accept': 'قبول جميع ملفات تعريف الارتباط',
    'cookie_essential': 'قبول الضرورية فقط',
    'cookie_learn_more': 'اعرف المزيد'
  },
  fr: {
    'cookie_title': 'Nous utilisons des cookies',
    'cookie_message': 'Ce site web utilise des cookies essentiels pour vous garantir la meilleure expérience. Nous utilisons des cookies pour les fonctionnalités, les analyses et pour mémoriser vos préférences.',
    'cookie_accept': 'Accepter tous les cookies',
    'cookie_essential': 'Accepter uniquement les essentiels',
    'cookie_learn_more': 'En savoir plus'
  }
};

type CookieTranslationKey = keyof typeof cookieTranslations.en;

export default function CookieConsent({ language }: CookieConsentProps) {
  const [showConsent, setShowConsent] = useState(false);

  const t = (key: CookieTranslationKey) => {
    return cookieTranslations[language]?.[key] || cookieTranslations.en[key] || key;
  };

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('cookie_consent');
    if (!hasConsent) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', 'all');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowConsent(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('cookie_consent', 'essential');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-600 shadow-2xl p-6 z-50"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🍪 {t('cookie_title')}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {t('cookie_message')}{' '}
              <Link
                href="/impressum"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('cookie_learn_more')}
              </Link>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
            <button
              onClick={handleAcceptEssential}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm whitespace-nowrap"
            >
              {t('cookie_essential')}
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm whitespace-nowrap"
            >
              {t('cookie_accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}