import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaUserCircle, FaTimes, FaBell } from "react-icons/fa";
import useSocket from "../../../hooks/useSocket";

const API_BASE = "https://villagelink.site/backend/api";

const CommunityBoard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Helper function to format timestamp
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Helper function to check if announcement is new (within 24 hours)
  const isNewAnnouncement = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    return diffInHours < 24;
  };

  const categories = ["All", "Meeting", "Alert", "Event", "Notice", "Tips"];

  // ✅ Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/announcements.php`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const text = await res.text();

      if (text.startsWith("<")) {
        throw new Error("Backend returned HTML instead of JSON:\n" + text);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON from backend:\n" + text);
      }

      // ✅ Ensure announcements is always an array
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        console.error("Backend did not return an array:", data);
        setAnnouncements([]);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setAnnouncements([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  // Socket.io integration
  const handleNewAnnouncement = (newAnnouncement) => {
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
  };

  const eventHandlers = {
    new_announcement: handleNewAnnouncement,
  };

  const socket = useSocket(eventHandlers);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ✅ Filter announcements safely
  const filteredAnnouncements = Array.isArray(announcements)
    ? announcements.filter((a) => {
        const matchesCategory =
          selectedCategory === "All" || a.category === selectedCategory;
        const matchesSearch =
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
    : [];

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Modal controls
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    setCategory("");
    setImageFile(null);
    setImagePreview(null);
  };

  // File select handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ✅ Submit form (create announcement)
  const handleSubmit = async () => {
    if (!title || !content || !category) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("acc_id", 1);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", category);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(`${API_BASE}/create_announcement.php`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Raw response from PHP:", text);

      if (text.startsWith("<")) {
        throw new Error("Backend returned HTML instead of JSON:\n" + text);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON from backend:\n" + text);
      }

      if (data.success) {
        alert("✅ Announcement posted!");
        closeModal();
        fetchAnnouncements();
        // Emit socket event to notify other clients
        console.log('Emitting new_announcement event:', data.announcement);
        if (socket) {
          socket.emit("new_announcement", data.announcement);
        } else {
          console.log('Socket not available for emitting event');
        }
      } else {
        alert("❌ Error: " + data.message);
      }
    } catch (error) {
      console.error("Error posting:", error);
      alert("❌ Could not post announcement.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Community Announcements
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest news, events, and important notices from your community
          </p>
        </div>

        {/* Search + Create */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={openModal}
              className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 min-h-[44px]"
            >
              <FaPlus className="text-sm" />
              Create Announcement
            </button>
          </div>

          {/* Categories */}
          <div className="justify-center flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 min-h-[44px] ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements */}
        {loading ? (
          <p className="text-center text-gray-600">Loading announcements...</p>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.ann_id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 max-w-2xl w-full mx-auto"
              >
                {/* Content Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUserCircle className="text-2xl text-slate-400" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {announcement.author || "Community Board"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(announcement.created_at)}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {announcement.title}
                  </h3>
                  <p
                    className={`text-gray-700 ${
                      expandedId !== announcement.ann_id ? "line-clamp-3" : ""
                    }`}
                  >
                    {announcement.content}
                  </p>
                  {announcement.content.length > 150 && (
                    <button
                      onClick={() => toggleExpand(announcement.ann_id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4 min-h-[44px]"
                    >
                      {expandedId === announcement.ann_id ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                {/* Image Section */}
                {announcement.image && (
                  <div className="relative overflow-hidden rounded-b-2xl w-full" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={`https://villagelink.site/backend/${announcement.image}`}
                      alt={announcement.title}
                      className="w-full h-full object-cover transition-transform duration-300 rounded-b-2xl hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'src/assets/villageLinkLogo.png';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-blue-800">
                        {announcement.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No announcements found</p>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create New Announcement
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Content */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select category</option>
                    <option>Meeting</option>
                    <option>Alert</option>
                    <option>Event</option>
                    <option>Notice</option>
                    <option>Tips</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-3 rounded-xl max-h-40 object-cover w-full"
                    />
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all duration-300 min-h-[44px]"
                  >
                    Post Announcement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityBoard;
