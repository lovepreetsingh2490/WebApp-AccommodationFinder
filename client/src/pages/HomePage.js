import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiMapPin, FiHome, FiGlobe, FiShield, FiAward,
  FiArrowRight, FiChevronDown, FiChevronUp, FiStar, FiDollarSign,
  FiCheckCircle, FiHeadphones, FiFileText, FiUsers, FiMap,
} from 'react-icons/fi';

function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    cities: 0,
    countries: 0,
    averageRating: 0,
    verified: 0,
  });

  useEffect(() => {
    fetch('/api/centers/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {
        // The static layout still renders if the API is temporarily unavailable.
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    navigate(`/search?${params.toString()}`);
  };

  const faqs = [
    {
      question: 'What is AccommodationFinder?',
      answer: 'AccommodationFinder is a platform designed specifically for overseas students to find, compare, and book safe and affordable student accommodation. We partner with verified accommodation providers worldwide to bring you the best options.',
    },
    {
      question: 'How do I book an accommodation?',
      answer: 'Simply search for accommodations in your destination city, filter by your preferences (budget, amenities, location), and contact the provider directly through our platform to arrange a booking. Some accommodations allow online booking while others require direct contact.',
    },
    {
      question: 'Is the accommodation verified?',
      answer: 'Yes! All accommodation centers on our platform are verified. We check that listings are legitimate, the facilities match descriptions, and the pricing is transparent. Look for the "Verified" badge on listings.',
    },
    {
      question: 'What should I look for as an international student?',
      answer: 'Consider proximity to your university, public transport access, included bills, available amenities (WiFi, kitchen, laundry), minimum stay requirements, and visa/guarantor policies. Our filters help you find exactly what you need.',
    },
    {
      question: 'Can I save accommodations to compare later?',
      answer: 'Yes! Create an account to save your favorite accommodations, set your preferences, and keep track of the options you are considering. Your saved list will be available in your personal dashboard.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Your Perfect <span className="text-yellow-300">Student Home</span> Awaits
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Find verified, affordable accommodation for overseas students. Search,
              compare, and book your ideal student housing worldwide — all in one place.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search city, university, or keyword..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-primary-600 text-base"
                  aria-label="Search accommodations"
                />
              </div>
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-4 rounded-xl font-bold text-base transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-primary-600"
              >
                <FiSearch className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">Search</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-3 mt-6">
              <span className="text-primary-200 text-sm">Popular:</span>
              {['London', 'Manchester', 'Edinburgh', 'Birmingham'].map(city => (
                <button
                  key={city}
                  onClick={() => navigate(`/search?city=${encodeURIComponent(city)}`)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-primary-100 hover:text-white transition-all"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: FiHome, value: stats.total || '—', label: 'Accommodations' },
              { icon: FiGlobe, value: stats.cities || '—', label: 'Cities' },
              { icon: FiShield, value: stats.verified || '—', label: 'Verified Homes' },
              { icon: FiStar, value: stats.averageRating ? `${stats.averageRating}/5` : '—', label: 'Average Rating' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-sm text-gray-500 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AccommodationFinder?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to find the perfect student home, all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FiShield,
                title: 'Verified & Safe',
                description: 'Every accommodation is verified and vetted. Book with confidence knowing you are getting what you expect.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: FiMap,
                title: 'Smart Filtering',
                description: 'Filter by price, location, amenities, and more. Find exactly what you need in seconds.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: FiDollarSign,
                title: 'Budget-Friendly',
                description: 'Compare prices across providers to find the best deals. No hidden fees or commissions.',
                color: 'bg-yellow-50 text-yellow-600',
              },
              {
                icon: FiMapPin,
                title: 'Interactive Maps',
                description: 'See accommodations on interactive maps. Check proximity to your campus and transport links.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: FiCheckCircle,
                title: 'Student-Focused',
                description: 'Built specifically for international students. We understand what matters to you.',
                color: 'bg-pink-50 text-pink-600',
              },
              {
                icon: FiHeadphones,
                title: '24/7 Support',
                description: 'Our dedicated team is available around the clock to help with your accommodation needs.',
                color: 'bg-indigo-50 text-indigo-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">Find your perfect student home in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gray-200" />

            {[
              { step: '01', title: 'Search', desc: 'Enter your destination city, budget, and preferences to find matching accommodations.', icon: FiSearch },
              { step: '02', title: 'Compare', desc: 'Compare accommodations side by side. Check amenities, prices, ratings, and more.', icon: FiMap },
              { step: '03', title: 'Book', desc: 'Contact your preferred accommodation directly to arrange your booking.', icon: FiCheckCircle },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 mx-auto bg-primary-600 text-white rounded-full flex items-center justify-center mb-5 shadow-lg">
                  <item.icon className="w-8 h-8" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-gray-900 font-bold text-sm px-3 py-1 rounded-full">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-lg">Everything you need to know before you book.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={expandedFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {expandedFaq === i ? (
                    <FiChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div
                    id={`faq-answer-${i}`}
                    className="px-5 pb-5 text-sm text-gray-600 leading-relaxed"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your New Home?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of students who have found their perfect accommodation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <FiSearch className="w-5 h-5" />
              Browse Accommodations
            </Link>
            <Link
              to="/register"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-all inline-flex items-center gap-2"
            >
              Create Free Account
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;