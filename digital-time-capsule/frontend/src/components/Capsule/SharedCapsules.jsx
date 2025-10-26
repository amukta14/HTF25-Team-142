import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sharedAPI } from '../../services/api';
import Navbar from '../Layout/Navbar';
import { Send, Inbox, Calendar, User, Lock, CheckCircle, Eye } from 'lucide-react';

const SharedCapsules = () => {
  const { type } = useParams(); // 'sent' or 'received'
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCapsules();
  }, [type]);

  const loadCapsules = async () => {
    try {
      setLoading(true);
      const response = type === 'sent' 
        ? await sharedAPI.getSent()
        : await sharedAPI.getReceived();
      setCapsules(response.data.sharedCapsules);
    } catch (error) {
      console.error('Error loading shared capsules:', error);
    } finally {
      setLoading(false);
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

  const handleViewShared = (accessCode) => {
    navigate(`/view-shared/${accessCode}`);
  };

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {type === 'sent' ? (
                <>
                  <Send size={32} style={{ display: 'inline', marginRight: '12px' }} />
                  Sent Capsules
                </>
              ) : (
                <>
                  <Inbox size={32} style={{ display: 'inline', marginRight: '12px' }} />
                  Received Capsules
                </>
              )}
            </h1>
            <p style={styles.subtitle}>
              {type === 'sent' 
                ? 'Capsules you\'ve shared with others'
                : 'Capsules shared with you'}
            </p>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            className={type === 'sent' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => navigate('/shared/sent')}
          >
            <Send size={18} />
            Sent
          </button>
          <button
            className={type === 'received' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => navigate('/shared/received')}
          >
            <Inbox size={18} />
            Received
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading" style={{ width: '50px', height: '50px' }}></div>
          </div>
        ) : capsules.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                {type === 'sent' ? '📤' : '📥'}
              </div>
              <h3 className="empty-state-title">
                No {type === 'sent' ? 'Sent' : 'Received'} Capsules
              </h3>
              <p className="empty-state-description">
                {type === 'sent' 
                  ? 'Share your first capsule with someone special'
                  : 'No one has shared a capsule with you yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            {capsules.map(shared => (
              <div key={shared._id} className="card" style={{ cursor: 'default' }}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    {shared.capsule?.title || 'Untitled Capsule'}
                  </h3>
                  <span className={shared.isDelivered ? 'badge badge-unlocked' : 'badge badge-locked'}>
                    {shared.isDelivered ? 'Delivered' : 'Pending'}
                  </span>
                </div>

                <div style={styles.cardInfo}>
                  {type === 'sent' ? (
                    <div style={styles.infoRow}>
                      <User size={16} />
                      <span>To: {shared.recipientEmail}</span>
                    </div>
                  ) : (
                    <div style={styles.infoRow}>
                      <User size={16} />
                      <span>From: {shared.sender?.name || shared.sender?.email}</span>
                    </div>
                  )}

                  <div style={styles.infoRow}>
                    <Calendar size={16} />
                    <span>
                      {shared.isDelivered 
                        ? `Delivered: ${formatDate(shared.deliveredAt)}`
                        : `Delivers: ${formatDate(shared.deliveryDate)}`}
                    </span>
                  </div>

                  {shared.message && (
                    <div style={styles.message}>
                      <p style={styles.messageLabel}>Message:</p>
                      <p style={styles.messageText}>"{shared.message}"</p>
                    </div>
                  )}

                  {shared.conditionalRules?.requirePassword && (
                    <div style={styles.condition}>
                      <Lock size={14} />
                      <span>Password protected</span>
                    </div>
                  )}

                  {shared.conditionalRules?.requireMilestone && (
                    <div style={styles.condition}>
                      <CheckCircle size={14} />
                      <span>Milestone required: {shared.conditionalRules.milestoneDescription}</span>
                    </div>
                  )}

                  {shared.isOpened && (
                    <div className="alert alert-success" style={{ marginTop: '12px', padding: '8px 12px' }}>
                      <Eye size={14} />
                      <span style={{ fontSize: '12px' }}>
                        Opened on {formatDate(shared.openedAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.accessCode}>
                  <span style={styles.accessCodeLabel}>Access Code:</span>
                  <code style={styles.accessCodeValue}>{shared.accessCode}</code>
                </div>

                {shared.isDelivered && type === 'received' && (
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleViewShared(shared.accessCode)}
                    style={{ marginTop: '12px' }}
                  >
                    <Eye size={18} />
                    Open Capsule
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  header: { marginBottom: '30px' },
  title: { fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' },
  tabs: { display: 'flex', gap: '12px', marginBottom: '30px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937' },
  cardInfo: { marginBottom: '16px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px', marginBottom: '8px' },
  message: { marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #667eea' },
  messageLabel: { fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' },
  messageText: { fontSize: '14px', color: '#374151', fontStyle: 'italic' },
  condition: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#d97706', marginTop: '8px' },
  accessCode: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f3f4f6', borderRadius: '6px', marginTop: '12px' },
  accessCodeLabel: { fontSize: '12px', fontWeight: '600', color: '#6b7280' },
  accessCodeValue: { fontSize: '13px', fontWeight: '600', color: '#667eea', background: 'white', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }
};

export default SharedCapsules;
