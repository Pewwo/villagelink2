import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdLogout, MdMenu } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";
import useSocket from '../../hooks/useSocket';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };



  // Socket handlers for real-time updates
  const handleNewRequest = () => setNotificationCount(prev => prev + 1);
  const handleNewComplaint = () => setNotificationCount(prev => prev + 1);
  const eventHandlers = {
    new_request: () => {
      console.log('Received new_request event');
      handleNewRequest();
    },
    new_complaint: () => {
      console.log('Received new_complaint event');
      handleNewComplaint();
    },
  };
  const socket = useSocket(eventHandlers);

  return (
     <aside
      className={`bg-gray-900 text-white fixed z-40 h-screen p-3 flex flex-col gap-1 transition-all duration-300 overflow-hidden 
        hidden md:flex 
        ${isExpanded ? 'w-70' : 'w-16'}`}
    >
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify p-2 rounded hover:bg-gray-700 mb-4"
        title="Menu"
        aria-label="Menu"
      >
        <MdMenu size={24} />
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-4">
        <Link to="/reslayout" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Announcements">
          <FaBullhorn size={18} />
          {isExpanded && <span className="whitespace-nowrap">Announcements</span>}
        </Link>
        <Link to="/reslayout/requests" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Request and Complaints" onClick={() => setNotificationCount(0)}>
          <FaEnvelope size={18} />
          {isExpanded && <span className="whitespace-nowrap">Request and Complaints</span>}
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>
        <Link to="/reslayout/sos" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="SOS">
          <FaPhoneAlt size={18} />
          {isExpanded && <span className="whitespace-nowrap">SOS</span>}
        </Link>
        <Link to="/reslayout/officials" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Officials Board">
          <FaUsers size={18} />
          {isExpanded && <span className="whitespace-nowrap">Officials Board</span>}
        </Link>
        <Link to="/reslayout/faqs" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group"  title="FAQs">
          <FaQuestionCircle size={18} />
          {isExpanded && <span className="whitespace-nowrap">FAQs</span>}
        </Link>
        <Link to="/reslayout/feedback" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Feedback">
          <MdOutlineFeedback size={18} />
          {isExpanded && <span className="whitespace-nowrap">Feedback</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
