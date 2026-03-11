const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authMiddleware } = require('./auth');
const bcrypt = require('bcryptjs');

// 모든 마이페이지 라우트는 로그인 필수
router.use(authMiddleware);

// ===== 내 정보 조회 =====
router.get('/profile', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, email, phone, tel, company_name, position, business_number, address_zipcode, address_main, address_detail, birthdate, marketing_agreed, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (err) {
    console.error('[MyPage] 프로필 조회 에러:', err.message);
    res.status(500).json({ success: false, message: '프로필 조회 실패' });
  }
});

// ===== 내 정보 수정 =====
router.put('/profile', async (req, res) => {
  try {
    const {
      name, phone, tel, email,
      company_name, position, business_number,
      address_zipcode, address_main, address_detail,
      marketing_agreed
    } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        name, phone, tel, email,
        company_name, position, business_number,
        address_zipcode, address_main, address_detail,
        marketing_agreed
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, user: data, message: '정보가 수정되었습니다.' });
  } catch (err) {
    console.error('[MyPage] 프로필 수정 에러:', err.message);
    res.status(500).json({ success: false, message: '프로필 수정 실패' });
  }
});

// ===== 비밀번호 확인 (정보수정 전 인증) =====
router.post('/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: '비밀번호를 입력해주세요.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    res.json({ success: true, message: '인증되었습니다.' });
  } catch (err) {
    console.error('[MyPage] 비밀번호 확인 에러:', err.message);
    res.status(500).json({ success: false, message: '인증 실패' });
  }
});

// ===== 비밀번호 변경 =====
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: '새 비밀번호는 8자 이상이어야 합니다.' });
    }

    // 현재 비밀번호 확인
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    if (fetchErr) throw fetchErr;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호 해시
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: password_hash })
      .eq('id', req.user.id);

    if (updateErr) throw updateErr;
    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('[MyPage] 비밀번호 변경 에러:', err.message);
    res.status(500).json({ success: false, message: '비밀번호 변경 실패' });
  }
});

// ===== 내가 쓴 글 목록 =====
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('posts')
      .select('id, title, board_type, views, created_at', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 댓글 수 가져오기
    const postIds = data.map(p => p.id);
    let commentCounts = {};
    if (postIds.length > 0) {
      const { data: counts } = await supabase
        .rpc('get_comment_counts', { post_ids: postIds });
      if (counts) {
        counts.forEach(c => { commentCounts[c.post_id] = c.comment_count; });
      }
    }

    const posts = data.map(p => ({
      ...p,
      comment_count: commentCounts[p.id] || 0
    }));

    res.json({
      success: true,
      posts,
      total: count,
      totalPages: Math.ceil(count / limit),
      page
    });
  } catch (err) {
    console.error('[MyPage] 내 글 조회 에러:', err.message);
    res.status(500).json({ success: false, message: '내 글 조회 실패' });
  }
});

// ===== 내가 쓴 댓글 목록 =====
router.get('/comments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('comments')
      .select('id, content, created_at, post_id, posts(title, board_type)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const comments = data.map(c => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      post_id: c.post_id,
      post_title: c.posts?.title || '(삭제된 글)',
      board_type: c.posts?.board_type || 'free'
    }));

    res.json({
      success: true,
      comments,
      total: count,
      totalPages: Math.ceil(count / limit),
      page
    });
  } catch (err) {
    console.error('[MyPage] 내 댓글 조회 에러:', err.message);
    res.status(500).json({ success: false, message: '내 댓글 조회 실패' });
  }
});

module.exports = router;