'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Prayer {
  id: string;
  title: string;
  datetime: string;
  capacity: number;
  location: string;
  active: boolean;
  auto_activation: boolean;
  _count: {
    registrations: number;
  };
  registrationCount: number;
  totalPeople: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [prayerForm, setPrayerForm] = useState({
    title: '',
    datetime: '',
    capacity: 150,
    location: 'Main Prayer Hall'
  });

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchPrayers();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        fetchPrayers();
      } else {
        const error = await response.json();
        alert(error.error || 'Login failed');
      }
    } catch (error) {
      alert('Login error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchPrayers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/prayers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrayers(data);
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrayerActive = async (prayerId: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/prayers/${prayerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        fetchPrayers(); // Refresh list
      } else {
        alert('Failed to update prayer status');
      }
    } catch (error) {
      alert('Error updating prayer');
    }
  };

  const exportRegistrations = async (prayerId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/prayers/${prayerId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prayer_registrations_${prayerId}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export registrations');
      }
    } catch (error) {
      alert('Error exporting registrations');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  const handleAddPrayer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/prayers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...prayerForm,
          active: true,
          auto_activation: false
        }),
      });

      if (response.ok) {
        setPrayerForm({
          title: '',
          datetime: '',
          capacity: 150,
          location: 'Main Prayer Hall'
        });
        setShowAddForm(false);
        fetchPrayers();
      } else {
        alert('Failed to create prayer');
      }
    } catch (error) {
      alert('Error creating prayer');
    }
  };

  const handleEditPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrayer) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/prayers/${editingPrayer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(prayerForm),
      });

      if (response.ok) {
        setEditingPrayer(null);
        setPrayerForm({
          title: '',
          datetime: '',
          capacity: 150,
          location: 'Main Prayer Hall'
        });
        fetchPrayers();
      } else {
        alert('Failed to update prayer');
      }
    } catch (error) {
      alert('Error updating prayer');
    }
  };

  const handleDeletePrayer = async (prayerId: string) => {
    if (!confirm('Are you sure you want to delete this prayer? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/prayers/${prayerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPrayers();
      } else {
        alert('Failed to delete prayer');
      }
    } catch (error) {
      alert('Error deleting prayer');
    }
  };

  const startEdit = (prayer: Prayer) => {
    setEditingPrayer(prayer);
    setPrayerForm({
      title: prayer.title,
      datetime: prayer.datetime.substring(0, 16), // Format for datetime-local input
      capacity: prayer.capacity,
      location: prayer.location
    });
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600">Friday Prayer Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>


        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Prayer Management</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add New Prayer
            </button>
          </div>

          {prayers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">No prayers found.</div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {prayers.map((prayer) => (
                <div key={prayer.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{prayer.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          prayer.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {prayer.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div><strong>Date:</strong> {formatDateTime(prayer.datetime)}</div>
                    <div><strong>Capacity:</strong> {prayer.capacity}</div>
                    <div><strong>Registrations:</strong> {prayer.registrationCount}</div>
                    <div><strong>Total People:</strong> {prayer.totalPeople}</div>
                    <div><strong>Remaining:</strong> {prayer.capacity - prayer.totalPeople}</div>
                    <div><strong>Auto-activation:</strong> {prayer.auto_activation ? 'Yes' : 'No'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startEdit(prayer)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePrayer(prayer.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <button
                      onClick={() => togglePrayerActive(prayer.id, prayer.active)}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                        prayer.active
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {prayer.active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => exportRegistrations(prayer.id)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                    >
                      Export CSV ({prayer.registrationCount})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Prayer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Prayer</h3>
            <form onSubmit={handleAddPrayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={prayerForm.title}
                  onChange={(e) => setPrayerForm({...prayerForm, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={prayerForm.datetime}
                  onChange={(e) => setPrayerForm({...prayerForm, datetime: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={prayerForm.capacity}
                  onChange={(e) => setPrayerForm({...prayerForm, capacity: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={prayerForm.location}
                  onChange={(e) => setPrayerForm({...prayerForm, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold"
                >
                  Create Prayer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prayer Modal */}
      {editingPrayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Prayer</h3>
            <form onSubmit={handleEditPrayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={prayerForm.title}
                  onChange={(e) => setPrayerForm({...prayerForm, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={prayerForm.datetime}
                  onChange={(e) => setPrayerForm({...prayerForm, datetime: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={prayerForm.capacity}
                  onChange={(e) => setPrayerForm({...prayerForm, capacity: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={prayerForm.location}
                  onChange={(e) => setPrayerForm({...prayerForm, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPrayer(null);
                    setPrayerForm({
                      title: '',
                      datetime: '',
                      capacity: 150,
                      location: 'Main Prayer Hall'
                    });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold"
                >
                  Update Prayer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}