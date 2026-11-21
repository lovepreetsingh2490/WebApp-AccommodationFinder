import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiSearch, FiUser, FiLogOut } from 'react-icons/fi';
import { clearSession, getStoredUser, getToken } from '../utils/api';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  // Re-read auth state whenever the route changes (e.g. after login/logout).
  const location = useLocation();
  const token = getToken();
  const isAdmin = getStoredUser()?.role === 'admin';

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearSession();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl" role="img" aria-label="Home">
              <FiHome className="w-7 h-7 text-primary-600" />
            </span>
            <span className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              Accommodation<span className="text-primary-600">Finder</span>
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/search"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Search
            </Link>
            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                  aria-label="Log out"
                >
                  <FiLogOut className="w-4 h-4 mr-1 inline" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  <FiUser className="w-4 h-4 mr-1 inline" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
            >
              Home
            </Link>
            <Link
              to="/search"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
            >
              <FiSearch className="w-4 h-4 inline mr-2" />
              Search
            </Link>
            {token ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                >
                  <FiLogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;