export const translations = {
  en: {
    'friday_prayer': 'Friday Prayer',
    'available_seats': 'Available seats',
    'you_are_registered': 'You are registered!',
    'view_qr_code': 'View QR Code',
    'register_now': 'Register Now',
    'people': 'People',
    'loading': 'Loading...',
    'registering': 'Registering...',
    'registration_confirmed': 'Registration Confirmed',
    'show_qr_code': 'Show this QR code for attendance verification',
    'cancel_registration': 'Cancel Registration',
    'prayer': 'Prayer',
    'no_upcoming_prayers': 'No upcoming prayers available for registration.',
    'facebook': 'Facebook',
    'impressum': 'Legal Notice'
  },
  de: {
    'friday_prayer': 'Freitagsgebet',
    'available_seats': 'Verfügbare Plätze',
    'you_are_registered': 'Sie sind registriert!',
    'view_qr_code': 'QR-Code anzeigen',
    'register_now': 'Jetzt registrieren',
    'people': 'Personen',
    'loading': 'Lädt...',
    'registering': 'Registrierung läuft...',
    'registration_confirmed': 'Registrierung bestätigt',
    'show_qr_code': 'Zeigen Sie diesen QR-Code zur Anwesenheitskontrolle',
    'cancel_registration': 'Registrierung stornieren',
    'prayer': 'Gebet',
    'no_upcoming_prayers': 'Keine anstehenden Gebete zur Registrierung verfügbar.',
    'facebook': 'Facebook',
    'impressum': 'Impressum'
  },
  ar: {
    'friday_prayer': 'صلاة الجمعة',
    'available_seats': 'المقاعد المتاحة',
    'you_are_registered': 'أنت مسجل!',
    'view_qr_code': 'عرض رمز الاستجابة السريعة',
    'register_now': 'سجل الآن',
    'people': 'أشخاص',
    'loading': 'جاري التحميل...',
    'registering': 'جاري التسجيل...',
    'registration_confirmed': 'تم تأكيد التسجيل',
    'show_qr_code': 'اعرض رمز الاستجابة السريعة هذا للتحقق من الحضور',
    'cancel_registration': 'إلغاء التسجيل',
    'prayer': 'صلاة',
    'no_upcoming_prayers': 'لا توجد صلوات قادمة متاحة للتسجيل.',
    'facebook': 'فيسبوك',
    'impressum': 'الإشعار القانوني'
  },
  fr: {
    'friday_prayer': 'Prière du vendredi',
    'available_seats': 'Places disponibles',
    'you_are_registered': 'Vous êtes inscrit!',
    'view_qr_code': 'Voir le code QR',
    'register_now': "S'inscrire maintenant",
    'people': 'Personnes',
    'loading': 'Chargement...',
    'registering': 'Inscription en cours...',
    'registration_confirmed': 'Inscription confirmée',
    'show_qr_code': 'Montrez ce code QR pour la vérification de présence',
    'cancel_registration': "Annuler l'inscription",
    'prayer': 'Prière',
    'no_upcoming_prayers': 'Aucune prière à venir disponible pour inscription.',
    'facebook': 'Facebook',
    'impressum': 'Mentions légales'
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // Check if user has previously selected a language
  const savedLang = localStorage.getItem('user_language') as Language;
  if (savedLang && translations[savedLang]) {
    console.log('Using saved language preference:', savedLang);
    return savedLang;
  }

  // Try navigator.language first, then navigator.languages array
  const languages = [navigator.language, ...(navigator.languages || [])];

  console.log('Browser languages detected:', languages);

  for (const lang of languages) {
    const browserLang = lang.toLowerCase();

    if (browserLang.startsWith('de')) {
      console.log('Detected German language:', browserLang);
      return 'de';
    }
    if (browserLang.startsWith('ar')) {
      console.log('Detected Arabic language:', browserLang);
      return 'ar';
    }
    if (browserLang.startsWith('fr')) {
      console.log('Detected French language:', browserLang);
      return 'fr';
    }
  }

  console.log('Defaulting to English');
  return 'en';
}

export function setUserLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_language', lang);
  }
}

export function translate(key: TranslationKey, lang: Language): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}