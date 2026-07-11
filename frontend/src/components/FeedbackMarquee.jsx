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
      >
        <span className="marquee-music-icon">🎵</span>
        <strong className="marquee-track-title">{trackTitle}</strong>
        <span className="marquee-track-speaker">({speakerName})</span>
        <span className="marquee-separator">|</span>
        <span className="marquee-user">{userName}:</span>
        <span className="marquee-text">"{shortText}"</span>
      </div>
    );
  });

  return (
    <div className="feedback-marquee-wrapper">
      <div className="feedback-marquee-label">
        <i className="fas fa-bullhorn" />
        <span>REVIEWS</span>
      </div>
      <div className="feedback-marquee-content-container">
        <div className="feedback-marquee-track">
          {renderItems('a')}
          {renderItems('b')}
        </div>
      </div>
    </div>
  );
}
