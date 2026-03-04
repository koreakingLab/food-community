const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 게시글 목록 조회
router.get('/', async (req, res) => {
  try {
    const { board_type = 'free', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await pool.query(
      `SELECT p.*, u.nickname, u.company_name,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.board_type = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [board_type, limit, offset]
    );

    const total = await pool.query(
      'SELECT COUNT(*) FROM posts WHERE board_type = $1',
      [board_type]
    );

    res.json({
      posts: posts.rows,
      totalPages: Math.ceil(total.rows[0].count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 상세 조회
router.get('/:id', async (req, res) => {
  try {
    // 조회수 증가
    await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [req.params.id]);

    const post = await pool.query(
      `SELECT p.*, u.nickname, u.company_name, u.company_type
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 댓글 조회
    const comments = await pool.query(
      `SELECT c.*, u.nickname, u.company_name
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    res.json({ post: post.rows[0], comments: comments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 작성
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, board_type } = req.body;

    const result = await pool.query(
      `INSERT INTO posts (user_id, board_type, title, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, board_type, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 수정
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    if (post.rows.length === 0) return res.status(404).json({ message: '게시글 없음' });
    if (post.rows[0].user_id !== req.user.id) return res.status(403).json({ message: '권한 없음' });

    const result = await pool.query(
      `UPDATE posts SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [title, content, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 게시글 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    if (post.rows.length === 0) return res.status(404).json({ message: '게시글 없음' });
    if (post.rows[0].user_id !== req.user.id) return res.status(403).json({ message: '권한 없음' });

    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 댓글 작성
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;