'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-white/20 overflow-hidden">
        {/* Header with enhanced mosque icon */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="text-7xl mb-2 drop-shadow-lg">🕌</div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">{t('friday_prayer')}</h1>
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-4 shadow-inner">
            <div className="text-gray-700 font-medium mb-1">
              {formatDate(nextPrayer.datetime)}
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm mb-6">
              <div className="text-6xl mb-3">✅</div>
              <div className="text-green-700 font-bold text-xl">{t('you_are_registered')}</div>
              <div className="text-green-600 text-sm mt-2">Registration confirmed</div>
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 text-lg shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-3">
                <span className="text-xl">📱</span>
                {t('view_qr_code')}
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
          {/* Language Selector */}
          <div className="flex justify-center">
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value as Language;
                setLanguage(newLang);
                setUserLanguage(newLang);
                console.log('User changed language to:', newLang);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-600 hover:text-blue-800 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 border border-blue-200 shadow-sm"
            >
              <span className="text-base">📘</span>
              {t('facebook')}
            </a>
            <Link
              href="/impressum"
              className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 border border-gray-200 shadow-sm"
            >
              <span className="text-base">ℹ️</span>
              {t('impressum')}
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -top-2 -left-2 w-16 h-16 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* Cookie Consent Popup */}
      <CookieConsent language={language} />
    </div>
  );
}