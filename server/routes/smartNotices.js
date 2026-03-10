const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../lib/supabase');

// 스마트제조 관련 키워드 목록
const SMART_KEYWORDS = [
  '스마트제조', '스마트공장', '스마트 제조', '스마트 공장',
  '제조혁신', '제조 혁신', '스마트팩토리', 'MES',
  '제조 디지털', '제조디지털', '공장자동화', '공장 자동화',
  '제조AI', '제조 AI', 'ICT융합', 'ICT 융합',
  '식품제조', '식품 제조', 'HACCP', '스마트식품'
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

// 올해 공고인지 확인하는 함수
function isThisYear(notice) {
  const currentYear = new Date().getFullYear().toString(); // '2026'
  
  // 등록일(creatPnttm) 기준: '2026-01-15 10:30:00' 형태
  if (notice.creatPnttm && notice.creatPnttm.startsWith(currentYear)) {
    return true;
  }
  
  // 신청기간(reqstBeginEndDe) 기준: '20260101 ~ 20260331' 형태
  if (notice.reqstBeginEndDe) {
    const beginDe = notice.reqstBeginEndDe.split('~')[0]?.trim();
    if (beginDe && beginDe.startsWith(currentYear)) {
      return true;
    }
  }

  return false;
}

// ✅ 동기화 API (올해 + 스마트제조 키워드 필터링)
router.post('/sync', async (req, res) => {
  try {
    const API_KEY = process.env.BIZINFO_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'BIZINFO_API_KEY 환경변수가 설정되지 않았습니다.' 
      });
    }

    const apiUrl = `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?dataType=json&searchCnt=0&crtfcKey=${API_KEY}`;

    console.log('[SmartNotices] 기업마당 API 호출 시작...');
    const response = await axios(apiUrl, { timeout: 30000 });
    const data = response.json();

    const allNotices = data?.jsonArray || [];
    console.log(`[SmartNotices] 전체 공고 수: ${allNotices.length}`);

    // 1차: 올해 공고만 필터링
    const thisYearNotices = allNotices.filter(isThisYear);
    console.log(`[SmartNotices] 올해 공고 수: ${thisYearNotices.length}`);

    // 2차: 스마트제조 키워드 필터링
    const smartNotices = thisYearNotices.filter(isSmartManufacturing);
    console.log(`[SmartNotices] 스마트제조 관련 공고 수: ${smartNotices.length}`);

    let upsertCount = 0;
    let errorCount = 0;

    for (const notice of smartNotices) {
      const [beginDe, endDe] = (notice.reqstBeginEndDe || '')
        .split('~')
        .map(d => {
          const trimmed = d?.trim();
          if (!trimmed || trimmed.length !== 8) return null;
          // '20260101' → '2026-01-01'
          return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
        });

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

      if (error) {
        console.error(`[SmartNotices] upsert 에러 (${notice.pblancId}):`, error.message);
        errorCount++;
      } else {
        upsertCount++;
      }
    }

    const result = {
      success: true,
      total: allNotices.length,
      thisYear: thisYearNotices.length,
      smartFiltered: smartNotices.length,
      upserted: upsertCount,
      errors: errorCount
    };

    console.log('[SmartNotices] 동기화 완료:', result);
    res.json(result);

  } catch (err) {
    console.error('[SmartNotices] 동기화 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 프론트엔드 조회 API (페이지네이션 + 마감 여부)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 'active' | 'expired' | 전체
    const offset = (page - 1) * limit;

    let query = supabase
      .from('smart_notices')
      .select('*', { count: 'exact' })
      .order('creat_pnttm', { ascending: false });

    // 접수중/마감 필터
    const today = new Date().toISOString().split('T')[0];
    if (status === 'active') {
      query = query.gte('reqst_end_de', today);
    } else if (status === 'expired') {
      query = query.lt('reqst_end_de', today);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

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
    console.error('[SmartNotices] 조회 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;