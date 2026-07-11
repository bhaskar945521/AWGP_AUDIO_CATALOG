import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function FeedbackMarquee() {
  const [feedbacks, setFeedbacks] = useState([]);
  const navigate = useNavigate();

  const fetchApprovedFeedback = async () => {
    try {
      const res = await api.get('/feedback/approved');
      setFeedbacks(res.data || []);
    } catch (err) {
      console.warn('[FeedbackMarquee] Failed to fetch approved feedback:', err);
    }
  };

  useEffect(() => {
    fetchApprovedFeedback();
    // Poll every 60 seconds
    const interval = setInterval(fetchApprovedFeedback, 60000);
    return () => clearInterval(interval);
  }, []);

  if (feedbacks.length === 0) return null;

  // Render items twice so the -50% translateX loop is perfectly seamless
  const renderItems = (suffix) => feedbacks.map((fb, idx) => {
    const trackTitle = fb.audioId?.title || 'Unknown Track';
    const speakerName = fb.audioId?.speaker || 'Unknown Speaker';
    const userName = fb.userId?.fullName || fb.userId?.username || 'Anonymous';
    const shortText = fb.shortFeedback || fb.message || '';

    return (
      <div
        key={`${suffix}-${fb._id}-${idx}`}
        className="feedback-marquee-item"
        onClick={() => fb.audioId && navigate(`/details/${fb.audioId._id}`)}
        title={`Click to listen to "${trackTitle}"`}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap',
          padding: '0 24px', cursor: 'pointer'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px',
          background: 'rgba(247, 168, 77, 0.12)', borderRadius: '12px'
        }}>
          <span style={{ fontSize: '16px' }}>🎵</span>
          <span style={{ fontWeight: 700, color: 'var(--saffron)', fontSize: '0.85rem' }}>
            {trackTitle}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            ({speakerName})
          </span>
        </div>
        
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>•</span>
        
        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
          {userName}
        </span>
        
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          — "{shortText}"
        </span>
      </div>
    );
  });

  return (
    <div
      className="feedback-marquee-wrapper"
      style={{
        background: 'linear-gradient(135deg, rgba(255,248,235) 0%, rgba(255,244,225) 100%)',
        borderTop: '1px solid rgba(247,168,77,0.2)',
        borderBottom: '1px solid rgba(247,168,77,0.2)',
        overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '12px 0'
      }}
    >
      <div
        className="feedback-marquee-label"
        style={{
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: 800, color: '#fff', background: 'var(--saffron)',
          borderRadius: '0 20px 20px 0', fontSize: '0.8rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', zIndex: 10
        }}
      >
        <i className="fas fa-bullhorn" />
        <span>REVIEWS</span>
      </div>
      
      <div
        className="feedback-marquee-content-container"
        style={{
          flex: 1, overflow: 'hidden', position: 'relative'
        }}
      >
        <div
          className="feedback-marquee-track"
          style={{
            display: 'inline-flex', alignItems: 'center',
            animation: 'marquee 40s linear infinite'
          }}
        >
          {renderItems('a')}
          {renderItems('b')}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
