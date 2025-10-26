import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { capsulesAPI } from '../../services/api';
import { TrendingUp, Heart } from 'lucide-react';

const EmotionTimeline = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmotionData();
  }, []);

  const loadEmotionData = async () => {
    try {
      const response = await capsulesAPI.getEmotionTimeline();
      setData(response.data.data);
    } catch (error) {
      console.error('Error loading emotion timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </div>
    );
  }

  if (!data || data.totalCapsules === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">No Emotion Data Yet</h3>
          <p className="empty-state-description">
            Create more capsules to see your emotional journey visualization
          </p>
        </div>
      </div>
    );
  }

  const moodColors = {
    happy: '#fbbf24',
    sad: '#60a5fa',
    excited: '#f472b6',
    nostalgic: '#a78bfa',
    hopeful: '#34d399',
    grateful: '#fb923c',
    reflective: '#8b5cf6',
    anxious: '#ef4444',
    peaceful: '#10b981'
  };

  const moodEmojis = {
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

  // Prepare timeline data for line chart
  const timelineData = data.timeline.map((item, index) => ({
    index: index + 1,
    mood: item.mood,
    date: new Date(item.date).toLocaleDateString(),
    moodValue: Object.keys(moodColors).indexOf(item.mood)
  }));

  // Prepare pie chart data
  const pieData = data.moodTrends.map(trend => ({
    name: trend.mood,
    value: parseInt(trend.count),
    percentage: trend.percentage
  }));

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Heart size={24} style={{ display: 'inline', marginRight: '8px', color: '#667eea' }} />
          Emotion Timeline
        </h2>
        <p className="card-description">
          Track your emotional journey through your time capsules
        </p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Your Emotional Journey
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, 8]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const mood = payload[0].payload.mood;
                  return (
                    <div style={styles.tooltip}>
                      <p style={styles.tooltipDate}>{payload[0].payload.date}</p>
                      <p style={styles.tooltipMood}>
                        {moodEmojis[mood]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="moodValue" 
              stroke="#667eea" 
              strokeWidth={3}
              dot={{ fill: '#667eea', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.divider}></div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Mood Distribution</h3>
        <div style={styles.pieChartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${moodEmojis[name]} ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={moodColors[entry.name]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={styles.tooltip}>
                        <p style={styles.tooltipMood}>
                          {moodEmojis[data.name]} {data.name.charAt(0).toUpperCase() + data.name.slice(1)}
                        </p>
                        <p style={styles.tooltipCount}>
                          {data.value} capsules ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.divider}></div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Mood Breakdown</h3>
        <div style={styles.moodGrid}>
          {data.moodTrends.map((trend) => (
            <div key={trend.mood} style={styles.moodCard}>
              <div style={styles.moodIcon}>{moodEmojis[trend.mood]}</div>
              <div style={styles.moodInfo}>
                <div style={styles.moodName}>
                  {trend.mood.charAt(0).toUpperCase() + trend.mood.slice(1)}
                </div>
                <div style={styles.moodStats}>
                  <span style={styles.moodCount}>{trend.count} capsules</span>
                  <span style={{...styles.moodBadge, background: moodColors[trend.mood]}}>
                    {trend.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop: '24px' }}>
        <span>💡</span>
        <div>
          <strong>Insight:</strong> Your most frequent mood is <strong>{data.moodTrends[0]?.mood}</strong> ({data.moodTrends[0]?.percentage}%). 
          This reflects your emotional state when creating capsules.
        </div>
      </div>
    </div>
  );
};

const styles = {
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  divider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '24px 0'
  },
  tooltip: {
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  tooltipDate: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  tooltipMood: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937'
  },
  tooltipCount: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  pieChartContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  moodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px'
  },
  moodCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  moodIcon: {
    fontSize: '32px'
  },
  moodInfo: {
    flex: 1
  },
  moodName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px'
  },
  moodStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  moodCount: {
    fontSize: '12px',
    color: '#6b7280'
  },
  moodBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white'
  }
};

export default EmotionTimeline;