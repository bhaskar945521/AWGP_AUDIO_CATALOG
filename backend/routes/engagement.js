const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const permissionCheck = require('../middleware/permissionCheck');
const Favorite = require('../models/Favorite');
const Like = require('../models/Like');
const Dislike = require('../models/Dislike');
const Feedback = require('../models/Feedback');
const ListeningHistory = require('../models/ListeningHistory');
const Audio = require('../models/Audio');

// =============================================================
// MODULE 4: FAVORITES
// =============================================================

// POST /api/audio/:id/favorite — Add to favorites
router.post('/audio/:id/favorite', auth, async (req, res) => {
  const audioId = req.params.id;
  const userId = req.user._id;
  try {
    const audioExists = await Audio.findById(audioId);
    if (!audioExists) return res.status(404).json({ message: 'Audio track not found' });

    await Favorite.findOneAndUpdate(
      { userId, audioId },
      { userId, audioId },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Added to favorites', favorited: true });
  } catch (err) {
    console.error('Favorite add error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/audio/:id/favorite — Remove from favorites
router.delete('/audio/:id/favorite', auth, async (req, res) => {
  const audioId = req.params.id;
  const userId = req.user._id;
  try {
    await Favorite.findOneAndDelete({ userId, audioId });
    res.json({ message: 'Removed from favorites', favorited: false });
  } catch (err) {
    console.error('Favorite remove error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/user/favorites — All favorited tracks for logged-in user
router.get('/user/favorites', auth, async (req, res) => {
  const userId = req.user._id;
  try {
    const favorites = await Favorite.find({ userId })
      .populate('audioId')
      .sort({ createdAt: -1 });
    const audios = favorites.map(f => f.audioId).filter(Boolean);
    res.json(audios);
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================================
// MODULE 5 & 6: LIKES & DISLIKES (mutually exclusive)
// =============================================================

// POST /api/audio/:id/like — Toggle like (removes dislike if present)
router.post('/audio/:id/like', auth, async (req, res) => {
  const audioId = req.params.id;
  const userId = req.user._id;
  try {
    const existingLike = await Like.findOne({ userId, audioId });
    if (existingLike) {
      // Already liked — toggle off
      await Like.findOneAndDelete({ userId, audioId });
      const likeCount = await Like.countDocuments({ audioId });
      return res.json({ liked: false, likeCount });
    }
    // Remove any existing dislike first (mutual exclusion)
    await Dislike.findOneAndDelete({ userId, audioId });

    await Like.create({ userId, audioId });
    const likeCount = await Like.countDocuments({ audioId });
    const dislikeCount = await Dislike.countDocuments({ audioId });
    res.status(201).json({ liked: true, disliked: false, likeCount, dislikeCount });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/audio/:id/dislike — Toggle dislike (removes like if present)
router.post('/audio/:id/dislike', auth, async (req, res) => {
  const audioId = req.params.id;
  const userId = req.user._id;
  try {
    const existingDislike = await Dislike.findOne({ userId, audioId });
    if (existingDislike) {
      // Already disliked — toggle off
      await Dislike.findOneAndDelete({ userId, audioId });
      const dislikeCount = await Dislike.countDocuments({ audioId });
      return res.json({ disliked: false, dislikeCount });
    }
    // Remove any existing like first (mutual exclusion)
    await Like.findOneAndDelete({ userId, audioId });

    await Dislike.create({ userId, audioId });
    const likeCount = await Like.countDocuments({ audioId });
    const dislikeCount = await Dislike.countDocuments({ audioId });
    res.status(201).json({ disliked: true, liked: false, likeCount, dislikeCount });
  } catch (err) {
    console.error('Dislike error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/audio/:id/reactions — Get like/dislike counts + user's current reaction (if logged in)
router.get('/audio/:id/reactions', async (req, res) => {
  const audioId = req.params.id;
  // Use auth middleware optionally: check if req.user exists
  // We'll call auth manually but don't fail if not logged in
  let userId = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Token invalid, just continue as guest
    }
  }
  
  try {
    const [likeCount, dislikeCount, userLike, userDislike] = await Promise.all([
      Like.countDocuments({ audioId }),
      Dislike.countDocuments({ audioId }),
      userId ? Like.findOne({ userId, audioId }) : Promise.resolve(null),
      userId ? Dislike.findOne({ userId, audioId }) : Promise.resolve(null),
    ]);
    res.json({
      likeCount,
      dislikeCount,
      liked: !!userLike,
      disliked: !!userDislike,
    });
  } catch (err) {
    console.error('Reactions fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================================
// MODULE 7: FEEDBACK
// =============================================================

// POST /api/feedback — Submit feedback (public users)
router.post('/feedback', auth, async (req, res) => {
  const { message, rating, audioId, isGeneral, shortFeedback } = req.body;
  const userId = req.user._id;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ message: 'Feedback message is required' });
  }
  try {
    const feedback = await Feedback.create({
      userId,
      audioId: audioId || null,
      message: message.trim(),
      rating: rating || null,
      isGeneral: isGeneral || !audioId,
      approved: false,
      shortFeedback: shortFeedback ? shortFeedback.trim() : '',
    });
    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    console.error('Feedback submit error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/feedback/approved — Public marquee feedbacks (no authentication required)
router.get('/feedback/approved', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ approved: true })
      .populate('userId', 'fullName username')
      .populate('audioId', 'title speaker')
      .sort({ updatedAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error('Approved feedback fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/feedback — List all feedback (admin & authorized onlyuser only)
router.get('/feedback', auth, permissionCheck(['feedback_view']), async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('userId', 'fullName email username')
      .populate('audioId', 'title speaker')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error('Feedback list error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/audio/:id/feedback — Submit feedback for a specific track
router.post('/audio/:id/feedback', auth, async (req, res) => {
  const audioId = req.params.id;
  const { message, rating, shortFeedback } = req.body;
  const userId = req.user._id;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ message: 'Feedback message is required' });
  }
  try {
    const feedback = await Feedback.create({
      userId,
      audioId,
      message: message.trim(),
      rating: rating || null,
      isGeneral: false,
      approved: false,
      shortFeedback: shortFeedback ? shortFeedback.trim() : '',
    });
    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    console.error('Audio feedback submit error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/feedback/:id/approve — Toggle approval or update feedback details (admin/moderator only)
router.patch('/feedback/:id/approve', auth, permissionCheck(['feedback_view']), async (req, res) => {
  const { approved, shortFeedback } = req.body;
  try {
    const updateObj = {};
    if (approved !== undefined) updateObj.approved = approved;
    if (shortFeedback !== undefined) updateObj.shortFeedback = shortFeedback.trim();

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { $set: updateObj },
      { new: true }
    ).populate('userId', 'fullName email username')
     .populate('audioId', 'title speaker');

    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback approval status updated', feedback });
  } catch (err) {
    console.error('Approve feedback error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================================
// MODULE 8: LISTENING HISTORY
// =============================================================

// POST /api/listening/start — Record start of a listening session
router.post('/listening/start', auth, async (req, res) => {
  const { audioId } = req.body;
  const userId = req.user._id;
  if (!audioId) return res.status(400).json({ message: 'audioId is required' });
  try {
    const session = await ListeningHistory.create({
      userId,
      audioId,
      sessionStart: new Date(),
    });
    res.status(201).json({ sessionId: session._id });
  } catch (err) {
    console.error('Listening start error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/listening/:sessionId/end — Record end of a session
router.patch('/listening/:sessionId/end', auth, async (req, res) => {
  const { sessionId } = req.params;
  const { durationListened } = req.body;
  try {
    const session = await ListeningHistory.findOneAndUpdate(
      { _id: sessionId, userId: req.user._id },
      {
        sessionEnd: new Date(),
        durationListened: durationListened || 0,
      },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session recorded', session });
  } catch (err) {
    console.error('Listening end error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/user/history — Get listening history for logged-in user (last 7 days only)
router.get('/user/history', auth, async (req, res) => {
  const userId = req.user._id;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    const history = await ListeningHistory.find({ 
      userId, 
      sessionStart: { $gte: oneWeekAgo } 
    })
      .populate('audioId', 'title speaker duration image imageUrl category')
      .sort({ sessionStart: -1 })
      .limit(100);
    res.json(history);
  } catch (err) {
    console.error('Listening history error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/user/history — Clear all listening history for logged-in user (last 7 days or all)
router.delete('/user/history', auth, async (req, res) => {
  const userId = req.user._id;
  try {
    await ListeningHistory.deleteMany({ userId });
    res.json({ message: 'Listening history cleared successfully' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================================
// MODULE 9: ANALYTICS
// =============================================================

// GET /api/analytics — Aggregated stats (admin & authorized onlyuser)
router.get('/analytics', auth, permissionCheck(['analytics_view']), async (req, res) => {
  try {
    const [
      totalFavorites,
      totalLikes,
      totalDislikes,
      totalFeedback,
      totalSessions,
      topLiked,
      recentFeedback,
    ] = await Promise.all([
      Favorite.countDocuments(),
      Like.countDocuments(),
      Dislike.countDocuments(),
      Feedback.countDocuments(),
      ListeningHistory.countDocuments(),

      // Top 5 most liked tracks
      Like.aggregate([
        { $group: { _id: '$audioId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'audios', localField: '_id', foreignField: '_id', as: 'audio' } },
        { $unwind: { path: '$audio', preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, title: '$audio.title', speaker: '$audio.speaker' } },
      ]),

      // 5 most recent feedback entries
      Feedback.find()
        .populate('userId', 'fullName email username')
        .populate('audioId', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Total listening time in minutes
    const listenAgg = await ListeningHistory.aggregate([
      { $group: { _id: null, totalSeconds: { $sum: '$durationListened' } } },
    ]);
    const totalListeningMinutes = listenAgg.length > 0
      ? Math.round(listenAgg[0].totalSeconds / 60)
      : 0;

    // Unique listeners count
    const uniqueListeners = await ListeningHistory.distinct('userId');

    // Per-user listening activity — who used the app, how long, last seen
    const userActivity = await ListeningHistory.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSeconds: { $sum: '$durationListened' },
          sessionCount: { $sum: 1 },
          lastSeen: { $max: '$sessionStart' },
        },
      },
      { $sort: { totalSeconds: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          totalSeconds: 1,
          sessionCount: 1,
          lastSeen: 1,
          username: '$userInfo.username',
          fullName: '$userInfo.fullName',
          email: '$userInfo.email',
          role: '$userInfo.role',
        },
      },
    ]);

    res.json({
      totals: {
        favorites: totalFavorites,
        likes: totalLikes,
        dislikes: totalDislikes,
        feedback: totalFeedback,
        sessions: totalSessions,
        listeningMinutes: totalListeningMinutes,
        uniqueListeners: uniqueListeners.length,
      },
      topLiked,
      recentFeedback,
      userActivity,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/feedback/:id — Delete a feedback log (admin/authorized onlyuser)
router.delete('/feedback/:id', auth, permissionCheck(['feedback_delete']), async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Feedback delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
