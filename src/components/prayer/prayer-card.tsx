'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrayerWithRegistrations } from '@/types';

interface PrayerCardProps {
  prayer: PrayerWithRegistrations;
  onRegister: (prayerId: string, people: number) => Promise<void>;
  isRegistered?: boolean;
}

// Simple date formatting without intl
const formatDateTime = (date: Date) => {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function PrayerCard({ prayer, onRegister, isRegistered }: PrayerCardProps) {
  const [people, setPeople] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await onRegister(prayer.id, people);
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusBadge = () => {
    switch (prayer.status) {
      case 'open':
        return <Badge variant="success">Open</Badge>;
      case 'full':
        return <Badge variant="destructive">Full</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
    }
  };

  const canRegister = prayer.status === 'open' && !isRegistered && (prayer.remaining || 0) >= people;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{prayer.title}</CardTitle>
          {getStatusBadge()}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>{formatDateTime(prayer.datetime)}</div>
          {prayer.location && <div>Location: {prayer.location}</div>}
          <div>{prayer.remaining || 0} seats remaining</div>
          <div>Capacity: {prayer.capacity}</div>
        </div>
      </CardHeader>

      <CardContent>
        {isRegistered ? (
          <div className="text-sm text-green-600 font-medium">
            You are registered for this prayer
          </div>
        ) : prayer.status === 'closed' ? (
          <div className="text-sm text-muted-foreground">
            Registration opens Saturday at midnight
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeople(Math.max(1, people - 1))}
                disabled={people <= 1}
              >
                −
              </Button>
              <span className="w-12 text-center font-medium">{people}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeople(Math.min(5, people + 1))}
                disabled={people >= 5 || people >= (prayer.remaining || 0)}
              >
                +
              </Button>
            </div>

            <Button
              onClick={handleRegister}
              disabled={!canRegister || isRegistering}
              className="flex-1"
            >
              {isRegistering ? 'Registering...' : 'Register'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}