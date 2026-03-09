// server/routes/haccp.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');

const SERVICE_KEY = process.env.HACCP_API_KEY;
const BASE_URL = 'https://apis.data.go.kr/1471000/HaccpAppnSttusService01/getHaccpAppnSttusList01';

// ✅ 캐시 인스턴스 생성 (라우트 파일 상단에 선언)
const cache = new NodeCache({ stdTTL: 3600 }); // 1시간 유지

router.get('/api/haccp', async (req, res) => {
  try {
    const { pageNo = 1, numOfRows = 20, search = '' } = req.query;

    // ✅ 1. 캐시 키 생성 → 캐시에 있으면 바로 반환
    const cacheKey = `haccp_${pageNo}_${numOfRows}_${search}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached); // API 호출 없이 즉시 응답
    }

    // ✅ 2. 캐시에 없으면 공공데이터 API 호출
    const params = {
      serviceKey: SERVICE_KEY,
      pageNo,
      numOfRows,
      type: 'json',
    };
    if (search) {
      params.BSSH_NM = search;
    }

    const response = await axios.get(BASE_URL, { params });
    const body = response.data?.body || {};

    const result = {
      items: body.items || [],
      totalCount: body.totalCount || 0,
      pageNo: Number(pageNo),
      numOfRows: Number(numOfRows),
    };

    // ✅ 3. 결과를 캐시에 저장 후 응답
    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('HACCP API Error:', error.message);
    res.status(500).json({ error: 'HACCP 데이터를 불러올 수 없습니다.' });
  }
});

module.exports = router;