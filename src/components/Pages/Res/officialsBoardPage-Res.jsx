import React, { useState, useEffect } from 'react';
import { FaUsers, FaPhone, FaUserCircle } from 'react-icons/fa';

const BASE_URL = 'https://villagelink.site/backend/api/officials';

const OfficialBoardPage = () => {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch officials data from API
  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://villagelink.site/backend/api/officials/get_officials.php');
        if (!response.ok) {
          throw new Error('Failed to fetch officials data');
        }
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error('Failed to parse JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
        // Transform API data to match component expectations
        const transformedData = data.map(official => ({
          ...official,
          avatar: official.avatar, // API now returns full URL
          address: 'Barangay Office' // Default address since API doesn't provide it
        }));
        setOfficials(transformedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching officials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficials();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading officials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
            <span className="text-5xl text-blue-600"><FaUsers /></span>
          </div>
          <h1 className="text-5xl font-bold text-blue-950 mb-4">
            Board Of Directory Officials
          </h1>
          <p className="text-gray-700 text-md max-w-xl mx-auto">
            Meet our dedicated team of officials committed to serving our community with excellence and integrity.
          </p>
        </div>

        {/* Officials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-8">
          {officials.map(({ id, name, role, avatar, contact }, index) => (
            <div
              key={id}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-200"
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Card Content */}
              <div className="relative p-6 flex flex-col items-center text-center">
                {/* Avatar with Ring */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full blur-xl opacity-10 group-hover:opacity-50 transition-opacity duration-300"></div>
                {avatar && avatar !== 'null' && avatar !== '' ? (
                  <img
                    src={avatar.startsWith('http') ? avatar : `${BASE_URL}${avatar}`}
                    alt={name}
                    className="relative w-24 h-24 rounded-full object-cover border-1 border-white shadow-lg"
                  />
                ) : (
                  <FaUserCircle className="relative w-24 h-24 rounded-full text-slate-200 bg-gray-300 shadow-lg" />
                )}
                </div>

                {/* Name and Role */}
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-950 transition-colors duration-300">
                  {name || '\u00A0' /* non-breaking space for empty name */}
                </h3>
                <p className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-4">
                  {role}
                </p>

                {/* Contact */}
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                  <FaPhone className="text-blue-600" />
                  {contact || '\u00A0'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OfficialBoardPage;
