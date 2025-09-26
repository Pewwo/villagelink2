import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

import LandingPage from './assets/Modules/landingPage' //landing page component
import LogInPage from './assets/Modules/logInPage'
import SignUpPage from './assets/Modules/signUpPage'

import ResLayout from './components/Layouts/ResLayout' //layouts
import SpLayout from './components/Layouts/spLayout'

import AccountManagementPage from './components/Pages/Sharable/accountmanagementPage' //super admin / admin pages
import AnnouncementPage from './components/Pages/Sharable/announcementPage'
import ReqAndCompPage from './components/Pages/Sharable/reqAndCompPage'
import EmergencyLogsPage from './components/Pages/Sharable/emergencyLogsPage'
import FaqsPage from './components/Pages/Sharable/faqsPage'
import FeedbackPage from './components/Pages/Sharable/feedBackPage'
import VisitorLogsPage from './components/Pages/Sharable/visitorLogsPage'
import OfficialsPage from './components/Pages/Sharable/officialBoardPage'
import IdScanPage from './components/Pages/Sharable/idScanPage'
import FeedBackDetailsPage from './components/Pages/Sharable/feedBackDetailsPage'

import AnnouncementPageRes from './components/Pages/Res/announcementPage-Res' //resident pages
import ReqAndCompRes from './components/Pages/Res/reqAndComp-Res'
import SosPageRes from './components/Pages/Res/sosPage-Res'
import OfficialsPageRes from './components/Pages/Res/officialsBoardPage-Res'
import FaqsPageRes from './components/Pages/Res/faqsPage-Res'
import FeedbackPageRes from './components/Pages/Res/feedbackPage-Res'

import ProfilePage from './components/partials/profilePage' //profile page 

const socket = io('http://localhost:4000');

function App() {
  const [users, setUsers] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    // Listen for initial data
    socket.on('tableData', (data) => {
      setUsers(data);
    });

    // Listen for new data inserts
    socket.on('newData', (newUser) => {
      setUsers((prevUsers) => [newUser, ...prevUsers]);
    });

    // Listen for refresh data from polling
    socket.on('refreshData', (allUsers) => {
      setUsers(allUsers);
    });

    return () => {
      socket.off('tableData');
      socket.off('newData');
      socket.off('refreshData');
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LogInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route path="/reslayout" element={<ResLayout />}>
          <Route index element={<AnnouncementPageRes />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="requests" element={<ReqAndCompRes />} />
          <Route path="sos" element={<SosPageRes />} />
          <Route path="officials" element={<OfficialsPageRes />} />
          <Route path="faqs" element={<FaqsPageRes />} />
          <Route path="feedback" element={<FeedbackPageRes />} />
        </Route>
        <Route path="/spLayout" element={<SpLayout />}>
          <Route index element={<AnnouncementPage />} />
          <Route path="accountmanagement" element={<AccountManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="requests" element={<ReqAndCompPage />} />
          <Route path="emergencyLogs" element={<EmergencyLogsPage />} />
          <Route path="faqs" element={<FaqsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="feedBackDetails" element={<FeedBackDetailsPage />} />
          <Route path="visitorLogs" element={<VisitorLogsPage />} />
          <Route path="officials" element={<OfficialsPage />} />
          <Route path="idScan" element={<IdScanPage />} />
        </Route>
        <Route path="announcements" element={<Navigate to="/reslayout" replace />} />
      </Routes>
    </Router>
  )
}

export default App
