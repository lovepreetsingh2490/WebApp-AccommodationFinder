import React from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiHome } from 'react-icons/fi';

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <p className="text-6xl font-extrabold text-primary-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist or may have moved. Try searching for accommodation instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-secondary">
            <FiHome className="w-4 h-4 mr-2 inline" />
            Go home
          </Link>
          <Link to="/search" className="btn-primary">
            <FiSearch className="w-4 h-4 mr-2 inline" />
            Search accommodations
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
