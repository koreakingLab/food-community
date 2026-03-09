const express = require('express');
const router = express.Router();
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const SERVICE_KEY = process.env.HACCP_API_KEY;

router.get('/api/haccp', async (req, res) => {
  try {
    const { pageNo = 1, numOfRows = 12, search = '' } = req.query;

    const url = 'https://apis.data.go.kr/B553748/CertCompanyListService2/getCertCompanyListService2';
    let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY;
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(pageNo);
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent(numOfRows);

    if (search) {
      queryParams += '&' + encodeURIComponent('bssh_name') + '=' + encodeURIComponent(search);
    }

    console.log('HACCP API 호출:', url + queryParams);

    const response = await axios.get(url + queryParams, { responseType: 'text' });
    const xmlData = response.data;

    // XML → JSON 변환
    const parsed = await parseStringPromise(xmlData, { explicitArray: false });
    const header = parsed?.response?.header || {};
    const body = parsed?.response?.body || {};

    console.log('HACCP 파싱 결과 - totalCount:', body.totalCount);

    let items = [];
    if (body.items && body.items.item) {
      items = Array.isArray(body.items.item) ? body.items.item : [body.items.item];
    }

    res.json({
      items: items,
      totalCount: Number(body.totalCount) || 0,
      pageNo: Number(pageNo),
      numOfRows: Number(numOfRows),
    });

  } catch (error) {
    console.error('HACCP API Error:', error.message);
    res.status(500).json({ error: 'HACCP 데이터를 불러올 수 없습니다.', items: [], totalCount: 0 });
  }
});

// ✅ 특정 업체의 품목별 인증 목록 조회
router.get('/api/haccp/company', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: '업체명이 필요합니다.', items: [] });

    const url = 'https://apis.data.go.kr/B553748/CertCompanyListService2/getCertCompanyListService2';
    let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY;
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100');
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1');
    queryParams += '&' + encodeURIComponent('bssh_name') + '=' + encodeURIComponent(name);

    const response = await axios.get(url + queryParams, { responseType: 'text' });
    const parsed = await parseStringPromise(response.data, { explicitArray: false });
    const body = parsed?.response?.body || {};

    let items = [];
    if (body.items && body.items.item) {
      items = Array.isArray(body.items.item) ? body.items.item : [body.items.item];
    }

    // 정확히 일치하는 업체만 필터링
    items = items.filter(item => item.company === name);

    res.json({ items });

  } catch (error) {
    console.error('HACCP Company API Error:', error.message);
    res.status(500).json({ error: '업체 정보를 불러올 수 없습니다.', items: [] });
  }
});

module.exports = router;