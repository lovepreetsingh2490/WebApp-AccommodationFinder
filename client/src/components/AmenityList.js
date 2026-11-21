import React from 'react';
import { FiWifi, FiRefreshCw, FiHome, FiBook, FiActivity, FiUsers, FiShield, FiNavigation, FiWind, FiCoffee, FiSun, FiLayers, FiAward, FiTruck } from 'react-icons/fi';

const AMENITY_ICONS = {
  'WiFi': FiWifi,
  'Laundry': FiRefreshCw,
  'Kitchen': FiHome,
  'Furnished': FiLayers,
  'Study Area': FiBook,
  'Gym': FiActivity,
  'Common Room': FiUsers,
  'Security': FiShield,
  'Parking': FiNavigation,
  'Garden': FiSun,
  'Bicycle Storage': FiTruck,
  'Cafeteria': FiCoffee,
  'Cleaning Service': FiAward,
  'Air Conditioning': FiWind,
};

function AmenityBadge({ name }) {
  const Icon = AMENITY_ICONS[name] || FiHome;

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-primary-50 rounded-lg text-sm text-gray-700 transition-colors">
      <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />
      {name}
    </span>
  );
}

function AmenityList({ amenities = [] }) {
  if (!amenities || amenities.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No amenities listed
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((name, i) => (
        <AmenityBadge key={i} name={name} />
      ))}
    </div>
  );
}

export default AmenityList;