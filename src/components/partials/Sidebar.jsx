import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdLogout, MdMenu } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

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
        <Link to="/reslayout/requests" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Request and Complaints">
          <FaEnvelope size={18} />
          {isExpanded && <span className="whitespace-nowrap">Request and Complaints</span>}
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
