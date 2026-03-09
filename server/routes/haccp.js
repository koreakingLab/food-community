const express = require('express');
const router = express.Router();
const axios = require('axios');

const SERVICE_KEY = process.env.HACCP_API_KEY;

router.get('/api/haccp', async (req, res) => {
  try {
    const { pageNo = 1, numOfRows = 20, search = '' } = req.query;

    // ✅ 샘플코드와 동일한 방식으로 URL 생성
    const url = 'http://apis.data.go.kr/1471000/HaccpAppnSttusService01/getHaccpAppnSttusList01';
    let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY;
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(pageNo);
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent(numOfRows);
    queryParams += '&' + encodeURIComponent('type') + '=' + encodeURIComponent('json');

    if (search) {
      queryParams += '&' + encodeURIComponent('bssh_name') + '=' + encodeURIComponent(search);
    }

    console.log('HACCP API 호출 URL:', url + queryParams);

    const response = await axios.get(url + queryParams);
    const data = response.data;

    console.log('HACCP API 응답:', JSON.stringify(data).substring(0, 500));

    const header = data?.header || {};
    const body = data?.body || {};

    if (header.resultCode && header.resultCode !== '00') {
      console.error('API 에러:', header.resultMsg);
      return res.status(400).json({
        error: header.resultMsg || 'API 호출 실패',
        items: [],
        totalCount: 0
      });
    }

    // items 파싱 (배열 또는 객체)
    let items = body.items || [];
    if (!Array.isArray(items)) {
      items = items.item ? (Array.isArray(items.item) ? items.item : [items.item]) : [];
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