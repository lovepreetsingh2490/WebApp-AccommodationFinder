import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiHeart } from 'react-icons/fi';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FiHome className="w-7 h-7 text-primary-400" />
              <span className="text-xl font-bold">Accommodation<span className="text-primary-400">Finder</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              The leading platform helping overseas students find the perfect accommodation.
              Search, compare, and book student housing worldwide with confidence.
            </p>
           
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/search" className="text-gray-400 hover:text-white transition-colors">Search Accommodations</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="text-gray-400 hover:text-white transition-colors">Search Tips</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Create an Account</Link></li>
              <li><Link to="/#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><a href="mailto:support@accommodationfinder.example" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 AccommodationFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;