const express = require('express');
const router = express.Router();
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = process.env.HACCP_API_KEY;
const API_URL = 'https://apis.data.go.kr/B553748/CertCompanyListService2/getCertCompanyListService2';

// Supabase 클라이언트
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

let isSyncing = false;

// ===== 공공데이터 → Supabase 동기화 =====
async function syncHaccpData() {
  if (isSyncing) {
    console.log('[HACCP] 이미 동기화 중...');
    return;
  }
  isSyncing = true;
  console.log('[HACCP] 동기화 시작...');

  try {
    // 1. 총 건수 확인
    const firstUrl = API_URL + '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY
      + '&' + encodeURIComponent('pageNo') + '=1'
      + '&' + encodeURIComponent('numOfRows') + '=1';

    const firstRes = await axios.get(firstUrl, { responseType: 'text', timeout: 30000 });
    const firstParsed = await parseStringPromise(firstRes.data, { explicitArray: false });
    const totalCount = Number(firstParsed?.response?.body?.totalCount) || 0;
    console.log('[HACCP] 총 건수:', totalCount);

    if (totalCount === 0) {
      console.log('[HACCP] 데이터 없음, 동기화 중단');
      return;
    }

    // 2. 페이지별로 데이터 수집
    const pageSize = 1000;
    const totalPages = Math.ceil(totalCount / pageSize);
    let allItems = [];

    for (let page = 1; page <= totalPages; page++) {
      try {
        const url = API_URL + '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY
          + '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(page)
          + '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent(pageSize);

        const res = await axios.get(url, { responseType: 'text', timeout: 30000 });
        const parsed = await parseStringPromise(res.data, { explicitArray: false });
        const body = parsed?.response?.body || {};

        let items = [];
        if (body.items && body.items.item) {
          items = Array.isArray(body.items.item) ? body.items.item : [body.items.item];
        }

        // Supabase 형식으로 변환
        const rows = items.map(item => ({
          company: item.company || null,
          ceoname: item.ceoname || null,
          worksaddr: item.worksaddr || null,
          area1: item.area1 || null,
          area2: item.area2 || null,
          businesstype: item.businesstype || null,
          businesstype_nm: item.businesstypeNm || null,
          businessitem_nm: item.businessitemNm || null,
          product_gb: item.productGb || null,
          appointno: item.appointno || null,
          issuedate: item.issuedate || null,
          issueenddate: item.issueenddate || null,
          lcns_no: item.LCNS_NO || null,
          synced_at: new Date().toISOString(),
        }));

        allItems = allItems.concat(rows);
        console.log(`[HACCP] 페이지 ${page}/${totalPages} 수집 완료 (${items.length}건)`);

        // API 부하 방지 딜레이
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (pageErr) {
        console.error(`[HACCP] 페이지 ${page} 실패:`, pageErr.message);
      }
    }

    // 3. 기존 데이터 삭제 후 새 데이터 삽입
    console.log(`[HACCP] Supabase에 ${allItems.length}건 저장 시작...`);

    const { error: deleteError } = await supabase
      .from('haccp_companies')
      .delete()
      .neq('id', 0); // 전체 삭제

    if (deleteError) {
      console.error('[HACCP] 기존 데이터 삭제 실패:', deleteError.message);
      return;
    }

    // 1000건씩 배치 삽입
    for (let i = 0; i < allItems.length; i += 1000) {
      const batch = allItems.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('haccp_companies')
        .insert(batch);

      if (insertError) {
        console.error(`[HACCP] 배치 삽입 실패 (${i}~${i + batch.length}):`, insertError.message);
      } else {
        console.log(`[HACCP] 배치 삽입 완료: ${i + batch.length}/${allItems.length}`);
      }
    }

    console.log(`[HACCP] ✅ 동기화 완료! 총 ${allItems.length}건 저장됨`);

  } catch (err) {
    console.error('[HACCP] 동기화 실패:', err.message);
  } finally {
    isSyncing = false;
  }
}

// ===== 하루 1회 자동 동기화 (24시간마다) =====
syncHaccpData(); // 서버 시작 시 1회 실행
setInterval(syncHaccpData, 24 * 60 * 60 * 1000);

// ===== API 엔드포인트 (Supabase에서 조회) =====

// 목록 조회 (페이지네이션 + 검색)
router.get('/api/haccp', async (req, res) => {
  try {
    const { pageNo = 1, numOfRows = 20, search = '' } = req.query;
    const page = Number(pageNo);
    const size = Number(numOfRows);
    const from = (page - 1) * size;
    const to = from + size - 1;

    let query = supabase
      .from('haccp_companies')
      .select('*', { count: 'exact' })
      .order('issuedate', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('company', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase 조회 에러:', error.message);
      return res.status(500).json({ error: error.message, items: [], totalCount: 0 });
    }

    // 프론트엔드 호환을 위해 필드명 변환
    const items = (data || []).map(row => ({
      company: row.company,
      ceoname: row.ceoname,
      worksaddr: row.worksaddr,
      area1: row.area1,
      area2: row.area2,
      businesstypeNm: row.businesstype_nm,
      businessitemNm: row.businessitem_nm,
      productGb: row.product_gb,
      appointno: row.appointno,
      issuedate: row.issuedate,
      issueenddate: row.issueenddate,
    }));

    res.json({
      items,
      totalCount: count || 0,
      pageNo: page,
      numOfRows: size,
    });

  } catch (err) {
    console.error('HACCP 목록 조회 에러:', err.message);
    res.status(500).json({ error: err.message, items: [], totalCount: 0 });
  }
});

// 업체 상세 조회
router.get('/api/haccp/company', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: '업체명이 필요합니다.', items: [] });

    const { data, error } = await supabase
      .from('haccp_companies')
      .select('*')
      .eq('company', name)
      .order('issuedate', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, items: [] });
    }

    const items = (data || []).map(row => ({
      company: row.company,
      ceoname: row.ceoname,
      worksaddr: row.worksaddr,
      area1: row.area1,
      area2: row.area2,
      businesstypeNm: row.businesstype_nm,
      businessitemNm: row.businessitem_nm,
      productGb: row.product_gb,
      appointno: row.appointno,
      issuedate: row.issuedate,
      issueenddate: row.issueenddate,
    }));

    res.json({ items });

  } catch (err) {
    console.error('HACCP 업체 조회 에러:', err.message);
    res.status(500).json({ error: err.message, items: [] });
  }
});

// 동기화 상태 확인 & 수동 동기화
router.get('/api/haccp/status', async (req, res) => {
  const { count } = await supabase
    .from('haccp_companies')
    .select('*', { count: 'exact', head: true });

  res.json({
    totalRecords: count || 0,
    isSyncing,
  });
});

// 수동 동기화 트리거 (필요 시)
router.post('/api/haccp/sync', (req, res) => {
  syncHaccpData();
  res.json({ message: '동기화가 시작되었습니다.' });
});

module.exports = router;