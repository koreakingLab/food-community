const router = require('express').Router();
const { supabase } = require('../lib/supabase');
const auth = require('../middleware/auth');

// 게시글 목록 조회 (댓글 수 포함)
router.get('/', async (req, res) => {
  try {
    const { board_type = 'free', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 게시글 조회
    const { data: posts, count, error } = await supabase
      .from('posts')
      .select('*, users(nickname, company_name)', { count: 'exact' })
      .eq('board_type', board_type)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // 각 게시글의 댓글 수 조회
    // ✅ 변경 후 — DB 요청 2번이면 끝
    const postIds = posts.map(p => p.id);
    let commentCounts = {};

    if (postIds.length > 0) {
      const { data: counts } = await supabase
        .rpc('get_comment_counts', { post_ids: postIds });

      if (counts) {
        counts.forEach(c => { commentCounts[c.post_id] = c.count; });
      }
    }

    const result = posts.map(p => ({
      ...p,
      nickname: p.users?.nickname || '익명',
      company_name: p.users?.company_name || null,
      comment_count: commentCounts[p.id] || 0,
    }));

    res.json({
      success: true,
      posts: result,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 게시글 상세 조회
router.get('/:id', async (req, res) => {
  try {
    // 조회수 증가
    await supabase.rpc('increment_views', { row_id: parseInt(req.params.id) });

    const { data: post, error } = await supabase
      .from('posts')
      .select('*, users(nickname, company_name, company_type)')
      .eq('id', req.params.id)
      .single();

    if (error || !post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

    // 댓글 조회
    const { data: comments } = await supabase
      .from('comments')
      .select('*, users(nickname, company_name)')
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      post: { ...post, nickname: post.users?.nickname, company_name: post.users?.company_name },
      comments: (comments || []).map(c => ({
        ...c,
        nickname: c.users?.nickname || '익명',
        company_name: c.users?.company_name || null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 작성
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, board_type } = req.body;
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: req.user.id, board_type, title, content })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, post: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 수정
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    // 작성자 확인
    const { data: post } = await supabase
      .from('posts').select('user_id').eq('id', req.params.id).single();
    if (!post) return res.status(404).json({ message: '게시글 없음' });
    if (post.user_id !== req.user.id) return res.status(403).json({ message: '권한 없음' });

    const { data, error } = await supabase
      .from('posts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, post: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: post } = await supabase
      .from('posts').select('user_id').eq('id', req.params.id).single();
    if (!post) return res.status(404).json({ message: '게시글 없음' });
    if (post.user_id !== req.user.id) return res.status(403).json({ message: '권한 없음' });

    await supabase.from('posts').delete().eq('id', req.params.id);
    res.json({ success: true, message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 댓글 작성
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: parseInt(req.params.id), user_id: req.user.id, content })
      .select('*, users(nickname, company_name)')
      .single();

    if (error) throw error;
    res.status(201).json({
      ...data,
      nickname: data.users?.nickname || '익명',
      company_name: data.users?.company_name || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;