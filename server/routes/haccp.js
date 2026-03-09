const express = require('express');
const router = express.Router();
const axios = require('axios');

const SERVICE_KEY = process.env.HACCP_API_KEY;
const BASE_URL = 'https://apis.data.go.kr/1471000/HaccpAppnSttusService01/getHaccpAppnSttusList01';

router.get('/api/haccp', async (req, res) => {
  try {
    const { pageNo = 1, numOfRows = 20, search = '' } = req.query;

    // ✅ 인증키를 URL에 직접 붙여서 이중 인코딩 방지
    let url = `${BASE_URL}?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`;

    if (search) {
      url += `&BSSH_NM=${encodeURIComponent(search)}`;
    }

    console.log('HACCP API 호출 URL:', url);  // 디버깅용

    const response = await axios.get(url);
    const data = response.data;

    console.log('HACCP API 응답 구조:', JSON.stringify(data).substring(0, 500));  // 디버깅용

    // 공공데이터 API 응답 구조에 맞춰 파싱
    // 구조: { header: {...}, body: { pageNo, totalCount, numOfRows, items: [...] } }
    const header = data?.header || {};
    const body = data?.body || {};

    // header에서 에러 확인
    if (header.resultCode && header.resultCode !== '00') {
      console.error('API 에러:', header.resultMsg);
      return res.status(400).json({ 
        error: header.resultMsg || 'API 호출 실패',
        items: [],
        totalCount: 0
      });
    }

    // items가 배열이 아닐 수 있음 (단건일 때 객체로 오는 경우)
    let items = body.items || [];
    if (items.item) {
      items = Array.isArray(items.item) ? items.item : [items.item];
    }
    if (!Array.isArray(items)) {
      items = [];
    }

    res.json({
      items: items,
      totalCount: body.totalCount || 0,
      pageNo: Number(pageNo),
      numOfRows: Number(numOfRows),
    });

  } catch (error) {
    console.error('HACCP API Error:', error.message);
    res.status(500).json({ error: 'HACCP 데이터를 불러올 수 없습니다.', items: [], totalCount: 0 });
  }
});

module.exports = router;