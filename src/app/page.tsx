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

  // Debug all prayers first
  console.log('=== PRAYER DEBUG INFO ===');
  console.log('Total prayers loaded:', prayers.length);
  console.log('All prayers data:', prayers);

  // Check each prayer individually
  prayers.forEach((prayer, index) => {
    console.log(`Prayer ${index + 1}:`, {
      id: prayer.id,
      title: prayer.title,
      status: prayer.status,
      active: prayer.active,
      datetime: prayer.datetime,
      capacity: prayer.capacity
    });
  });

  // Try different filtering approaches
  const activePrayers = prayers.filter(p => p.active === true);
  const openPrayers = prayers.filter(p => p.status === 'open');
  const activeAndOpenPrayers = prayers.filter(p => p.active === true && p.status === 'open');

  console.log('Active prayers:', activePrayers.length, activePrayers);
  console.log('Open prayers:', openPrayers.length, openPrayers);
  console.log('Active AND open prayers:', activeAndOpenPrayers.length, activeAndOpenPrayers);

  // Get the next open prayer (try less strict first)
  const nextPrayer = prayers.find(p => p.active === true) || prayers.find(p => p.status === 'open');
  const isRegistered = nextPrayer ? localStorage.getItem(`fridayReg:${nextPrayer.id}`) !== null : false;

  console.log('Selected next prayer:', nextPrayer);
  console.log('Is registered:', isRegistered);
  console.log('========================');

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
      console.log('🔄 Fetching prayers from API...');
      const response = await fetch('/api/prayers');
      console.log('📡 API Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Raw API data:', data);

        const processedPrayers = data.map((prayer: any) => ({
          ...prayer,
          datetime: new Date(prayer.datetime)
        }));

        console.log('✅ Processed prayers:', processedPrayers);
        setPrayers(processedPrayers);
      } else {
        console.error('❌ API response not ok:', response.status);
      }
    } catch (error) {
      console.error('💥 Failed to fetch prayers:', error);
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

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid Date';
      }
      return dateObj.toLocaleDateString('de-DE', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Error formatting date';
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid Time';
      }
      return dateObj.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error, date);
      return 'Error formatting time';
    }
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Islamic Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-emerald-300 rounded-full transform rotate-45"></div>
          <div className="absolute bottom-20 right-32 w-40 h-40 border-4 border-green-300 rounded-full transform -rotate-12"></div>
        </div>

        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-emerald-100/50 text-center">
          {/* Islamic Decorative Border */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>

          {/* Simple Icon */}
          <div className="mb-6">
            <div className="text-6xl">🕌</div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent mb-4">{t('friday_prayer')}</h1>

          <div className="flex items-center justify-center mb-4">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent flex-1"></div>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent flex-1"></div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <p className="text-orange-700 font-medium">{t('no_upcoming_prayers')}</p>
        
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Enhanced Decorative Background */}
      <div className="absolute inset-0">
        {/* Animated floating elements */}
        <div className="absolute top-20 left-16 w-24 h-24 bg-gradient-to-r from-emerald-200/30 to-teal-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-24 w-32 h-32 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-24 left-20 w-28 h-28 bg-gradient-to-r from-indigo-200/25 to-blue-200/25 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 right-28 w-36 h-36 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-bounce delay-500"></div>

        {/* Islamic geometric patterns */}
        <div className="absolute top-12 left-12 w-16 h-16 border-2 border-emerald-300/40 rounded-full transform rotate-45 animate-spin"></div>
        <div className="absolute top-44 right-16 w-20 h-20 border-2 border-purple-300/40 rounded-full transform rotate-12 animate-ping"></div>
        <div className="absolute bottom-16 left-40 w-24 h-24 border-2 border-teal-300/40 rounded-full transform -rotate-12 animate-pulse"></div>
      </div>

      <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-emerald-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-200/50 p-8 max-w-md w-full overflow-hidden">
        {/* Enhanced Decorative Borders */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 via-purple-400 to-pink-400"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-purple-400 via-teal-400 to-emerald-400"></div>

        {/* Side decorative elements */}
        <div className="absolute left-0 top-1/4 w-1 h-16 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r"></div>
        <div className="absolute right-0 top-1/2 w-1 h-20 bg-gradient-to-b from-purple-400 to-pink-400 rounded-l"></div>
        {/* Islamic Decorative Border */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>

        {/* Header */}
        <div className="text-center mb-8 mx-4">
          {/* Simple Mosque Icon */}
          <div className="mb-6">
            <div className="text-6xl mb-4 filter drop-shadow-lg">🕌</div>
          </div>

          {/* Enhanced Prayer Title */}
          <div className="relative mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4 filter drop-shadow-lg">{t('friday_prayer')}</h1>

            {/* Fancy Divider */}
           
          </div>

          {/* Date and Time Display */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-purple-200/50 mb-6 mx-4">
            <div className="text-center">
              <div className="text-slate-700 font-semibold mb-2 text-lg">
                {nextPrayer?.datetime ? formatDate(nextPrayer.datetime) : 'No date available'}
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-teal-700 bg-clip-text text-transparent">
                {nextPrayer?.datetime ? formatTime(nextPrayer.datetime) : 'No time available'}
              </div>
            
            </div>
          </div>
        </div>

        {nextPrayer.remaining && nextPrayer.remaining < 20 && (
          <div className="text-center mb-8 mx-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">{t('available_seats')}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {nextPrayer.remaining}
              </div>
            </div>
          </div>
        )}

        {isRegistered ? (
          <div className="text-center mx-4">
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 border border-green-200 shadow-lg mb-6">
              <div className="text-5xl mb-3">✅</div>
              <div className="text-green-700 font-bold text-xl mb-2">{t('you_are_registered')}</div>
              <div className="text-green-600 text-sm">Registration Confirmed</div>
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 text-lg shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl">📱</span>
                {t('view_qr_code')}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 mx-4">
            {/* People Counter */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center">
                
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setPeople(Math.max(1, people - 1))}
                    disabled={people <= 1}
                    className="w-12 h-12 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl font-bold text-xl transition-colors"
                  >
                    -
                  </button>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-4 py-3 shadow-md">
                    <div className="text-3xl font-bold w-12 text-center">{people}</div>
                  </div>
                  <button
                    onClick={() => setPeople(Math.min(5, Math.min(people + 1, nextPrayer.remaining || 0)))}
                    disabled={people >= 5 || people >= (nextPrayer.remaining || 0)}
                    className="w-12 h-12 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
               
              </div>
               <div className="text-gray-700 text-sm font-medium mb-4">{t('people')}</div>
            </div>

            {/* Register Button */}
            {(() => {
              const debugInfo = {
                isRegistering,
                hasNextPrayer: !!nextPrayer,
                status: nextPrayer?.status,
                active: nextPrayer?.active,
                remaining: nextPrayer?.remaining,
                people,
                remainingCheck: (nextPrayer?.remaining || 0) < people
              };
              console.log('🔘 Button disabled check:', debugInfo);

              const isDisabled = isRegistering || !nextPrayer || nextPrayer.status !== 'open' || !nextPrayer.active || (nextPrayer?.remaining || 0) < people;
              console.log('🔘 Button is disabled:', isDisabled);

              // Temporary override for testing - REMOVE THIS LATER
              const forceEnabled = !!nextPrayer && !isRegistering;
              console.log('🔧 Force enabled for testing:', forceEnabled);

              return (
                <button
                  onClick={handleRegister}
                  disabled={!forceEnabled}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 text-white font-bold py-5 px-6 rounded-xl transition-all transform hover:scale-105 text-xl shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                {isRegistering ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    {t('registering')}
                  </>
                ) : nextPrayer?.active === false ? (
                  <>
                    <span className="text-xl">🚫</span>
                    Prayer Disabled
                  </>
                ) : (
                  <>
                    <span className="text-xl">📝</span>
                    {t('register_now')}
                  </>
                )}
              </span>
            </button>
            );
            })()}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 space-y-4 mx-4">
          {/* Language Selector */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-3 shadow-sm border border-gray-200">
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setLanguage(newLang);
                  setUserLanguage(newLang);
                  console.log('User changed language to:', newLang);
                }}
                className="text-sm bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer"
              >
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇸🇦 العربية</option>
              </select>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-3">
            <a
              href="https://facebook.com/dmkbs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 border border-blue-200 shadow-sm"
            >
              <span className="text-base">📘</span>
              {t('facebook')}
            </a>
            <Link
              href="/impressum"
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 border border-gray-200 shadow-sm"
            >
              <span className="text-base">ℹ️</span>
              {t('impressum')}
            </Link>
          </div>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-indigo-100/20 to-purple-100/20 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-purple-100/20 to-teal-100/20 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* Cookie Consent Popup */}
      <CookieConsent language={language} />
    </div>
  );
}