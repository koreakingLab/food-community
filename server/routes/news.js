const express = require('express');
const router = express.Router();

// ===== 메모리 캐시 =====
let newsCache = {};        // 키워드별 캐시
const CACHE_DURATION = 30 * 60 * 1000; // 30분

const stripHtml = (str) =>
  str.replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const fetchFromNaver = async (query, display, start, sort) => {
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

  return {
    total: data.total,
    articles: data.items.map(item => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      link: item.originallink || item.link,
      pubDate: item.pubDate,
      source: (() => {
        try { return new URL(item.originallink || item.link).hostname.replace('www.', ''); }
        catch { return ''; }
      })(),
    })),
  };
};

// 캐시 키 생성
const getCacheKey = (query, display, start, sort) =>
  `${query}_${display}_${start}_${sort}`;

router.get('/search', async (req, res) => {
  try {
    const query = req.query.query || '식품제조업';
    const display = Math.min(parseInt(req.query.display) || 5, 100);
    const start = parseInt(req.query.start) || 1;
    const sort = req.query.sort || 'date';

    const cacheKey = getCacheKey(query, display, start, sort);
    const cached = newsCache[cacheKey];

    // 캐시가 있고 아직 유효하면 캐시 반환
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return res.json({
        success: true,
        ...cached.data,
        cached: true,
      });
    }

    // 캐시 없거나 만료 → 네이버 API 호출
    const data = await fetchFromNaver(query, display, start, sort);

    // 캐시 저장
    newsCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    res.json({
      success: true,
      ...data,
      cached: false,
    });
  } catch (err) {
    console.error('뉴스 검색 실패:', err);

    // API 실패 시 만료된 캐시라도 반환 (폴백)
    const cacheKey = getCacheKey(
      req.query.query || '식품제조업',
      req.query.display || 5,
      req.query.start || 1,
      req.query.sort || 'date'
    );
    const cached = newsCache[cacheKey];
    if (cached) {
      return res.json({
        success: true,
        ...cached.data,
        cached: true,
        stale: true,
      });
    }

    res.status(500).json({ success: false, message: '뉴스를 불러오지 못했습니다.' });
  }
});

// 캐시 초기화 (관리용)
router.post('/clear-cache', (req, res) => {
  newsCache = {};
  res.json({ success: true, message: '뉴스 캐시가 초기화되었습니다.' });
});

module.exports = router;