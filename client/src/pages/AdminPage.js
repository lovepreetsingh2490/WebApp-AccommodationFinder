import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield, FiHome, FiMail, FiEdit2, FiTrash2, FiPlus,
  FiSave, FiLoader, FiCheckCircle, FiX,
} from 'react-icons/fi';
import { apiFetch, getToken } from '../utils/api';

const emptyForm = {
  name: '',
  description: '',
  type: 'Private Hostel',
  address: '',
  city: '',
  country: 'United Kingdom',
  pricePerWeek: '',
  distanceToCampus: '',
  minimumStayWeeks: 26,
  amenities: [],
  available: true,
  verified: true,
  contactEmail: '',
  contactPhone: '',
};

const AMENITIES = [
  'WiFi', 'Laundry', 'Kitchen', 'Furnished', 'Study Area', 'Gym',
  'Common Room', 'Security', 'Parking', 'Garden', 'Bicycle Storage',
  'Cafeteria', 'Cleaning Service', 'Air Conditioning',
];

const TYPES = [
  'University Hall', 'Private Hostel', 'Shared Apartment', 'Studio', 'Homestay',
];

function AdminPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('centers');
  const [centers, setCenters] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const [centerData, enquiryData] = await Promise.all([
      apiFetch('/centers?limit=100&sortBy=createdAt&order=desc'),
      apiFetch('/enquiries'),
    ]);
    setCenters(centerData.centers || []);
    setEnquiries(enquiryData || []);
  };

  useEffect(() => {
    if (!getToken()) {
      setError('Please log in as an admin to use this page.');
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const account = await apiFetch('/users/me');
        if (!mounted) return;

        if (account.role !== 'admin') {
          setError('Admin access required. Your account does not have permission.');
          setLoading(false);
          return;
        }

        setUser(account);
        await loadData();
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const toggleAmenity = (amenity) => {
    setForm(previous => ({
      ...previous,
      amenities: previous.amenities.includes(amenity)
        ? previous.amenities.filter(item => item !== amenity)
        : [...previous.amenities, amenity],
    }));
  };

  const startEdit = (center) => {
    setEditingId(center._id);
    setForm({
      name: center.name || '',
      description: center.description || '',
      type: center.type || 'Private Hostel',
      address: center.location?.address || '',
      city: center.location?.city || '',
      country: center.location?.country || 'United Kingdom',
      pricePerWeek: center.pricePerWeek || '',
      distanceToCampus: center.distanceToCampus || '',
      minimumStayWeeks: center.minimumStayWeeks || 26,
      amenities: center.amenities || [],
      available: Boolean(center.available),
      verified: Boolean(center.verified),
      contactEmail: center.contact?.email || '',
      contactPhone: center.contact?.phone || '',
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitCenter = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      location: {
        address: form.address,
        city: form.city,
        country: form.country,
      },
      pricePerWeek: Number(form.pricePerWeek),
      distanceToCampus: Number(form.distanceToCampus) || 0,
      minimumStayWeeks: Number(form.minimumStayWeeks) || 26,
      amenities: form.amenities,
      available: form.available,
      verified: form.verified,
      contact: {
        email: form.contactEmail,
        phone: form.contactPhone,
      },
    };

    try {
      if (editingId) {
        await apiFetch(`/centers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMessage('Accommodation updated.');
      } else {
        await apiFetch('/centers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Accommodation created.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCenter = async (center) => {
    if (!window.confirm(`Delete "${center.name}"? This cannot be undone.`)) return;

    try {
      await apiFetch(`/centers/${center._id}`, { method: 'DELETE' });
      if (editingId === center._id) resetForm();
      setMessage('Accommodation deleted.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (enquiryId, status) => {
    try {
      await apiFetch(`/enquiries/${enquiryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setEnquiries(previous => previous.map(item =>
        item._id === enquiryId ? { ...item, status } : item
      ));
      setMessage('Enquiry status updated.');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <FiShield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Access denied</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/login" className="btn-primary">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="w-6 h-6 text-primary-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage accommodation listings and student enquiries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(message || error) && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${message ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`} role="status">
            {message || error}
          </div>
        )}

        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {[
            { id: 'centers', label: `Accommodations (${centers.length})` },
            { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setMessage(''); setError(''); }}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                tab === item.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'centers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create / edit form */}
            <form onSubmit={submitCenter} className="lg:col-span-1 bg-white rounded-xl shadow-card p-6 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {editingId ? <FiEdit2 className="w-5 h-5 text-primary-600" /> : <FiPlus className="w-5 h-5 text-primary-600" />}
                  {editingId ? 'Edit accommodation' : 'New accommodation'}
                </h2>
                {editingId && (
                  <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-800" aria-label="Cancel edit">
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="admin-name" className="form-label">Name</label>
                <input id="admin-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" />
              </div>

              <div>
                <label htmlFor="admin-type" className="form-label">Type</label>
                <select id="admin-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="form-input">
                  {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="admin-address" className="form-label">Address</label>
                <input id="admin-address" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="form-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-city" className="form-label">City</label>
                  <input id="admin-city" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label htmlFor="admin-country" className="form-label">Country</label>
                  <input id="admin-country" required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-price" className="form-label">Price / week (£)</label>
                  <input id="admin-price" type="number" min="0" required value={form.pricePerWeek} onChange={e => setForm({ ...form, pricePerWeek: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label htmlFor="admin-distance" className="form-label">km to campus</label>
                  <input id="admin-distance" type="number" min="0" step="0.1" value={form.distanceToCampus} onChange={e => setForm({ ...form, distanceToCampus: e.target.value })} className="form-input" />
                </div>
              </div>

              <div>
                <label htmlFor="admin-description" className="form-label">Description</label>
                <textarea id="admin-description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-input" />
              </div>

              <div>
                <span className="form-label">Amenities</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {AMENITIES.map(amenity => (
                    <label key={amenity} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-3.5 h-3.5 text-primary-600 rounded"
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="admin-email" className="form-label">Contact email</label>
                  <input id="admin-email" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label htmlFor="admin-phone" className="form-label">Contact phone</label>
                  <input id="admin-phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="form-input" />
                </div>
              </div>

              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                  Available
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                  Verified
                </label>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
                <FiSave className="w-4 h-4 mr-2 inline" />
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create accommodation'}
              </button>
            </form>

            {/* List */}
            <div className="lg:col-span-2 space-y-3">
              {centers.map(center => (
                <div key={center._id} className="bg-white rounded-xl shadow-card p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{center.name}</h3>
                      <span className="badge bg-gray-100 text-gray-700">{center.type}</span>
                      {!center.available && <span className="badge bg-red-100 text-red-700">Full</span>}
                    </div>
                    <p className="text-sm text-gray-500">
                      {center.location?.city} &middot; £{center.pricePerWeek}/wk &middot; {center.amenities?.length || 0} amenities
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(center)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50" aria-label={`Edit ${center.name}`}>
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCenter(center)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" aria-label={`Delete ${center.name}`}>
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'enquiries' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              Status changes made here appear immediately in the student's dashboard under
              "My Enquiries" the next time they open it or press Refresh status.
            </p>
            {enquiries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center text-gray-600">
                No enquiries yet. They appear here when students use “Contact to Book”.
              </div>
            ) : enquiries.map(enquiry => (
              <div key={enquiry._id} className="bg-white rounded-xl shadow-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{enquiry.centerName || enquiry.center?.name || 'Accommodation'}</h3>
                    <p className="text-sm text-gray-500">
                      {enquiry.purpose === 'waitlist' ? 'Waitlist request' : 'Booking enquiry'} &middot;{' '}
                      {new Date(enquiry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge ${
                    enquiry.status === 'new' ? 'bg-blue-100 text-blue-800'
                      : enquiry.status === 'contacted' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {enquiry.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
                  <span>{enquiry.name}</span>
                  <a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                    <FiMail className="w-4 h-4" /> {enquiry.email}
                  </a>
                  {enquiry.phone && <span>{enquiry.phone}</span>}
                </div>

                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">{enquiry.message}</p>

                <div className="flex flex-wrap gap-2">
                  {['new', 'contacted', 'closed'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(enquiry._id, status)}
                      disabled={enquiry.status === status}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        enquiry.status === status
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-primary-400'
                      }`}
                    >
                      {status === 'new' && <FiCheckCircle className="w-3 h-3 mr-1 inline" />}
                      Mark {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
