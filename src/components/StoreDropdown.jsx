'use client';

import { useState, useEffect, useRef } from 'react';

export default function StoreDropdown({
  selectedStoreId,
  onStoreSelect,
  placeholder = "Select a store",
  disabled = false,
  className = "",
  showCityFilter = true,
  apiEndpoint = "/api/canvasser/incentive-form/stores"
}) {
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [filteredStores, setFilteredStores] = useState([]);
  const dropdownRef = useRef(null);

  // Load stores on component mount
  useEffect(() => {
    loadStores();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter stores based on search term and selected city
  useEffect(() => {
    let filtered = stores;

    if (selectedCity) {
      filtered = filtered.filter(store => 
        store.city && store.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.city && store.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredStores(filtered);
  }, [stores, searchTerm, selectedCity]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }

      const data = await response.json();
      setStores(data.stores || []);
      setCities(data.cities || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store) => {
    onStoreSelect(store);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getSelectedStoreDisplay = () => {
    if (!selectedStoreId) return '';
    
    const store = stores.find(s => s.id === selectedStoreId);
    if (!store) return selectedStoreId;
    
    return `${store.name}${store.city ? ` - ${store.city}` : ''}`;
  };

  const toggleDropdown = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        setSelectedCity('');
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input */}
      <div
        className={`
          flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-white border transition-colors cursor-pointer
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onClick={toggleDropdown}
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 text-xs">
          🏬
        </span>
        
        <div className="flex-1 text-left">
          {loading ? (
            <span className="text-gray-500">Loading stores...</span>
          ) : selectedStoreId ? (
            <span className="text-gray-900">{getSelectedStoreDisplay()}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>

        <button
          type="button"
          className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search and Filter Header */}
          <div className="p-3 border-b border-gray-200 space-y-2">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* City Filter */}
            {showCityFilter && cities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            )}
          </div>

          {/* Store List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => handleStoreSelect(store)}
                  className={`
                    w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors
                    ${selectedStoreId === store.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{store.name}</div>
                      {store.city && (
                        <div className="text-xs text-gray-500">{store.city}</div>
                      )}
                    </div>
                    {store.numberOfCanvasser && (
                      <div className="text-xs text-gray-400">
                        {store.numberOfCanvasser} Canvasser{store.numberOfCanvasser > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm || selectedCity ? 'No stores match your search' : 'No stores available'}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {filteredStores.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
              {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      )}
    </div>
  );
}