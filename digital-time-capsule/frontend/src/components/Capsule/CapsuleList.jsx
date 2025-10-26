import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { capsulesAPI } from '../../services/api';
import Navbar from '../Layout/Navbar';
import { Package, Lock, Unlock, Calendar, Trash2, Eye } from 'lucide-react';

const CapsuleList = () => {
  const [capsules, setCapsules] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCapsules();
  }, [filter]);

  const loadCapsules = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? null : filter;
      const response = await capsulesAPI.getAll(status);
      setCapsules(response.data.capsules);
    } catch (error) {
      console.error('Error loading capsules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this capsule? This action cannot be undone.')) {
      try {
        await capsulesAPI.delete(id);
        setCapsules(capsules.filter(c => c._id !== id));
      } catch (error) {
        console.error('Error deleting capsule:', error);
        alert('Failed to delete capsule');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      excited: '🎉',
      nostalgic: '🌅',
      hopeful: '🌟',
      grateful: '🙏',
      reflective: '🤔',
      anxious: '😰',
      peaceful: '☮️'
    };
    return emojis[mood] || '🤔';
  };

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Capsules</h1>
            <p style={styles.subtitle}>Browse your time capsule collection</p>
          </div>
        </div>

        <div style={styles.filterBar}>
          <button
            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setFilter('all')}
          >
            <Package size={18} />
            All ({capsules.length})
          </button>
          <button
            className={filter === 'locked' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setFilter('locked')}
          >
            <Lock size={18} />
            Locked
          </button>
          <button
            className={filter === 'unlocked' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setFilter('unlocked')}
          >
            <Unlock size={18} />
            Unlocked
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading" style={{ width: '50px', height: '50px' }}></div>
          </div>
        ) : capsules.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3 className="empty-state-title">No Capsules Found</h3>
              <p className="empty-state-description">
                {filter === 'all' 
                  ? "You haven't created any capsules yet" 
                  : `No ${filter} capsules found`}
              </p>
              {filter === 'all' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/create')}
                  style={{ marginTop: '16px' }}
                >
                  Create Your First Capsule
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            {capsules.map(capsule => (
              <div 
                key={capsule._id}
                className="capsule-card"
                onClick={() => navigate(`/capsule/${capsule._id}`)}
              >
                <div style={styles.capsuleHeader}>
                  <h3 className="capsule-title">{capsule.title}</h3>
                  <button
                    className="btn btn-danger"
                    onClick={(e) => handleDelete(capsule._id, e)}
                    style={{ padding: '8px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="capsule-meta">
                  <span className={capsule.isLocked ? 'badge badge-locked' : 'badge badge-unlocked'}>
                    {capsule.isLocked ? (
                      <>
                        <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Unlocked
                      </>
                    )}
                  </span>
                  <span className="badge badge-mood">
                    {getMoodEmoji(capsule.mood)} {capsule.mood}
                  </span>
                  {capsule.type !== 'text' && (
                    <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                      {capsule.type}
                    </span>
                  )}
                </div>

                <div style={styles.capsuleDate}>
                  <Calendar size={14} />
                  <span>Unlocks: {formatDate(capsule.unlockDate)}</span>
                </div>

                {capsule.tags && capsule.tags.length > 0 && (
                  <div style={styles.tags}>
                    {capsule.tags.map((tag, idx) => (
                      <span key={idx} style={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}

                <div style={styles.viewButton}>
                  <Eye size={16} />
                  View Capsule
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  header: {
    marginBottom: '30px'
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
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  capsuleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  capsuleDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '12px'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '12px'
  },
  tag: {
    fontSize: '12px',
    color: '#667eea',
    background: '#f3f4f6',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
    padding: '10px',
    background: '#f3f4f6',
    borderRadius: '8px',
    color: '#374151',
    fontWeight: '600',
    fontSize: '14px'
  }
};

export default CapsuleList;