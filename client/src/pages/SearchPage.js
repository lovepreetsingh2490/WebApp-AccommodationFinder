import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiMap, FiList, FiLoader, FiStar } from 'react-icons/fi';
import FilterPanel from '../components/FilterPanel';
import CenterCard from '../components/CenterCard';
import CenterMap from '../components/CenterMap';
import { apiFetch, getSavedIds, syncSavedFromServer, toggleSavedCenter, getToken } from '../utils/api';

const defaultFilters = {
  city: '',
  type: '',
  minPrice: '',
  maxPrice: '',
  amenities: [],
  available: true,
  maxDistance: '',
  minRating: '',
  sortBy: 'pricePerWeek',
  order: 'asc',
};

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [selectedId, setSelectedId] = useState(null);
  const [savedIds, setSavedIds] = useState(getSavedIds());
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    city: searchParams.get('city') || '',
    type: searchParams.get('type') || '',
  }));

  const searchQuery = searchParams.get('search') || '';

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', pagination.page);
    params.set('limit', '9');

    if (searchQuery) params.set('search', searchQuery);
    if (filters.city) params.set('city', filters.city);
    if (filters.type) params.set('type', filters.type);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
    if (filters.maxDistance) params.set('maxDistance', filters.maxDistance);
    if (filters.minRating) params.set('minRating', filters.minRating);
    params.set('available', filters.available);
    params.set('sortBy', filters.sortBy);
    params.set('order', filters.order);

    try {
      const data = await apiFetch(`/centers?${params.toString()}`);
      setCenters(data.centers || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, searchQuery]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  useEffect(() => {
    syncSavedFromServer().then(setSavedIds);
  }, []);

  // React to the homepage search bar / popular city links changing the URL.
  useEffect(() => {
    setFilters(previous => ({
      ...previous,
      city: searchParams.get('city') || '',
      type: searchParams.get('type') || '',
    }));
    setPagination(previous => ({ ...previous, page: 1 }));
  }, [searchParams]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(previous => ({ ...previous, page: 1 }));
    setNotice('');
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ ...defaultFilters });
    setPagination(previous => ({ ...previous, page: 1 }));
    setNotice('');
  }, []);

  const applyPreferences = async () => {
    if (!getToken()) {
      setNotice('Log in to use your saved preferences.');
      return;
    }

    try {
      const user = await apiFetch('/users/me');
      const preferences = user.preferences || {};
      setFilters({
        ...defaultFilters,
        city: preferences.preferredCities?.[0] || '',
        type: preferences.preferredType || '',
        maxPrice: preferences.budget ? String(preferences.budget) : '',
        amenities: preferences.requiredAmenities || [],
        maxDistance: preferences.maxDistanceToCampus
          ? String(preferences.maxDistanceToCampus)
          : '',
        sortBy: 'pricePerWeek',
        order: 'asc',
      });
      setPagination(previous => ({ ...previous, page: 1 }));
      setNotice('Your saved preferences have been applied.');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleSave = async (id) => {
    try {
      const { ids } = await toggleSavedCenter(id);
      setSavedIds(ids);
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handlePageChange = (page) => {
    setPagination(previous => ({ ...previous, page }));
  };

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Student Home
          </h1>
          <p className="text-gray-600">
            Browse verified accommodations tailored for overseas students.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notice && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} aria-label="Dismiss message">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0" aria-label="Search filters">
            <FilterPanel
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              initialFilters={filters}
            />
            <button
              onClick={applyPreferences}
              className="mt-4 w-full btn-secondary text-sm flex items-center justify-center gap-2"
            >
              <FiStar className="w-4 h-4" />
              Use My Preferences
            </button>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-gray-700 font-medium">
                  {pagination.total} {pagination.total === 1 ? 'result' : 'results'}
                  {filters.city && (
                    <span className="text-gray-500 font-normal"> in {filters.city}</span>
                  )}
                </span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    “{searchQuery}”
                    <button
                      onClick={() => setSearchParams({})}
                      aria-label="Clear search term"
                      className="hover:bg-primary-100 rounded-full p-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.city && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    {filters.city}
                    <button
                      onClick={() => handleFilterChange({ ...filters, city: '' })}
                      aria-label="Remove city filter"
                      className="hover:bg-primary-100 rounded-full p-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex bg-white rounded-lg shadow-card p-1 gap-1" role="group" aria-label="View options">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-md transition-all ${
                    view === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                >
                  <FiList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`p-2 rounded-md transition-all ${
                    view === 'map'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Map view"
                  aria-pressed={view === 'map'}
                >
                  <FiMap className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <FiLoader className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                <p className="text-gray-600">Finding accommodations...</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <button onClick={fetchCenters} className="btn-secondary text-red-600">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && centers.length === 0 && (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No accommodations found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or searching in a different location.
                </p>
                <button onClick={handleReset} className="btn-primary">
                  Clear All Filters
                </button>
              </div>
            )}

            {!loading && view === 'map' && centers.length > 0 && (
              <CenterMap
                centers={centers}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            )}

            {!loading && view === 'grid' && centers.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {centers.map(center => (
                    <CenterCard
                      key={center._id}
                      center={center}
                      onSave={handleSave}
                      isSaved={savedIds.includes(center._id)}
                    />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
