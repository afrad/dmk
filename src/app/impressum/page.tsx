'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserLanguage, translate, Language, TranslationKey } from '@/lib/translations';
import CookieConsent from '@/components/cookie-consent';

const impressumContent = {
  de: {
    title: 'Impressum',
    content: `
**Angaben gemäß § 5 TMG**

Deutschsprachiger Muslimkreis Braunschweig e.V.
Reichsstraße 6a
38100 braunschweig
Deutschland

**Vertreten durch:**
Vorstand: Youssif Isamail (1. Vorsitzender)

**Kontakt:**
Telefon: +49 (0) 174 4442555
E-Mail: info@dmk-bs.de

**Registereintrag:**
Eintragung im Vereinsregister.
Registergericht: Amtsgericht Braunschweig

**Haftungsausschluss:**

**Haftung für Inhalte**
Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

**Haftung für Links**
Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

**Urheberrecht**
Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.

**Datenschutz und Cookies**
Diese Website verwendet Cookies zur Verbesserung der Benutzererfahrung. Wir verwenden folgende Arten von Cookies:

**Notwendige Cookies**
Diese Cookies sind für das ordnungsgemäße Funktionieren der Website erforderlich und können nicht deaktiviert werden. Sie speichern Ihre Sprachpräferenzen und Ihre Cookie-Zustimmung.

**Funktionale Cookies**
Diese Cookies ermöglichen erweiterte Funktionalitäten und Personalisierung, wie z.B. die Speicherung Ihrer Anmeldedaten für die Gebetsregistrierung.

Sie können Ihre Cookie-Einstellungen jederzeit ändern, indem Sie den lokalen Speicher Ihres Browsers löschen.
    `
  },

};

export default function ImpressumPage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    setLanguage(getBrowserLanguage());
  }, []);

  const content = impressumContent[language === 'en' ? 'de' : 'de'];

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">{content.title}</h1>

          <div className="prose prose-lg max-w-none">
            {content.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h2 key={index} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                    {paragraph.replace(/\*\*/g, '')}
                  </h2>
                );
              }
              return (
                <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Cookie Consent Popup */}
      <CookieConsent language={language} />
    </div>
  );
}