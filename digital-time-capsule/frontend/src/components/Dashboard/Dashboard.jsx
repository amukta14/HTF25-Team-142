import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { capsulesAPI } from '../../services/api';
import Navbar from '../Layout/Navbar';
import EmotionTimeline from './EmotionTimeline';
import { Package, Lock, Unlock, Eye, Clock, Plus } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await capsulesAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Unlocked';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading" style={{ width: '50px', height: '50px' }}></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome to your time capsule collection</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/create')}
          >
            <Plus size={20} />
            Create New Capsule
          </button>
        </div>

        <div className="grid grid-3" style={{ marginBottom: '30px' }}>
          <div className="stats-card">
            <div style={styles.statIcon}>
              <Package size={32} color="#667eea" />
            </div>
            <div className="stats-number">{stats?.totalCapsules || 0}</div>
            <div className="stats-label">Total Capsules</div>
          </div>

          <div className="stats-card">
            <div style={styles.statIcon}>
              <Lock size={32} color="#f59e0b" />
            </div>
            <div className="stats-number">{stats?.lockedCapsules || 0}</div>
            <div className="stats-label">Locked</div>
          </div>

          <div className="stats-card">
            <div style={styles.statIcon}>
              <Unlock size={32} color="#10b981" />
            </div>
            <div className="stats-number">{stats?.unlockedCapsules || 0}</div>
            <div className="stats-label">Unlocked</div>
          </div>
        </div>

        {stats?.nextCapsule && (
          <div className="card" style={{ marginBottom: '30px' }}>
            <div style={styles.nextCapsule}>
              <div style={styles.nextCapsuleIcon}>
                <Clock size={48} color="#667eea" />
              </div>
              <div style={styles.nextCapsuleInfo}>
                <h3 style={styles.nextCapsuleTitle}>Next Capsule to Unlock</h3>
                <p style={styles.nextCapsuleName}>{stats.nextCapsule.title}</p>
                <div style={styles.nextCapsuleDate}>
                  <span>Unlocks in: </span>
                  <strong>{formatDate(stats.nextCapsule.unlockDate)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        <EmotionTimeline />

        <div style={styles.quickActions}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div className="grid grid-3">
            <div 
              style={styles.actionCard}
              onClick={() => navigate('/capsules')}
            >
              <Package size={32} color="#667eea" />
              <h3 style={styles.actionTitle}>View All Capsules</h3>
              <p style={styles.actionDescription}>Browse your entire collection</p>
            </div>

            <div 
              style={styles.actionCard}
              onClick={() => navigate('/create')}
            >
              <Plus size={32} color="#10b981" />
              <h3 style={styles.actionTitle}>Create Capsule</h3>
              <p style={styles.actionDescription}>Start a new time capsule</p>
            </div>

            <div 
              style={styles.actionCard}
              onClick={() => navigate('/shared/received')}
            >
              <Eye size={32} color="#f59e0b" />
              <h3 style={styles.actionTitle}>Shared With You</h3>
              <p style={styles.actionDescription}>View received capsules</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  statIcon: {
    marginBottom: '12px'
  },
  nextCapsule: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  nextCapsuleIcon: {
    background: '#f3f4f6',
    padding: '20px',
    borderRadius: '12px'
  },
  nextCapsuleInfo: {
    flex: 1
  },
  nextCapsuleTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: '500'
  },
  nextCapsuleName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px'
  },
  nextCapsuleDate: {
    fontSize: '14px',
    color: '#6b7280'
  },
  quickActions: {
    marginTop: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '20px'
  },
  actionCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginTop: '12px',
    marginBottom: '8px'
  },
  actionDescription: {
    fontSize: '14px',
    color: '#6b7280'
  }
};

export default Dashboard;