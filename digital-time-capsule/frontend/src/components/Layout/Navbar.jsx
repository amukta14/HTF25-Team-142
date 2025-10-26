import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Home, Plus, Send, Inbox, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/dashboard" style={styles.logo}>
          <span style={styles.logoIcon}>⏳</span>
          Time Capsule
        </Link>

        <div style={styles.menu}>
          <Link 
            to="/dashboard" 
            style={{...styles.menuItem, ...(isActive('/dashboard') ? styles.menuItemActive : {})}}
            >
            <Home size={20} />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/create" 
            style={{...styles.menuItem, ...(isActive('/create') ? styles.menuItemActive : {})}}
          >
            <Plus size={20} />
            <span>Create</span>
          </Link>

          <Link 
            to="/shared/sent" 
            style={{...styles.menuItem, ...(isActive('/shared/sent') ? styles.menuItemActive : {})}}
          >
            <Send size={20} />
            <span>Sent</span>
          </Link>

          <Link 
            to="/shared/received" 
            style={{...styles.menuItem, ...(isActive('/shared/received') ? styles.menuItemActive : {})}}
          >
            <Inbox size={20} />
            <span>Received</span>
          </Link>
        </div>

        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <User size={20} />
            <span>{user?.name}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    fontSize: '28px'
  },
  menu: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    justifyContent: 'center'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#6b7280',
    fontWeight: '500',
    transition: 'all 0.3s'
  },
  menuItemActive: {
    background: '#f3f4f6',
    color: '#667eea'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
    fontWeight: '500'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s'
  }
};

export default Navbar;