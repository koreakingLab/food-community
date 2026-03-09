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

module.exports = router;