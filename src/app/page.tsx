'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PrayerWithRegistrations, LocalStorageRegistration } from '@/types';
import { getDeviceKey } from '@/lib/utils';
import { QRCode } from '@/components/qr-code';
import { getBrowserLanguage, translate, Language, TranslationKey, setUserLanguage } from '@/lib/translations';
import CookieConsent from '@/components/cookie-consent';

// QR Code display component
interface QRDisplayProps {
  prayer: PrayerWithRegistrations;
  people: number;
  qrData: any;
  onCancel: () => void;
  language: Language;
}

function QRDisplay({ prayer, people, qrData, onCancel, language }: QRDisplayProps) {
  const t = (key: TranslationKey) => translate(key, language);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="mb-6">
          <div className="text-2xl mb-2">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">{t('registration_confirmed')}</h1>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <QRCode payload={qrData} size={200} className="mx-auto mb-4" />
          <div className="text-xs text-gray-500 text-center">
            {t('show_qr_code')}
          </div>
        </div>

        <div className="space-y-3 text-left mb-8">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('prayer')}:</span>
            <span className="font-semibold">{prayer.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-semibold">{formatDate(prayer.datetime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-semibold">{formatTime(prayer.datetime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('people')}:</span>
            <span className="font-semibold text-green-600">{people}</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
        >
          {t('cancel_registration')}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [prayers, setPrayers] = useState<PrayerWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [registrationData, setRegistrationData] = useState<{
    prayer: PrayerWithRegistrations;
    people: number;
    qrData: any;
    registrationId?: string;
  } | null>(null);

  const t = (key: TranslationKey) => {
    const translated = translate(key, language);
    // Only log first time to avoid spam
    if (key === 'friday_prayer') {
      console.log(`Translating "${key}" with language "${language}":`, translated);
    }
    return translated;
  };

  // Get the next open prayer
  const nextPrayer = prayers.find(p => p.status === 'open');
  const isRegistered = nextPrayer ? localStorage.getItem(`fridayReg:${nextPrayer.id}`) !== null : false;

  useEffect(() => {
    // Set browser language on mount
    const detectedLang = getBrowserLanguage();
    console.log('Setting language to:', detectedLang);
    setLanguage(detectedLang);
    fetchPrayers();
  }, []);

  // Check for existing registration when prayers load
  useEffect(() => {
    if (nextPrayer && !registrationData) {
      const existingReg = localStorage.getItem(`fridayReg:${nextPrayer.id}`);
      if (existingReg) {
        try {
          const parsed = JSON.parse(existingReg);
          setRegistrationData({
            prayer: nextPrayer,
            people: parsed.people,
            qrData: parsed.qr_json,
            registrationId: parsed.registration_id
          });
        } catch (error) {
          console.error('Error parsing stored registration:', error);
          // Clear corrupted data
          localStorage.removeItem(`fridayReg:${nextPrayer.id}`);
        }
      }
    }
  }, [nextPrayer, registrationData]);

  const fetchPrayers = async () => {
    try {
      const response = await fetch('/api/prayers');
      if (response.ok) {
        const data = await response.json();
        setPrayers(data.map((prayer: any) => ({
          ...prayer,
          datetime: new Date(prayer.datetime)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!nextPrayer) return;

    setIsRegistering(true);
    try {
      const deviceKey = getDeviceKey();

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayer_id: nextPrayer.id,
          people,
          device_key: deviceKey,
          lang: 'en',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Registration API error:', {
          status: response.status,
          statusText: response.statusText,
          error
        });

        // Handle duplicate registration specially
        if (response.status === 409 && error.error === 'Device already registered for this prayer') {
          // Check if we have existing registration in localStorage
          const existingReg = localStorage.getItem(`fridayReg:${nextPrayer.id}`);
          if (existingReg) {
            const parsed = JSON.parse(existingReg);
            setRegistrationData({
              prayer: nextPrayer,
              people: parsed.people,
              qrData: parsed.qr_json,
              registrationId: parsed.registration_id
            });
            return;
          }
        }

        throw new Error(error.error || 'Registration failed');
      }

      const result = await response.json();

      // Store registration in localStorage
      const registration: LocalStorageRegistration = {
        people,
        qr_json: result.qr,
        lastSeenISO: new Date().toISOString(),
        lang: 'en',
        registration_id: result.id  // Store the registration ID
      };

      localStorage.setItem(`fridayReg:${nextPrayer.id}`, JSON.stringify(registration));

      // Show QR code screen
      setRegistrationData({
        prayer: nextPrayer,
        people,
        qrData: result.qr,
        registrationId: result.id  // Pass registration ID to UI
      });

      // Refresh prayers to show updated capacity
      fetchPrayers();
    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!registrationData || !nextPrayer) return;

    setLoading(true);
    try {
      // Get registration ID from state or localStorage
      let registrationId = registrationData.registrationId;

      if (!registrationId) {
        // Try to get from localStorage
        const existingReg = localStorage.getItem(`fridayReg:${nextPrayer.id}`);
        if (existingReg) {
          const parsed = JSON.parse(existingReg);
          registrationId = parsed.registration_id;
        }
      }

      if (!registrationId) {
        throw new Error('Registration ID not found');
      }

      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel registration');
      }

      // Remove from localStorage and update UI
      localStorage.removeItem(`fridayReg:${nextPrayer.id}`);
      setRegistrationData(null);
      await fetchPrayers();

    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show QR code screen if registered
  if (registrationData) {
    return (
      <QRDisplay
        prayer={registrationData.prayer}
        people={registrationData.people}
        qrData={registrationData.qrData}
        onCancel={handleCancelRegistration}
        language={language}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="text-2xl font-semibold text-blue-600">{t('loading')}</div>
      </div>
    );
  }

  if (!nextPrayer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🕌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('friday_prayer')}</h1>
          <p className="text-gray-600">{t('no_upcoming_prayers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-emerald-300 rounded-full transform rotate-45"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border-4 border-teal-300 rounded-full transform rotate-12"></div>
        <div className="absolute bottom-20 left-32 w-40 h-40 border-4 border-green-300 rounded-full transform -rotate-12"></div>
        <div className="absolute bottom-40 right-16 w-28 h-28 border-4 border-emerald-300 rounded-full transform rotate-45"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-emerald-100/50 overflow-hidden">
        {/* Islamic Decorative Border */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>

        {/* Header with DMK Logo and Islamic Design */}
        <div className="text-center mb-8">
          {/* DMK Logo */}
          <div className="relative inline-block mb-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <Image
                src="/logo.jpg"
                alt="DMK - Deutschsprachiger Muslimkreis Braunschweig"
                fill
                className="object-contain drop-shadow-lg rounded-lg"
                priority
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">✦</span>
              </div>
            </div>
          </div>

          {/* Prayer Title with Islamic Styling */}
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent mb-4">{t('friday_prayer')}</h1>
            <div className="flex items-center justify-center mb-4">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent flex-1"></div>
              <span className="mx-4 text-emerald-600 text-xl">☪</span>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent flex-1"></div>
            </div>
          </div>

          {/* Date and Time with Islamic Design */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-inner border border-emerald-200 relative">
            <div className="absolute top-2 left-2 text-emerald-300 text-lg">✦</div>
            <div className="absolute top-2 right-2 text-emerald-300 text-lg">✦</div>
            <div className="absolute bottom-2 left-2 text-emerald-300 text-lg">✦</div>
            <div className="absolute bottom-2 right-2 text-emerald-300 text-lg">✦</div>

            <div className="text-emerald-800 font-medium mb-2 text-lg">
              {formatDate(nextPrayer.datetime)}
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              {formatTime(nextPrayer.datetime)}
            </div>
          </div>
        </div>

        {nextPrayer.remaining && nextPrayer.remaining < 20 && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">{t('available_seats')}</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <span className="text-2xl">🪑</span>
                {nextPrayer.remaining}
              </div>
            </div>
          </div>
        )}

        {isRegistered ? (
          <div className="text-center">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-sm mb-6 relative">
              <div className="absolute top-1 left-1 text-emerald-300 text-sm">✦</div>
              <div className="absolute top-1 right-1 text-emerald-300 text-sm">✦</div>
              <div className="text-6xl mb-3">🕌</div>
              <div className="text-emerald-700 font-bold text-xl">{t('you_are_registered')}</div>
              <div className="text-emerald-600 text-sm mt-2 flex items-center justify-center gap-2">
                <span>☪</span>
                Registration confirmed
                <span>☪</span>
              </div>
            </div>
            <button
              onClick={() => {
                const stored = localStorage.getItem(`fridayReg:${nextPrayer.id}`);
                if (stored) {
                  const data = JSON.parse(stored);
                  setRegistrationData({
                    prayer: nextPrayer,
                    people: data.people,
                    qrData: data.qr_json
                  });
                }
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 text-lg shadow-lg hover:shadow-xl border border-emerald-500"
            >
              <span className="flex items-center justify-center gap-3">
                <span className="text-xl">📱</span>
                {t('view_qr_code')}
                <span className="text-sm">☪</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-3">{t('people')}</div>
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => setPeople(Math.max(1, people - 1))}
                  disabled={people <= 1}
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-full font-bold text-xl transition-colors"
                >
                  -
                </button>
                <div className="text-4xl font-bold text-blue-600 w-16 text-center">{people}</div>
                <button
                  onClick={() => setPeople(Math.min(5, Math.min(people + 1, nextPrayer.remaining || 0)))}
                  disabled={people >= 5 || people >= (nextPrayer.remaining || 0)}
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-full font-bold text-xl transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={isRegistering || nextPrayer.status !== 'open' || (nextPrayer.remaining || 0) < people}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-6 px-6 rounded-xl transition-colors text-xl"
            >
              {isRegistering ? t('registering') : t('register_now')}
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-8 space-y-4">
          {/* Language Selector with Islamic Design */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-3 shadow-inner border border-emerald-200 relative">
              <div className="absolute -top-1 -left-1 text-emerald-400 text-xs">✦</div>
              <div className="absolute -top-1 -right-1 text-emerald-400 text-xs">✦</div>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setLanguage(newLang);
                  setUserLanguage(newLang);
                  console.log('User changed language to:', newLang);
                }}
                className="text-sm bg-transparent border-none outline-none font-medium text-emerald-700 cursor-pointer"
              >
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇸🇦 العربية</option>
              </select>
            </div>
          </div>

          {/* Social Links with Islamic Design */}
          <div className="flex justify-center space-x-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-600 hover:text-emerald-800 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 border border-emerald-200 shadow-sm relative"
            >
              <div className="absolute -top-0.5 -left-0.5 text-emerald-400 text-xs">✦</div>
              <span className="text-base">📘</span>
              {t('facebook')}
            </a>
            <Link
              href="/impressum"
              className="flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-600 hover:text-teal-800 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 border border-teal-200 shadow-sm relative"
            >
              <div className="absolute -top-0.5 -right-0.5 text-teal-400 text-xs">✦</div>
              <span className="text-base">ℹ️</span>
              {t('impressum')}
            </Link>
          </div>
        </div>

        {/* Islamic Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -top-2 -left-2 w-16 h-16 bg-gradient-to-br from-teal-100/30 to-green-100/30 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-1 text-emerald-200/50 text-3xl transform -translate-y-1/2 -rotate-12 pointer-events-none">☪</div>
        <div className="absolute top-1/4 -right-1 text-teal-200/50 text-2xl transform rotate-12 pointer-events-none">✦</div>
      </div>

      {/* Cookie Consent Popup */}
      <CookieConsent language={language} />
    </div>
  );
}