# TODO: Add Notification to Sidebar

## Tasks
- [x] Modify Sidebar.jsx to add notification count for pending requests/complaints
- [x] Add state for notificationCount
- [x] Add useEffect to fetch initial count of pending items
- [x] Add socket listeners for new_request and new_complaint to increment count
- [x] Add red dot with number on the "Request and Complaints" link if count > 0
- [ ] Test the notification updates in real-time
