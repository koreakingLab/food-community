// 백엔드: routes/home.js (새 파일)
router.get('/api/home', async (req, res) => {
  try {
    const [postsRes, noticesRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, users(nickname)', { count: 'exact' })
        .eq('board_type', 'free')
        .order('created_at', { ascending: false })
        .limit(5),
      fetch(API_BASE + '/api/smart-notices?page=1&limit=5')
        .then(r => r.json()),
    ]);

    res.json({
      success: true,
      freePosts: postsRes.data || [],
      notices: noticesRes.data || [],
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});