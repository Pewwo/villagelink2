import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../common/Avatar';
import DatePicker from '../../common/DatePicker';

const API_BASE = "https://villagelink.site/backend/api";
const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const FeedBackDetailsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchFeedbackData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/get_feedback.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (jsonErr) {
          console.error('Failed to parse JSON:', jsonErr, 'Response text:', text);
          throw new Error('Invalid JSON response from server');
        }

        if (result.success && Array.isArray(result.data)) {
          if (mounted) {
            const transformedData = result.data.map(item => ({
              ...item,
              profile_picture: item.profile_picture
                ? (item.profile_picture.startsWith('http') ? item.profile_picture : BACKEND_BASE_URL + item.profile_picture)
                : '',
            }));
            setFeedbackData(transformedData);
            setFilteredData(transformedData);
            setError('');
          }
        } else {
          throw new Error(result.message || 'Failed to fetch feedback data');
        }
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        if (mounted) {
          setError(err.message || 'Error');
          setFeedbackData([]);
          setFilteredData([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchFeedbackData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const filtered = feedbackData.filter(item => {
      const searchLower = (searchTerm || '').toLowerCase();
      const fields = [item.resident_name, item.feedback_context, item.submitted_at].filter(Boolean);
      const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));
      const matchesStar = starFilter ? item.rating === Number(starFilter) : true;
      const matchesRating = ratingFilter ? item.rating === Number(ratingFilter) : true;

      let matchesDate = true;
      if (selectedDate) {
        const itemDate = new Date(item.submitted_at);
        const selectedDateStr = selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const itemDateStr = itemDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        matchesDate = itemDateStr === selectedDateStr;
      }

      return matchesSearch && matchesStar && matchesRating && matchesDate;
    });
    setFilteredData(filtered);
  }, [searchTerm, starFilter, ratingFilter, selectedDate, feedbackData]);

  const openModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading feedbacks...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error loading feedbacks: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-2 px-4 rounded-3xl mb-4 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Feedback Details
          </h1>
          <p className="text-gray-600 text-lg">
            Detailed view of user feedback with filtering options
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3 mx-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Ratings</label>
              <select
                id="status"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Ratings</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date</label>
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                placeholder="Filter by date..."
                className="w-full"
                isClearable
                showPopperArrow={false}
              />
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3" style={{ minHeight: '600px' }}>
          {filteredData.map((item, index) => {
            const { resident_name, submitted_at, feedback_context, rating } = item;
            return (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col min-h-[135px] max-h-[160px]">
                <div className="flex justify-between items-center text-md text-black mb-2">
                  <div className="flex items-center space-x-2">
                    <Avatar fullName={resident_name} profilePic={item.profile_picture} size={40} />
                    <span className="font-bold">{resident_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="mr-1 font-semibold text-black">{rating ?? '0'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-2 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                    </svg>
                    <span>{new Date(submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                {feedback_context.length <= 150 && (
                  <div className="p-1 mt-1 whitespace-pre-wrap text-ellipsis overflow-clip text-md text-gray-700">
                    {feedback_context}
                  </div>
                )}
                {feedback_context.length > 150 && (
                  <div className="flex flex-col justify-between flex-1">
                    <div className="p-1 mt-1 mb-3 overflow-hidden max-h-[3.5rem] whitespace-pre-wrap text-ellipsis overflow-clip">
                      {feedback_context}
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-400 text-sm self-end"
                      onClick={() => openModal(item)}
                    >
                      View More
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar 
                            fullName={item.resident_name} 
                            profilePic={item.profile_picture} 
                            size={40} 
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.resident_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.email || '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-1 font-semibold text-black">{item.rating ?? '0'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4 mb-0.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.submitted_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(item)}
                        className="text-blue-600 hover:underline hover:text-blue-900 transition duration-200"
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
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-lg w-full relative">
            <button
              className="absolute px-2 py-1 top-4 right-4 text-gray-600 hover:bg-amber-700/10 rounded-full hover:text-red-600 text-md font-bold"
              onClick={closeModal}
              aria-label="Close modal"
            >
              &#x2715;
            </button>
            <div className="flex items-center space-x-2 ml-2 mb-3">
              <Avatar fullName={selectedItem.resident_name} profilePic={selectedItem.profile_picture} size={40} />
              <h2 className="text-xl font-bold">{selectedItem.resident_name}</h2>
            </div>
            <div className="flex items-center mb-5 space-x-2 ml-4">
              <span className="font-semibold">{selectedItem.rating ?? '0'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-5 pb-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
              </svg>
              <span>{new Date(selectedItem.submitted_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <p className="whitespace-pre-wrap mb-4 bg-gray-400/10 p-5 rounded-lg">{selectedItem.feedback_context}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedBackDetailsPage;
