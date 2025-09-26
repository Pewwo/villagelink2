import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdLogout, MdAccountCircle, MdListAlt, MdMenu, MdClose } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";

const SidebarSP = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside
      className={`bg-gray-900 text-white fixed z-40 h-screen p-3 flex flex-col gap-1 transition-all duration-300 overflow-hidden hidden md:flex 
        ${isExpanded ? 'w-70' : 'w-16'}`}
    >
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify p-2 rounded hover:bg-gray-700 mb-4"
        title="Menu"
      >
        <MdMenu size={24} />
      </button>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-4">
        <Link to="/spLayout" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Announcements">
          <FaBullhorn size={18} />
          {isExpanded && <span className="whitespace-nowrap">Announcements</span>}
        </Link>
        <Link to="/spLayout/requests" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Request and Complaints">
          <FaEnvelope size={18} />
          {isExpanded && <span className="whitespace-nowrap">Request and Complaints</span>}
        </Link>
        <Link to="/spLayout/emergencyLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Emergency Logs">
          <FaPhoneAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Emergency Logs</span>}
        </Link>
        <Link to="/spLayout/visitorLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Visitor Logs">
          <MdListAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Visitor Logs</span>}
        </Link>
        <Link to="/spLayout/accountmanagement" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Account Management">
          <MdAccountCircle size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Account Management</span>}
        </Link>
        <Link to="/spLayout/officials" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Officials Board">
          <FaUsers size={18}/>
           {isExpanded && <span className="whitespace-nowrap">Officials Board</span>}
        </Link>
        <Link to="/spLayout/feedback" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Feedback">
          <MdOutlineFeedback size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Feedback</span>}
        </Link>
        <Link to="/spLayout/faqs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="FAQs">
          <FaQuestionCircle size={18}/>
          {isExpanded && <span className="whitespace-nowrap">FAQs</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default SidebarSP;
