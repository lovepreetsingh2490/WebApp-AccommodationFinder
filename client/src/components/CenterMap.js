import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

/**
 * Interactive Leaflet map. Markers show accommodation summaries and can be
 * linked to a centre's detail page. The map is created once and markers are
 * rebuilt only when the data changes.
 */
function CenterMap({ centers = [], selectedId, onSelect, single = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  const points = useMemo(
    () => centers.filter((center) => {
      const coordinates = center.location?.coordinates;
      return coordinates &&
        Number.isFinite(coordinates.lat) &&
        Number.isFinite(coordinates.lng);
    }),
    [centers]
  );

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      center: [51.5074, -0.1278],
      zoom: single ? 14 : 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    const resizeTimer = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(resizeTimer);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [single]);

  // Rebuild markers whenever the centres or selection change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    points.forEach((center) => {
      const { lat, lng } = center.location.coordinates;
      const isSelected = selectedId === center._id;

      const icon = L.divIcon({
        className: 'accommodation-map-marker',
        html: `<div style="
          background-color:${isSelected ? '#1d4ed8' : '#2563eb'};
          border:3px solid white;border-radius:50%;width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);color:white;font-size:16px;
          cursor:pointer;">&#8962;</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([lat, lng], { icon, title: center.name }).addTo(map);
      marker.bindPopup(`
        <div style="min-width:200px;">
          <h3 style="margin:0 0 4px;font-size:14px;font-weight:700;">${escapeHtml(center.name)}</h3>
          <p style="margin:0 0 4px;font-size:12px;color:#555;">
            <strong>&#163;${escapeHtml(center.pricePerWeek)}</strong>/week &middot; ${escapeHtml(center.type)}
          </p>
          <p style="margin:0 0 6px;font-size:12px;color:#555;">
            &#9733; ${escapeHtml(center.rating || 'N/A')} (${escapeHtml(center.reviewCount || 0)} reviews)
          </p>
          <a href="/center/${encodeURIComponent(center._id)}" data-center-link="${center._id}"
             style="color:#2563eb;font-size:12px;text-decoration:none;font-weight:600;">
            View Details &rarr;
          </a>
        </div>
      `);

      marker.on('click', () => {
        if (onSelect) onSelect(center._id);
      });

      markersRef.current.push(marker);
    });

    if (points.length === 1) {
      map.setView(
        [points[0].location.coordinates.lat, points[0].location.coordinates.lng],
        single ? 14 : 15
      );
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(
        points.map((center) => [center.location.coordinates.lat, center.location.coordinates.lng])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [points, selectedId, onSelect, single]);

  // Use React Router for popup links instead of a full page reload.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const handleClick = (event) => {
      const link = event.target.closest?.('[data-center-link]');
      if (link) {
        event.preventDefault();
        navigate(`/center/${link.dataset.centerLink}`);
      }
    };

    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [navigate]);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <FiMapPin className="w-4 h-4 text-primary-600" />
          Map View - {points.length} accommodation{points.length === 1 ? '' : 's'}
        </h3>
      </div>
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: '450px' }}
        role="region"
        aria-label="Map of accommodations"
      />
    </div>
  );
}

export default React.memo(CenterMap);
