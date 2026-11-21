import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiMapPin, FiStar, FiPhone, FiMail, FiGlobe, FiDollarSign,
  FiCheckCircle, FiXCircle, FiLoader, FiHeart, FiChevronLeft,
  FiUsers, FiCalendar, FiShield, FiTruck, FiAward, FiX, FiSend, FiCopy,
} from 'react-icons/fi';
import AmenityList from '../components/AmenityList';
import CenterMap from '../components/CenterMap';
import {
  apiFetch, getSavedIds, getStoredUser, getToken,
  toggleSavedCenter, syncSavedFromServer,
} from '../utils/api';

function CenterDetailPage() {
  const { id } = useParams();
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionMessage, setActionMessage] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [enquiryPurpose, setEnquiryPurpose] = useState('booking');
  const [enquiry, setEnquiry] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await apiFetch(`/centers/${id}`);
        if (!mounted) return;
        setCenter(data);

        let saved = getSavedIds();
        if (getToken()) {
          await syncSavedFromServer();
          saved = getSavedIds();
        }
        if (mounted) setIsSaved(saved.includes(id));
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  const handleSave = async () => {
    try {
      const result = await toggleSavedCenter(id);
      setIsSaved(result.isSaved);
    } catch (err) {
      setActionMessage(err.message);
    }
  };

  const openContact = (purpose) => {
    const user = getStoredUser();
    setEnquiryPurpose(purpose);
    setEnquiry({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      message: purpose === 'waitlist'
        ? `Hello, I would like to join the waitlist for ${center.name}. Please let me know when a room becomes available.`
        : `Hello, I am an international student interested in ${center.name}. Please let me know about availability and the next steps.`,
    });
    setActionMessage('');
    setCopied(false);
    setContactOpen(true);
  };

  useEffect(() => {
    if (!contactOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') setContactOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [contactOpen]);

  const submitEnquiry = async (event) => {
    event.preventDefault();
    setSending(true);
    setActionMessage('');

    try {
      await apiFetch('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          ...enquiry,
          center: center._id,
          centerName: center.name,
          purpose: enquiryPurpose,
        }),
      });
      setContactOpen(false);
      setActionMessage(
        enquiryPurpose === 'waitlist'
          ? 'Waitlist request sent. The provider will be in touch.'
          : 'Enquiry sent. The provider will be in touch.'
      );
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setSending(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(center.contact?.email || '');
      setCopied(true);
    } catch {
      setActionMessage('Could not copy the email address. You can select it manually.');
    }
  };

  const mapCenters = useMemo(() => (center ? [center] : []), [center]);

  const websiteHost = (() => {
    try {
      return new URL(center?.contact?.website || '').hostname;
    } catch {
      return center?.contact?.website || '';
    }
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiLoader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading accommodation details...</p>
        </div>
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Accommodation Not Found</h2>
        <p className="text-gray-600 mb-8">{error || 'This accommodation could not be found.'}</p>
        <Link to="/search" className="btn-primary">
          Back to Search
        </Link>
      </div>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200';
  const image = center.images && center.images.length > 0 ? center.images[0] : defaultImage;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium text-sm mb-4"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to results
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge-info px-3 py-1 rounded-full text-sm font-medium">
                {center.type}
              </span>
              {center.available ? (
                <span className="badge-success px-3 py-1 rounded-full text-sm font-medium">
                  Available
                </span>
              ) : (
                <span className="badge bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Currently Full
                </span>
              )}
              {center.verified && (
                <span className="badge-info px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <FiShield className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {center.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FiMapPin className="w-4 h-4" />
                {center.location.address}, {center.location.city}, {center.location.country}
              </span>
              <span className="flex items-center gap-1">
                <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-semibold text-gray-900">{center.rating || 'N/A'}</span>
                <span>({center.reviewCount || 0} reviews)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                isSaved
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
              aria-label={isSaved ? 'Remove from saved' : 'Save accommodation'}
            >
              <FiHeart
                className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
              />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            <div className="rounded-xl overflow-hidden shadow-card">
              <img
                src={image}
                alt={center.name}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'rooms', label: 'Room Types & Pricing' },
                { id: 'facilities', label: 'Facilities & Amenities' },
                { id: 'policies', label: 'Policies' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-3">About This Accommodation</h2>
                    <p className="text-gray-600 leading-relaxed">
                      {center.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: FiDollarSign, label: 'From', value: `£${center.pricePerWeek}/wk` },
                      { icon: FiUsers, label: 'Max Occupancy', value: center.maxOccupancy },
                      { icon: FiCalendar, label: 'Min Stay', value: `${center.minimumStayWeeks} weeks` },
                      { icon: FiMapPin, label: 'To Campus', value: `${center.distanceToCampus} km` },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                        <item.icon className="w-5 h-5 text-primary-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                        <p className="font-semibold text-gray-900 text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {center.transportOptions && center.transportOptions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Transport Options</h3>
                      <ul className="space-y-1">
                        {center.transportOptions.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-primary-600 mt-0.5">&bull;</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rooms' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Room Types & Pricing</h2>
                  <div className="space-y-4">
                    {(center.roomTypes || []).map((room, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{room.name}</h3>
                          <p className="text-sm text-gray-500">
                            {room.available > 0
                              ? `${room.available} available`
                              : 'Currently full'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-gray-900">£{room.price}</span>
                          <span className="text-sm text-gray-500">/week</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'facilities' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Facilities & Amenities</h2>
                  <AmenityList amenities={center.amenities} />
                  {center.facilities && center.facilities.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Additional Facilities</h3>
                      <ul className="space-y-2">
                        {center.facilities.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'policies' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Policies</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Visa Proof Accepted', value: center.policies?.acceptsVisaProof, icon: FiAward },
                      { label: 'Guarantor Accepted', value: center.policies?.acceptsGuarantor, icon: FiShield },
                      { label: 'Students Only', value: center.policies?.studentOnly, icon: FiUsers },
                      { label: 'Bills Included', value: center.policies?.billsIncluded, icon: FiDollarSign },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="flex items-center gap-2 text-sm text-gray-700">
                          <item.icon className="w-4 h-4 text-primary-600" />
                          {item.label}
                        </span>
                        {item.value ? (
                          <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Yes" />
                        ) : (
                          <FiXCircle className="w-5 h-5 text-gray-300" aria-label="No" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-card p-6 lg:sticky lg:top-20">
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    £{center.pricePerWeek}
                  </span>
                  <span className="text-gray-500">/week</span>
                </div>
                <p className="text-sm text-gray-500">
                  {center.policies?.billsIncluded ? 'All bills included' : 'Bills extra'}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Room types available</span>
                  <span className="font-semibold text-gray-900">
                    {(center.roomTypes || []).filter(r => r.available > 0).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Minimum stay</span>
                  <span className="font-semibold text-gray-900">{center.minimumStayWeeks} weeks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available from</span>
                  <span className="font-semibold text-green-600">
                    {center.available ? 'Now' : 'Waitlist'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => openContact(center.available ? 'booking' : 'waitlist')}
                className="btn-primary w-full py-3 text-base mb-3"
              >
                {center.available ? 'Contact to Book' : 'Join Waitlist'}
              </button>

              {actionMessage && (
                <p className={`mb-3 text-sm text-center ${
                  actionMessage.toLowerCase().includes('sent') ? 'text-green-600' : 'text-red-600'
                }`} role="status">
                  {actionMessage}
                </p>
              )}

              <p className="text-xs text-gray-400 text-center">
                No booking fees. Direct contact with provider.
              </p>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Contact Provider</h3>
              <div className="space-y-3">
                {center.contact?.phone && (
                  <a
                    href={`tel:${center.contact.phone}`}
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <span className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiPhone className="w-4 h-4 text-primary-600" />
                    </span>
                    <span>{center.contact.phone}</span>
                  </a>
                )}
                {center.contact?.email && (
                  <a
                    href={`mailto:${center.contact.email}`}
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <span className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiMail className="w-4 h-4 text-primary-600" />
                    </span>
                    <span>{center.contact.email}</span>
                  </a>
                )}
                {websiteHost && (
                  <a
                    href={center.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <span className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiGlobe className="w-4 h-4 text-primary-600" />
                    </span>
                    <span className="underline">{websiteHost}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 mb-3">Location</h3>
              <p className="text-sm text-gray-600 mb-3">
                <FiMapPin className="w-4 h-4 inline mr-1" />
                {center.location?.address}<br />
                {center.location?.city}, {center.location?.postalCode}<br />
                {center.location?.country}
              </p>
              {center.distanceToCampus && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600">
                    {center.distanceToCampus} km from campus
                  </span>
                </div>
              )}
              <CenterMap centers={mapCenters} single />
            </div>
          </aside>
        </div>
      </div>

      {/* Enquiry modal - a working alternative to relying on an email client */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setContactOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 id="enquiry-title" className="text-xl font-bold text-gray-900">
                  {enquiryPurpose === 'waitlist' ? 'Join the waitlist' : 'Enquire about this home'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{center.name}</p>
              </div>
              <button
                onClick={() => setContactOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close enquiry form"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitEnquiry} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="enquiry-name" className="form-label">Your name</label>
                  <input
                    id="enquiry-name"
                    required
                    value={enquiry.name}
                    onChange={e => setEnquiry({ ...enquiry, name: e.target.value })}
                    className="form-input"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="enquiry-email" className="form-label">Your email</label>
                  <input
                    id="enquiry-email"
                    type="email"
                    required
                    value={enquiry.email}
                    onChange={e => setEnquiry({ ...enquiry, email: e.target.value })}
                    className="form-input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="enquiry-phone" className="form-label">Phone (optional)</label>
                <input
                  id="enquiry-phone"
                  type="tel"
                  value={enquiry.phone}
                  onChange={e => setEnquiry({ ...enquiry, phone: e.target.value })}
                  className="form-input"
                  placeholder="+44 ..."
                />
              </div>

              <div>
                <label htmlFor="enquiry-message" className="form-label">Message</label>
                <textarea
                  id="enquiry-message"
                  required
                  rows={4}
                  maxLength={2000}
                  value={enquiry.message}
                  onChange={e => setEnquiry({ ...enquiry, message: e.target.value })}
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={sending} className="btn-primary w-full py-3">
                <FiSend className="w-4 h-4 mr-2 inline" />
                {sending ? 'Sending...' : 'Send enquiry'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                {getToken()
                  ? 'You can track this enquiry and its status in "My Enquiries" on your dashboard.'
                  : 'Tip: log in before sending so this enquiry appears in your dashboard and you can track its status.'}
              </p>

              {center.contact?.email && (
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={`mailto:${center.contact.email}`}
                    className="text-sm text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
                  >
                    <FiMail className="w-4 h-4" />
                    Open in email app instead
                  </a>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="text-sm text-gray-600 hover:text-primary-600 inline-flex items-center gap-1"
                  >
                    <FiCopy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy email'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CenterDetailPage;