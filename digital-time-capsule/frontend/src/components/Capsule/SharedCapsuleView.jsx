import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sharedAPI } from '../../services/api';
import Navbar from '../Layout/Navbar';
import { Lock, Calendar, Tag, Smile, ArrowLeft, CheckCircle, Eye } from 'lucide-react';

const SharedCapsuleView = () => {
  const { accessCode } = useParams();
  const navigate = useNavigate();
  const [capsuleData, setCapsuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const response = await sharedAPI.getByAccessCode(accessCode);
        setCapsuleData(response.data.sharedCapsule);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load capsule');
      } finally {
        setLoading(false);
      }
    };

    fetchCapsule();
  }, [accessCode]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!capsuleData) return null;

  const capsule = capsuleData.capsule;

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '20px' }}
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="card">
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>{capsule?.title || 'Untitled Capsule'}</h1>
              <div style={styles.meta}>
                <span className={capsuleData.conditionalRules?.requirePassword ? 'badge badge-locked' : 'badge badge-unlocked'}>
                  {capsuleData.conditionalRules?.requirePassword ? (
                    <>
                      <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Locked
                    </>
                  ) : (
                    'Unlocked'
                  )}
                </span>
                {capsule?.mood && (
                  <span className="badge badge-mood">
                    <Smile size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {getMoodEmoji(capsule.mood)} {capsule.mood}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.infoBar}>
            <div style={styles.infoItem}>
              <Calendar size={16} />
              <span>Created: {formatDate(capsule?.createdAt)}</span>
            </div>
            {capsuleData.deliveryDate && (
              <div style={styles.infoItem}>
                <Calendar size={16} />
                <span>Delivery: {formatDate(capsuleData.deliveryDate)}</span>
              </div>
            )}
          </div>

          {capsule?.tags && capsule.tags.length > 0 && (
            <div style={styles.tags}>
              <Tag size={16} />
              {capsule.tags.map((tag, idx) => (
                <span key={idx} style={styles.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {capsuleData.conditionalRules?.requirePassword && (
            <div className="alert alert-warning">
              <Lock size={16} /> Password required to view this capsule
            </div>
          )}

          {capsuleData.conditionalRules?.requireMilestone && (
            <div className="alert alert-warning">
              <CheckCircle size={16} /> Milestone required: {capsuleData.conditionalRules.milestoneDescription}
            </div>
          )}

          {capsule && (!capsuleData.conditionalRules?.requirePassword || capsuleData.conditionalRules?.isMilestoneCompleted) && (
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
                          <img src={media.url} alt="media" style={styles.mediaImage} />
                        ) : (
                          <video src={media.url} controls style={styles.mediaVideo} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  header: {
    marginBottom: '24px'
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

export default SharedCapsuleView;
