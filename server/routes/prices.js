const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 오늘의 시세 조회
router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM prices
       WHERE recorded_date = (
         SELECT MAX(recorded_date) FROM prices
       )
       ORDER BY category, item_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 특정 품목의 시세 추이 (최근 30일)
router.get('/trend/:item_name', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM prices
       WHERE item_name = $1
       AND recorded_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY recorded_date ASC`,
      [req.params.item_name]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 시세 등록 (관리자용)
router.post('/', auth, async (req, res) => {
  try {
    const { category, item_name, price, unit, change_rate, source, recorded_date } = req.body;

    const result = await pool.query(
      `INSERT INTO prices (category, item_name, price, unit, change_rate, source, recorded_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [category, item_name, price, unit, change_rate, source, recorded_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 시세 일괄 등록 (관리자용)
router.post('/bulk', auth, async (req, res) => {
  try {
    const { prices } = req.body;
    const results = [];

    for (const p of prices) {
      const result = await pool.query(
        `INSERT INTO prices (category, item_name, price, unit, change_rate, source, recorded_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [p.category, p.item_name, p.price, p.unit, p.change_rate, p.source, p.recorded_date]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;