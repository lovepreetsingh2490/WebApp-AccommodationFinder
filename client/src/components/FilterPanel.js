import React, { useState, useEffect } from 'react';
import { FiSliders, FiX, FiDollarSign, FiMapPin, FiGrid, FiHeart } from 'react-icons/fi';

const AMENITIES = [
  'WiFi', 'Laundry', 'Kitchen', 'Furnished', 'Study Area',
  'Gym', 'Common Room', 'Security', 'Parking', 'Garden',
  'Bicycle Storage', 'Cafeteria', 'Cleaning Service', 'Air Conditioning',
];

function FilterPanel({ onFilterChange, onReset, initialFilters }) {
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

  const [filters, setFilters] = useState(() => ({ ...defaultFilters, ...(initialFilters || {}) }));
  const [isOpen, setIsOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [types, setTypes] = useState([]);
  const [amenityOptions, setAmenityOptions] = useState(AMENITIES);

  useEffect(() => {
    // Fetch filter options from the custom Express route
    fetch('/api/centers/filters/options')
      .then(res => res.json())
      .then(data => {
        setCities(data.cities || []);
        setTypes(data.types || []);
        if (Array.isArray(data.amenities) && data.amenities.length > 0) {
          setAmenityOptions(data.amenities);
        }
      })
      .catch(console.error);
  }, []);

  // Keep the panel in sync when filters are applied from outside (e.g. preferences)
  useEffect(() => {
    if (initialFilters) {
      setFilters(previous => ({ ...previous, ...initialFilters }));
    }
  }, [initialFilters]);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAmenityToggle = (amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    handleChange('amenities', newAmenities);
  };

  const handleReset = () => {
    setFilters({ ...defaultFilters });
    onReset();
  };

  return (
    <div className="lg:w-72 lg:flex-shrink-0">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden btn-secondary w-full mb-4 flex items-center justify-center gap-2"
        aria-expanded={isOpen}
        aria-controls="filter-panel"
      >
        <FiSliders className="w-5 h-5" />
        Filters
        {filters.amenities.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-bold">
            {filters.amenities.length}
          </span>
        )}
      </button>

      <div
        id="filter-panel"
        className={`${isOpen ? 'block' : 'hidden'} lg:block bg-white rounded-xl shadow-card p-6 space-y-6 lg:sticky lg:top-20`}
        aria-label="Filter options"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FiSliders className="w-5 h-5 text-primary-600" />
            Filters
          </h2>
          <button
            onClick={handleReset}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
            aria-label="Close filters"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city-filter" className="form-label flex items-center gap-1.5">
            <FiMapPin className="w-4 h-4 text-primary-600" />
            City / Location
          </label>
          <select
            id="city-filter"
            value={filters.city}
            onChange={e => handleChange('city', e.target.value)}
            className="form-input"
            aria-describedby="city-hint"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type-filter" className="form-label flex items-center gap-1.5">
            <FiGrid className="w-4 h-4 text-primary-600" />
            Accommodation Type
          </label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={e => handleChange('type', e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <span className="form-label flex items-center gap-1.5">
            <FiDollarSign className="w-4 h-4 text-primary-600" />
            Price Range (per week)
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="min-price" className="sr-only">Minimum price</label>
              <input
                type="number"
                id="min-price"
                placeholder="Min"
                value={filters.minPrice}
                onChange={e => handleChange('minPrice', e.target.value)}
                className="form-input"
                min="0"
                aria-label="Minimum price per week"
              />
            </div>
            <span className="text-gray-400">–</span>
            <div className="flex-1">
              <label htmlFor="max-price" className="sr-only">Maximum price</label>
              <input
                type="number"
                id="max-price"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={e => handleChange('maxPrice', e.target.value)}
                className="form-input"
                min="0"
                aria-label="Maximum price per week"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <span className="form-label flex items-center gap-1.5">
            <FiHeart className="w-4 h-4 text-primary-600" />
            Required Amenities
          </span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Amenity filters">
            {amenityOptions.map(amenity => (
              <label
                key={amenity}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                  {amenity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label htmlFor="available-filter" className="form-label">Availability</label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              id="available-filter"
              type="checkbox"
              checked={filters.available}
              onChange={e => handleChange('available', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700">Only show available</span>
          </label>
        </div>

        {/* Distance to campus */}
        <div>
          <label htmlFor="distance-filter" className="form-label">
            Max distance to campus (km)
          </label>
          <input
            id="distance-filter"
            type="number"
            min="0"
            step="0.5"
            placeholder="Any distance"
            value={filters.maxDistance}
            onChange={e => handleChange('maxDistance', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Minimum rating */}
        <div>
          <label htmlFor="rating-filter" className="form-label">Minimum rating</label>
          <select
            id="rating-filter"
            value={filters.minRating}
            onChange={e => handleChange('minRating', e.target.value)}
            className="form-input"
          >
            <option value="">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="sort-filter" className="form-label">Sort By</label>
          <div className="flex gap-2">
            <select
              id="sort-filter"
              value={filters.sortBy}
              onChange={e => handleChange('sortBy', e.target.value)}
              className="form-input flex-1"
            >
              <option value="pricePerWeek">Price</option>
              <option value="rating">Rating</option>
              <option value="distanceToCampus">Distance</option>
              <option value="createdAt">Newest</option>
            </select>
            <select
              value={filters.order}
              onChange={e => handleChange('order', e.target.value)}
              className="form-input w-20"
              aria-label="Sort order"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;