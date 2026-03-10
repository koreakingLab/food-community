// routes/smartNotices.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { supabase } = require('../lib/supabase');

// 스마트제조 관련 키워드 목록
const SMART_KEYWORDS = [
  '스마트제조', '스마트공장', '스마트 제조', '스마트 공장',
  '제조혁신', '제조 혁신', '스마트팩토리', 'MES',
  '제조 디지털', '제조디지털', '공장자동화', '공장 자동화',
  '제조AI', '제조 AI', 'ICT융합', 'ICT 융합'
];

// 키워드 매칭 함수
function isSmartManufacturing(notice) {
  const searchText = [
    notice.pblancNm || '',
    notice.bsnsSumryCn || '',
    notice.hashTags || ''
  ].join(' ');
  
  return SMART_KEYWORDS.some(keyword => 
    searchText.includes(keyword)
  );
}

// ✅ 동기화 API (Cron으로 1일 1~2회 호출)
router.post('/sync', async (req, res) => {
  try {
    const API_KEY = process.env.BIZINFO_API_KEY;
    const apiUrl = `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?dataType=json&searchCnt=0&crtfcKey=${API_KEY}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    const allNotices = data?.jsonArray || [];
    
    // 스마트제조 관련 공고만 필터링
    const smartNotices = allNotices.filter(isSmartManufacturing);
    
    let upsertCount = 0;
    
    for (const notice of smartNotices) {
      const [beginDe, endDe] = (notice.reqstBeginEndDe || '')
        .split('~')
        .map(d => d?.trim());
      
      const { error } = await supabase
        .from('smart_notices')
        .upsert({
          pblanc_id: notice.pblancId,
          pblanc_nm: notice.pblancNm,
          jrsd_instt_nm: notice.jrsdInsttNm,
          bsns_sumry_cn: notice.bsnsSumryCn,
          pblanc_url: notice.pblancUrl,
          reqst_begin_de: beginDe || null,
          reqst_end_de: endDe || null,
          hash_tags: notice.hashTags,
          creat_pnttm: notice.creatPnttm,
          updated_at: new Date().toISOString()
        }, { onConflict: 'pblanc_id' });
      
      if (!error) upsertCount++;
    }
    
    res.json({
      success: true,
      total: allNotices.length,
      filtered: smartNotices.length,
      upserted: upsertCount
    });
  } catch (err) {
    console.error('동기화 오류:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 프론트엔드 조회 API
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const { data, count, error } = await supabase
      .from('smart_notices')
      .select('*', { count: 'exact' })
      .order('creat_pnttm', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;