import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser, FiHeart, FiSettings, FiHome, FiLogOut, FiLoader, FiSearch,
  FiTrash2, FiCheckCircle, FiMapPin, FiStar, FiSave, FiMail, FiSend,
  FiRefreshCw, FiClock,
} from 'react-icons/fi';
import {
  apiFetch, clearSession, getSavedIds, getToken, getStoredUser,
  setSession, syncSavedFromServer, toggleSavedCenter,
} from '../utils/api';

const AMENITIES = [
  'WiFi', 'Laundry', 'Kitchen', 'Furnished', 'Study Area', 'Gym',
  'Common Room', 'Security', 'Parking', 'Garden', 'Cafeteria', 'Air Conditioning',
];

const TYPES = [
  'University Hall', 'Private Hostel', 'Shared Apartment', 'Studio', 'Homestay',
];

const ENQUIRY_STATUS = {
  new: { label: 'Awaiting review', badge: 'bg-blue-100 text-blue-800', note: 'Your enquiry has been sent and is waiting to be reviewed.' },
  contacted: { label: 'Provider contacted you', badge: 'bg-green-100 text-green-800', note: 'The accommodation provider has responded to your enquiry.' },
  closed: { label: 'Completed', badge: 'bg-gray-100 text-gray-700', note: 'This enquiry has been completed.' },
};

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [savedCenters, setSavedCenters] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('saved');
  const [message, setMessage] = useState('');
  const [cities, setCities] = useState([]);
  const [preferences, setPreferences] = useState({
    budget: '',
    preferredCities: [],
    requiredAmenities: [],
    preferredType: '',
    maxDistanceToCampus: 10,
  });
  const [name, setName] = useState('');

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const [account, options, myEnquiries] = await Promise.all([
          apiFetch('/users/me'),
          apiFetch('/centers/filters/options'),
          // If this endpoint fails the rest of the dashboard still loads.
          apiFetch('/enquiries/mine').catch(() => []),
        ]);

        if (!mounted) return;
        setUser(account);
        setEnquiries(myEnquiries || []);
        setName(account.name || '');
        if (account.preferences) {
          setPreferences({
            budget: account.preferences.budget || '',
            preferredCities: account.preferences.preferredCities || [],
            requiredAmenities: account.preferences.requiredAmenities || [],
            preferredType: account.preferences.preferredType || '',
            maxDistanceToCampus: account.preferences.maxDistanceToCampus ?? 10,
          });
        }
        setCities(options.cities || []);

        // The server keeps the authoritative shortlist for signed-in users.
        await syncSavedFromServer();
        const centers = await apiFetch('/users/saved');
        if (mounted) setSavedCenters(centers);
      } catch (err) {
        if (err.status === 401) {
          clearSession();
          navigate('/login');
        } else {
          setMessage(err.message);
          // Fall back to the local shortlist if the API is unavailable.
          const localIds = getSavedIds();
          const results = await Promise.all(
            localIds.map(id => apiFetch(`/centers/${id}`).catch(() => null))
          );
          if (mounted) setSavedCenters(results.filter(Boolean));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [navigate]);

  const refreshEnquiries = async () => {
    try {
      setEnquiries(await apiFetch('/enquiries/mine'));
      setMessage('Enquiry statuses are up to date.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleRemoveSaved = async (id) => {
    try {
      const { ids } = await toggleSavedCenter(id);
      setSavedCenters(previous => previous.filter(center => center._id !== id));
      if (!ids.includes(id)) {
        setMessage('Accommodation removed from your saved list.');
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const togglePreferenceValue = (field, value) => {
    setPreferences(previous => ({
      ...previous,
      [field]: previous[field].includes(value)
        ? previous[field].filter(item => item !== value)
        : [...previous[field], value],
    }));
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const updated = await apiFetch('/users/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          ...preferences,
          budget: Number(preferences.budget) || 0,
          maxDistanceToCampus: Number(preferences.maxDistanceToCampus) || 0,
        }),
      });
      setUser(updated);
      setMessage('Preferences saved. You can now apply them from the search page.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const saveName = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const updated = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      setUser(updated);
      setSession({ ...updated, token: localStorage.getItem('token') });
      setMessage('Your profile has been updated.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!user) return null;

  const tabs = [
    { id: 'saved', label: 'Saved Accommodations', icon: FiHeart, count: savedCenters.length },
    { id: 'enquiries', label: 'My Enquiries', icon: FiMail, count: enquiries.length },
    { id: 'preferences', label: 'My Preferences', icon: FiSettings },
    { id: 'profile', label: 'Profile Settings', icon: FiUser },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white">
              <FiUser className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-gray-600 text-sm mt-1">Your student housing dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm" role="status">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-card p-2">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setMessage(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${
                    tab === t.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <t.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      tab === t.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-all mt-1"
              >
                <FiLogOut className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {tab === 'saved' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Saved Accommodations ({savedCenters.length})
                  </h2>
                  <Link to="/search" className="btn-primary text-sm">
                    <FiSearch className="w-4 h-4 mr-1 inline" />
                    Find More
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
                  </div>
                ) : savedCenters.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiHeart className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No saved accommodations yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Save accommodations you like to compare them here.
                    </p>
                    <Link to="/search" className="btn-primary">Browse Accommodations</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedCenters.map(center => (
                      <div key={center._id} className="card">
                        <div className="relative h-40 overflow-hidden bg-gray-100">
                          <img
                            src={center.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}
                            alt={center.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <button
                            onClick={() => handleRemoveSaved(center._id)}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                            aria-label="Remove from saved"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                          <span className="absolute top-3 left-3 badge-info px-2.5 py-1 rounded-full text-xs font-medium">
                            {center.type}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{center.name}</h3>
                          <p className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                            <FiMapPin className="w-3.5 h-3.5" />
                            {center.location?.city}, {center.location?.country}
                          </p>
                          <div className="flex items-center gap-1 text-sm mb-3">
                            <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold">{center.rating || 'N/A'}</span>
                            <span className="text-gray-400">({center.reviewCount || 0})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold">£{center.pricePerWeek}</span>
                              <span className="text-sm text-gray-500">/wk</span>
                            </div>
                            <Link
                              to={`/center/${center._id}`}
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              View &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'enquiries' && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      My Enquiries ({enquiries.length})
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Booking and waitlist requests you have sent. Status updates from the
                      provider appear here.
                    </p>
                  </div>
                  <button onClick={refreshEnquiries} className="btn-secondary text-sm">
                    <FiRefreshCw className="w-4 h-4 mr-1 inline" />
                    Refresh status
                  </button>
                </div>

                {enquiries.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiSend className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No enquiries yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Use "Contact to Book" on any accommodation to send an enquiry. It
                      will appear here with its current status.
                    </p>
                    <Link to="/search" className="btn-primary">Browse Accommodations</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enquiries.map(enquiry => {
                      const status = ENQUIRY_STATUS[enquiry.status] || ENQUIRY_STATUS.new;
                      return (
                        <div key={enquiry._id} className="bg-white rounded-xl shadow-card p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900">
                                {enquiry.centerName || enquiry.center?.name || 'Accommodation enquiry'}
                              </h3>
                              <p className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1">
                                  {enquiry.purpose === 'waitlist'
                                    ? <FiClock className="w-3.5 h-3.5" />
                                    : <FiSend className="w-3.5 h-3.5" />}
                                  {enquiry.purpose === 'waitlist' ? 'Waitlist request' : 'Booking enquiry'}
                                </span>
                                <span>&middot;</span>
                                <span>Sent {new Date(enquiry.createdAt).toLocaleString()}</span>
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
                              {status.label}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                            {enquiry.message}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-gray-500">{status.note}</p>
                            {enquiry.center?._id && (
                              <Link
                                to={`/center/${enquiry.center._id}`}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                              >
                                View accommodation &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'preferences' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">My Preferences</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Tell us what you need and apply your preferences with one click on the search page.
                </p>

                <form onSubmit={savePreferences} className="bg-white rounded-xl shadow-card p-6 max-w-2xl space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pref-budget" className="form-label">Maximum weekly budget (£)</label>
                      <input
                        id="pref-budget"
                        type="number"
                        min="0"
                        value={preferences.budget}
                        onChange={e => setPreferences({ ...preferences, budget: e.target.value })}
                        className="form-input"
                        placeholder="e.g. 200"
                      />
                    </div>
                    <div>
                      <label htmlFor="pref-distance" className="form-label">Max distance to campus (km)</label>
                      <input
                        id="pref-distance"
                        type="number"
                        min="0"
                        step="0.5"
                        value={preferences.maxDistanceToCampus}
                        onChange={e => setPreferences({ ...preferences, maxDistanceToCampus: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pref-type" className="form-label">Preferred accommodation type</label>
                    <select
                      id="pref-type"
                      value={preferences.preferredType}
                      onChange={e => setPreferences({ ...preferences, preferredType: e.target.value })}
                      className="form-input"
                    >
                      <option value="">No preference</option>
                      {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>

                  <div>
                    <span className="form-label">Preferred cities</span>
                    <div className="flex flex-wrap gap-2">
                      {(cities.length > 0 ? cities : ['London', 'Manchester', 'Edinburgh', 'Birmingham']).map(city => (
                        <label key={city} className="cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={preferences.preferredCities.includes(city)}
                            onChange={() => togglePreferenceValue('preferredCities', city)}
                          />
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            preferences.preferredCities.includes(city)
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                          }`}>
                            {preferences.preferredCities.includes(city) && <FiCheckCircle className="w-3.5 h-3.5 mr-1" />}
                            {city}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="form-label">Required amenities</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AMENITIES.map(amenity => (
                        <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={preferences.requiredAmenities.includes(amenity)}
                            onChange={() => togglePreferenceValue('requiredAmenities', amenity)}
                          />
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    <FiSave className="w-4 h-4 mr-2 inline" />
                    Save Preferences
                  </button>
                </form>
              </div>
            )}

            {tab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>

                <div className="bg-white rounded-xl shadow-card p-6 max-w-lg">
                  <form onSubmit={saveName} className="space-y-5">
                    <div>
                      <label htmlFor="profile-name" className="form-label">Full Name</label>
                      <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-email" className="form-label">Email Address</label>
                      <input
                        id="profile-email"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="form-input bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="form-label">Account Type</label>
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                        <FiCheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700 capitalize">{user.role || 'student'}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                      <button type="submit" className="btn-primary text-sm">Save Changes</button>
                      <Link to="/search" className="btn-secondary text-sm">
                        <FiHome className="w-4 h-4 mr-1 inline" />
                        Explore Accommodations
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
