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

Musterverein e.V.
Musterstraße 123
12345 Musterstadt
Deutschland

**Vertreten durch:**
Vorstand: Max Mustermann (1. Vorsitzender)

**Kontakt:**
Telefon: +49 (0) 123 456789
E-Mail: info@musterverein.de

**Registereintrag:**
Eintragung im Vereinsregister.
Registergericht: Amtsgericht Musterstadt
Registernummer: VR 12345

**Umsatzsteuer-ID:**
Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
DE123456789

**Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:**
Max Mustermann
Musterstraße 123
12345 Musterstadt

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
  en: {
    title: 'Legal Notice',
    content: `
**Legal Information**

Sample Association e.V.
Sample Street 123
12345 Sample City
Germany

**Represented by:**
Board: Max Sample (Chairman)

**Contact:**
Phone: +49 (0) 123 456789
Email: info@sampleassociation.de

**Registry Entry:**
Entry in the Association Register.
Registration Court: Local Court Sample City
Registration Number: VR 12345

**VAT ID:**
VAT identification number according to § 27 a VAT law:
DE123456789

**Responsible for content according to § 55 para. 2 RStV:**
Max Sample
Sample Street 123
12345 Sample City

**Disclaimer:**

**Liability for Content**
As service providers, we are liable for own contents of these websites according to Sec. 7, para. 1 German Telemedia Act (TMG). However, according to Sec. 8 to 10 German Telemedia Act (TMG), service providers are not under obligation to monitor foreign information provided or stored.

**Liability for Links**
Our offer contains links to external third party websites. We have no influence on the contents of those websites, therefore we cannot guarantee for those contents.

**Copyright**
Contents and compilations published on these websites by the providers are subject to German copyright laws. Reproduction, editing, distribution as well as the use of any kind outside the scope of the copyright law require a written permission of the author or originator.

**Privacy and Cookies**
This website uses cookies to enhance user experience. We use the following types of cookies:

**Essential Cookies**
These cookies are necessary for the proper functioning of the website and cannot be disabled. They store your language preferences and cookie consent.

**Functional Cookies**
These cookies enable enhanced functionality and personalization, such as storing your login credentials for prayer registration.

You can change your cookie settings at any time by clearing your browser's local storage.
    `
  }
};

export default function ImpressumPage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    setLanguage(getBrowserLanguage());
  }, []);

  const content = impressumContent[language === 'de' ? 'de' : 'en'];

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