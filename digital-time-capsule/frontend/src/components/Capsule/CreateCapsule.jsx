import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { capsulesAPI } from '../../services/api';
import Navbar from '../Layout/Navbar';
import { Save, Upload, X, Calendar, Tag, Smile } from 'lucide-react';

const CreateCapsule = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    unlockDate: '',
    mood: 'reflective',
    tags: ''
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'excited', label: 'Excited', emoji: '🎉' },
    { value: 'nostalgic', label: 'Nostalgic', emoji: '🌅' },
    { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
    { value: 'reflective', label: 'Reflective', emoji: '🤔' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'peaceful', label: 'Peaceful', emoji: '☮️' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    const newPreviews = selectedFiles.map(file => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.content || !formData.unlockDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.unlockDate) <= new Date()) {
      setError('Unlock date must be in the future');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('unlockDate', formData.unlockDate);
      formDataToSend.append('mood', formData.mood);
      
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      formDataToSend.append('tags', JSON.stringify(tagsArray));

      files.forEach(file => {
        formDataToSend.append('media', file);
      });

      await capsulesAPI.create(formDataToSend);
      navigate('/capsules');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create capsule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <div style={styles.header}>
          <h1 style={styles.title}>Create Time Capsule</h1>
          <p style={styles.subtitle}>Preserve your memories for the future</p>
        </div>

        <div className="card">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <Tag size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Capsule Title *
              </label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="Give your capsule a meaningful title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Content *
              </label>
              <textarea
                name="content"
                className="form-textarea"
                placeholder="Write your message, thoughts, or memories..."
                value={formData.content}
                onChange={handleChange}
                rows="8"
                required
              ></textarea>
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                This content will be encrypted and secured until the unlock date
              </small>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Unlock Date *
                </label>
                <input
                  type="datetime-local"
                  name="unlockDate"
                  className="form-input"
                  value={formData.unlockDate}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Smile size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Current Mood
                </label>
                <select
                  name="mood"
                  className="form-select"
                  value={formData.mood}
                  onChange={handleChange}
                >
                  {moods.map(mood => (
                    <option key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Tag size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                className="form-input"
                placeholder="e.g., birthday, goal, memory, dream"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Upload size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Media Files (Optional)
              </label>
              <input
                type="file"
                className="form-input"
                onChange={handleFileChange}
                multiple
                accept="image/*,video/*"
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                Upload up to 5 images or videos (max 10MB each)
              </small>
            </div>

            {previews.length > 0 && (
              <div style={styles.previewContainer}>
                {previews.map((preview, index) => (
                  <div key={index} style={styles.previewItem}>
                    {preview.type.startsWith('image/') ? (
                      <img src={preview.url} alt={preview.name} style={styles.previewImage} />
                    ) : (
                      <video src={preview.url} style={styles.previewVideo} controls />
                    )}
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => removeFile(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="alert alert-info">
              <span>🔒</span>
              <div>
                <strong>Security Notice:</strong> Your capsule content will be encrypted and can only be accessed after the unlock date.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <div className="loading"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Create Capsule
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
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
  previewContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '16px',
    marginBottom: '16px'
  },
  previewItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '1',
    background: '#f3f4f6'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }
};

export default CreateCapsule;