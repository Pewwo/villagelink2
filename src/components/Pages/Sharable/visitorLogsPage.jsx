import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from '../../common/DatePicker';

const API_BASE = "https://villagelink.site/backend/api";

const VisitorLogsPage = () => {
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [archivedLogs, setArchivedLogs] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchVisitorLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/get_visitorLogs.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (mounted) {
          const formattedData = data.map(log => {
            const createdAt = new Date(log.created_at);
            return {
              id: log.id,
              lastName: log.last_name,
              firstName: log.first_name,
              middleName: log.middle_name,
              visitorName: [log.first_name, log.last_name].filter(Boolean).join(' '),
              contact: log.id_number,
              date: createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
              time: createdAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              purpose: log.purpose_of_visit,
              address: log.address || '',
              createdAt: createdAt, // Store the original Date object for calculations
            };
          });
          setVisitorLogs(formattedData);
          setFilteredData(formattedData);
          setError('');
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to fetch visitor logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVisitorLogs();
    return () => { mounted = false; };
  }, []);

  // Filter data based on search, purpose, time period, and specific date
  useEffect(() => {
    const filtered = visitorLogs.filter(item => {
      const searchLower = (searchTerm || '').toLowerCase();
      const fields = [item.visitorName, item.address, item.date, item.time, item.purpose, item.contact].filter(Boolean);
      const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));
      const matchesPurpose = purposeFilter === 'All' || item.purpose === purposeFilter;

      // Time period filter
      let matchesTimeFilter = true;
      if (timeFilter !== 'All') {
        const visitorDate = item.createdAt;
        const now = new Date();

        switch (timeFilter) {
          case 'Today':
            const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            matchesTimeFilter = item.date === today;
            break;
          case 'This Week':
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            startOfWeek.setHours(0, 0, 0, 0);
            matchesTimeFilter = visitorDate >= startOfWeek;
            break;
          case 'This Month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            matchesTimeFilter = visitorDate >= startOfMonth;
            break;
          case 'This Year':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            matchesTimeFilter = visitorDate >= startOfYear;
            break;
          default:
            matchesTimeFilter = true;
        }
      }

      // Specific date filter
      let matchesDateFilter = true;
      if (selectedDate) {
        const selectedDateStr = selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        matchesDateFilter = item.date === selectedDateStr;
      }

      return matchesSearch && matchesPurpose && matchesTimeFilter && matchesDateFilter;
    });
    setFilteredData(filtered);
  }, [searchTerm, purposeFilter, timeFilter, selectedDate, visitorLogs]);

  const openModal = (log) => {
    setSelectedLog(log);
  };

  const closeModal = () => {
    setSelectedLog(null);
    document.body.style.overflow = 'unset';
  };

  const handleScanId = () => {
    navigate('/SPlayout/idScan');
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const totalVisitors = visitorLogs.length;

  // Fixed today's visitors calculation - using same date format as visitor logs
  const todayVisitors = visitorLogs.filter(item => {
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    return item.date === today;
  }).length;

  const uniquePurposes = [...new Set(visitorLogs.map(item => item.purpose))];

  // Calculate monthly visitors
  const monthlyVisitors = visitorLogs.filter(item => {
    const visitorDate = new Date(item.date);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return visitorDate >= startOfMonth;
  }).length;

  // Calculate weekly visitors
  const weeklyVisitors = visitorLogs.filter(item => {
    const visitorDate = new Date(item.date);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    return visitorDate >= startOfWeek;
  }).length;

  // Calculate yearly visitors
  const yearlyVisitors = visitorLogs.filter(item => {
    const visitorDate = new Date(item.date);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return visitorDate >= startOfYear;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Visitor Logs Management
          </h1>
          <p className="text-gray-600 text-lg">Manage and track all visitor logs and entries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{totalVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{todayVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m6 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weekly Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-indigo-100">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Yearly Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{yearlyVisitors}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-1 mb-6">
          <label className="block text-xs font-medium text-gray-700/70 pl-3 pt-2 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-3 mx-4 lg:mx-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Purposes</option>
                {uniquePurposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Period</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specific Date</label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  dateFormat="MM/d/yyyy"
                  placeholderText="MM/D/YYYY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  isClearable
                  showPopperArrow={false}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2 sm:col-span-2 md:col-span-3">
              <button
                onClick={handleScanId}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-900 transition duration-300"
              >
                Scan ID
              </button>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition duration-300 ${
                  showArchived
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-b-amber-950"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-700 font-semibold text-lg">
            <p>Error: {error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="mx-auto h-16 w-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No visitor logs</h3>
            <p className="mb-6 text-sm text-gray-600">Get started by scanning a visitor's ID.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{item.visitorName}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 self-start sm:self-end">
                        {item.purpose}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mt-1">{item.date} • {item.time}</p>
                    </div>

                    <div className="border-t pt-3">
                      <button
                        onClick={() => openModal(item)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.visitorName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.date} • {item.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-600 hover:text-blue-900 hover:underline transition duration-200"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300 overflow-hidden"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] relative flex flex-col overflow-hidden transform transition-all duration-300 scale-100 mx-2"
            >
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 bg-white/95 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg transition-all duration-200 border border-gray-200"
                aria-label="Close modal"
              >
                &times;
              </button>

              <div className="overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
                <div className="flex flex-col lg:flex-row">
                    <div className="w-full lg:w-2/5 bg-gradient-to-br from-blue-200/10 to-blue-500/20 p-4 sm:p-6 flex flex-col items-center justify-center">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center mt-3 sm:mt-4">
                      {selectedLog.firstName} {selectedLog.lastName}
                    </h2>

                    <div className="mt-3 sm:mt-4 space-y-2 text-center">
                      <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <p>ID number: </p>
                        <span className="font-medium text-xs sm:text-sm">{selectedLog.contact}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">

                        <span className="text-xs font-bold">{selectedLog.address}</span>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 w-full">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Visited on</p>
                        <p className="text-sm font-semibold text-gray-700">{selectedLog.date}</p>
                        <p className="text-sm text-gray-600">{selectedLog.time}</p>
                      </div>
                      <div className="mt-2 text-center bg-blue-300/30 px-2 py-1 mx-16 rounded-full fixed-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-blue-800">
                          Purpose: {selectedLog.purpose}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-3/5 p-4 sm:p-6 bg-gray-50">
                    <div className="h-full flex flex-col">
                      <div className="mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Visitor Details
                        </h3>
                      </div>

                    <div className="flex-1 mb-4 sm:mb-6 overflow-y-auto">
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Name</h4>
                          <p className="text-gray-900">{selectedLog.lastName}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">First Name</h4>
                        <p className="text-gray-900">{selectedLog.firstName}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Middle Name</h4>
                          <p className="text-gray-900">{selectedLog.middleName}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
                          <p className="text-gray-900">{selectedLog.address}</p>
                        </div>
                       </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default VisitorLogsPage;
