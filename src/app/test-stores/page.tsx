'use client';

import { useState, useEffect } from 'react';

export default function TestStoresPage() {
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/canvasser/incentive-form/stores');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setStores(data.stores || []);
        setCities(data.cities || []);
      } catch (err) {
        setError(err.message);
        console.error('Error loading stores:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Store Data Test</h1>
          
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Total Stores</h3>
              <p className="text-3xl font-bold text-blue-600">{stores.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Cities</h3>
              <p className="text-3xl font-bold text-green-600">{cities.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">Avg SECs/Store</h3>
              <p className="text-3xl font-bold text-purple-600">
                {stores.length > 0 ? 
                  (stores.reduce((sum, store) => sum + (store.numberOfCanvasser || 1), 0) / stores.length).toFixed(1) 
                  : '0'
                }
              </p>
            </div>
          </div>

          {/* Cities List */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cities ({cities.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {cities.map((city, index) => (
                <div key={index} className="bg-gray-100 px-3 py-2 rounded text-sm text-gray-700">
                  {city}
                </div>
              ))}
            </div>
          </div>

          {/* Stores Table */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Stores ({stores.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SECs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map((store, index) => (
                    <tr key={store.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {store.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {store.city || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {store.numberOfCanvasser || 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {store.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}