import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { socket } from "../api/socket"; // Import socket
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/users/notifications");
      setNotifications(res.data);
    } catch (err) { }
  };

  // 🔥 SOCKET LOGIC
  useEffect(() => {
    if (user) {
      // 1. Initial Load
      fetchNotifications();

      // 2. Connect Socket
      socket.connect();
      socket.emit("join_room", user._id); // Join my personal room

      // 3. Listen for REAL-TIME notifications
      socket.on("new_notification", (newNotif) => {
        // Add new notification to the top of the list
        setNotifications((prev) => [newNotif, ...prev]);
        // Optional: Play a sound here
      });

      return () => {
        socket.off("new_notification");
        socket.disconnect();
      };
    }
  }, [user]); // Re-run if user changes

  // ... (Keep handleLogout, handleBellClick, clickOutside, and JSX exactly the same) ...
  // ... Paste the rest of your Navbar code here ...

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("user");
      socket.disconnect(); // Disconnect on logout
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      try {
        await api.put("/users/notifications/read");
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("Failed to mark read");
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-left">
          <div className="logo">SE</div>
          <Link to="/" className="brand">SmartExpense</Link>
        </div>

        {user ? (
          <>
            <div className="nav-links">
              <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
              <Link to="/expenses" className={location.pathname === "/expenses" ? "active" : ""}>Expenses</Link>
              <Link to="/groups" className={location.pathname.startsWith("/groups") ? "active" : ""}>Groups</Link>
            </div>

            <div className="nav-right">
              <div className="notification-wrapper" ref={dropdownRef}>
                <button className="notification-bell" onClick={handleBellClick}>
                  🔔
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>

                {showDropdown && (
                  <div className="notification-dropdown">
                    <div className="dropdown-header">Notifications</div>
                    <div className="dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="empty-state">No new notifications</div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div key={idx} className={`dropdown-item ${n.isRead ? 'read' : 'unread'}`}>
                            {n.message}
                            <span className="notification-time">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </>
        ) : (
          <div className="nav-right">
            <Link to="/login" style={{ textDecoration: 'none', color: '#475569', fontWeight: 500 }}>Login</Link>
            <Link to="/signup" style={{ padding: '8px 16px', background: '#6366f1', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>Signup</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;