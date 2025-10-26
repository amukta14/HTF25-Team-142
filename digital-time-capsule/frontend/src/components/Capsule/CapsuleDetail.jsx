import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { capsulesAPI, sharedAPI } from '../../services/api';
import Navbar from '../Layout/Navbar';
import { Lock, Calendar, Tag, Smile, ArrowLeft, Share2, Trash2, X } from 'lucide-react';

const CapsuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    recipientEmail: '',
    message: '',
    deliveryDate: '',
    requirePassword: false,
    password: ''
  });
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    loadCapsule();
  }, [id]);

  const loadCapsule = async () => {
    try {
      const response = await capsulesAPI.getById(id);
      setCapsule(response.data.capsule);
    } catch (error) {
      console.error('Error loading capsule:', error);
      alert('Failed to load capsule');
      navigate('/capsules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this capsule?')) {
      try {
        await capsulesAPI.delete(id);
        navigate('/capsules');
      } catch (error) {
        console.error('Error deleting capsule:', error);
        alert('Failed to delete capsule');
      }
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setShareLoading(true);

    try {
      const conditionalRules = {};
      if (shareForm.requirePassword && shareForm.password) {
        conditionalRules.requirePassword = true;
        conditionalRules.password = shareForm.password;
      }

      await sharedAPI.share({
        capsuleId: id,
        recipientEmail: shareForm.recipientEmail,
        message: shareForm.message,
        deliveryDate: shareForm.deliveryDate,
        conditionalRules
      });

      alert('Capsule shared successfully!');
      setShowShareModal(false);
      setShareForm({
        recipientEmail: '',
        message: '',
        deliveryDate: '',
        requirePassword: false,
        password: ''
      });
    } catch (error) {
      console.error('Error sharing capsule:', error);
      alert(error.response?.data?.message || 'Failed to share capsule');
    } finally {
      setShareLoading(false);
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

  if (!capsule) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/capsules')}
          style={{ marginBottom: '20px' }}
        >
          <ArrowLeft size={20} />
          Back to Capsules
        </button>

        <div className="card">
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>{capsule.title}</h1>
              <div style={styles.meta}>
                <span className={capsule.isLocked ? 'badge badge-locked' : 'badge badge-unlocked'}>
                  {capsule.isLocked ? (
                    <>
                      <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Locked
                    </>
                  ) : (
                    'Unlocked'
                  )}
                </span>
                <span className="badge badge-mood">
                  <Smile size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {getMoodEmoji(capsule.mood)} {capsule.mood}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 size={18} />
                Share
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div style={styles.infoBar}>
            <div style={styles.infoItem}>
              <Calendar size={16} />
              <span>Created: {formatDate(capsule.createdAt)}</span>
            </div>
            <div style={styles.infoItem}>
              <Calendar size={16} />
              <span>Unlocks: {formatDate(capsule.unlockDate)}</span>
            </div>
          </div>

          {capsule.tags && capsule.tags.length > 0 && (
            <div style={styles.tags}>
              <Tag size={16} />
              {capsule.tags.map((tag, idx) => (
                <span key={idx} style={styles.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {capsule.isLocked ? (
            <div className="alert alert-warning" style={{ marginTop: '24px' }}>
              <Lock size={20} />
              <div>
                <strong>This capsule is still locked!</strong>
                <p>It will unlock on {formatDate(capsule.unlockDate)}. Come back then to view your memories.</p>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.content}>
                <h3 style={styles.contentTitle}>Content</h3>
                <p style={styles.contentText}>{capsule.content}</p>
              </div>

              {capsule.mediaUrls && capsule.mediaUrls.length > 0 && (
                <div style={styles.media}>
                  <h3 style={styles.contentTitle}>Media</h3>
                  <div style={styles.mediaGrid}>
                    {capsule.mediaUrls.map((media, idx) => (
                      <div key={idx} style={styles.mediaItem}>
                        {media.type === 'image' ? (
                          <img src={media.url} alt="Capsule media" style={styles.mediaImage} />
                        ) : (
                          <video src={media.url} controls style={styles.mediaVideo} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {capsule.isOpened && (
                <div className="alert alert-success" style={{ marginTop: '24px' }}>
                  <span>✅</span>
                  <div>
                    First opened on {formatDate(capsule.openedAt)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
              Share Capsule
            </h2>

            <form onSubmit={handleShare}>
              <div className="form-group">
                <label className="form-label">Recipient Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="friend@example.com"
                  value={shareForm.recipientEmail}
                  onChange={(e) => setShareForm({...shareForm, recipientEmail: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Personal Message (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add a personal message..."
                  value={shareForm.message}
                  onChange={(e) => setShareForm({...shareForm, message: e.target.value})}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Date *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={shareForm.deliveryDate}
                  onChange={(e) => setShareForm({...shareForm, deliveryDate: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={shareForm.requirePassword}
                    onChange={(e) => setShareForm({...shareForm, requirePassword: e.target.checked})}
                  />
                  <span>Require password to open</span>
                </label>
              </div>

              {shareForm.requirePassword && (
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Set a password"
                    value={shareForm.password}
                    onChange={(e) => setShareForm({...shareForm, password: e.target.value})}
                    required={shareForm.requirePassword}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={shareLoading}
                  style={{ flex: 1 }}
                >
                  {shareLoading ? (
                    <>
                      <div className="loading"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 size={20} />
                      Share Capsule
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowShareModal(false)}
                  disabled={shareLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px'
  },
  meta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  infoBar: {
    display: 'flex',
    gap: '24px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
    fontSize: '14px'
  },
  tags: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  tag: {
    fontSize: '13px',
    color: '#667eea',
    fontWeight: '500'
  },
  content: {
    marginTop: '24px',
    padding: '24px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  contentTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  contentText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap'
  },
  media: {
    marginTop: '24px'
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  },
  mediaItem: {
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#f3f4f6'
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  mediaVideo: {
    width: '100%',
    height: '100%'
  }
};

export default CapsuleDetail;