import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiStar, FiWifi, FiDollarSign } from 'react-icons/fi';

function CenterCard({ center, onSave, isSaved }) {
  const defaultImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600';
  const image = center.images && center.images.length > 0 ? center.images[0] : defaultImage;

  const rating = center.rating || 0;
  const reviews = center.reviewCount || 0;

  const renderStars = (r) => {
    return (
      <div className="flex items-center gap-1" aria-label={`Rating: ${r} out of 5`}>
        <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
        <span className="text-sm font-semibold">{r.toFixed(1)}</span>
        <span className="text-sm text-gray-500">({reviews})</span>
      </div>
    );
  };

  const typeColors = {
    'University Hall': 'bg-blue-100 text-blue-800',
    'Private Hostel': 'bg-purple-100 text-purple-800',
    'Shared Apartment': 'bg-green-100 text-green-800',
    'Studio': 'bg-orange-100 text-orange-800',
    'Homestay': 'bg-pink-100 text-pink-800',
  };

  return (
    <article className="card group" aria-label={`Accommodation: ${center.name}`}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={center.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`badge ${typeColors[center.type] || 'bg-gray-100 text-gray-800'}`}>
            {center.type}
          </span>
        </div>
        {onSave && (
          <button
            onClick={() => onSave(center._id)}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
              isSaved
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save accommodation'}
          >
            <svg
              className="w-5 h-5"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          </button>
        )}
        {!center.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
              Currently Full
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {center.name}
          </h3>
        </div>

        <p className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <FiMapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{center.location?.address}, {center.location?.city}</span>
        </p>

        {renderStars(rating)}

        <p className="text-sm text-gray-600 mt-3 line-clamp-2 mb-4">
          {center.description}
        </p>

        {/* Amenities */}
        {center.amenities && center.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {center.amenities.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600"
              >
                {a === 'WiFi' && <FiWifi className="w-3 h-3" />}
                {a}
              </span>
            ))}
            {center.amenities.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                +{center.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1">
              <FiDollarSign className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{center.pricePerWeek}</span>
              <span className="text-sm text-gray-500">/week</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {center.policies?.billsIncluded ? 'Bills included' : 'Bills extra'}
            </p>
          </div>
          <Link
            to={`/center/${center._id}`}
            className="btn-primary text-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default CenterCard;