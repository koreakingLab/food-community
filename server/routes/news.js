const express = require('express');
const router = express.Router();

// 네이버 뉴스 검색 API
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query || '식품제조업';
    const display = Math.min(parseInt(req.query.display) || 5, 20);
    const start = parseInt(req.query.start) || 1;
    const sort = req.query.sort || 'date'; // date: 최신순, sim: 정확도순

    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error('네이버 API 응답 오류: ' + response.status);
    }

    const data = await response.json();

    // HTML 태그 제거 헬퍼
    const stripHtml = (str) => str.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    const articles = data.items.map(item => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      link: item.originallink || item.link,
      pubDate: item.pubDate,
      source: new URL(item.originallink || item.link).hostname.replace('www.', ''),
    }));

    res.json({
      success: true,
      total: data.total,
      articles,
    });
  } catch (err) {
    console.error('뉴스 검색 실패:', err);
    res.status(500).json({ success: false, message: '뉴스를 불러오지 못했습니다.' });
  }
});

module.exports = router;