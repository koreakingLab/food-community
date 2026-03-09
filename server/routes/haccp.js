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

// ===== API에서 한 페이지 가져오기 (XML/JSON 자동 처리) =====
async function fetchPage(page, pageSize) {
  const url = API_URL + '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY
    + '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(page)
    + '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent(pageSize);

  const res = await axios.get(url, { responseType: 'text', timeout: 30000 });
  let body = {};

  try {
    const parsed = await parseStringPromise(res.data, { explicitArray: false });
    body = parsed?.response?.body || {};
  } catch (parseErr) {
    try {
      const jsonData = JSON.parse(res.data);
      body = jsonData?.body || {};
    } catch (jsonErr) {
      return { items: [], totalCount: 0 };
    }
  }

  let items = [];
  const rawItems = body.items;
  if (rawItems) {
    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems.item) {
      items = Array.isArray(rawItems.item) ? rawItems.item : [rawItems.item];
    } else if (typeof rawItems === 'object') {
      const vals = Object.values(rawItems).filter(v => typeof v === 'object' && v !== null);
      if (vals.length > 0) items = vals;
    }
  } else if (body.item) {
    items = Array.isArray(body.item) ? body.item : [body.item];
  }

  return { items, totalCount: Number(body.totalCount) || 0 };
}

// ===== API 아이템 → Supabase 행 변환 =====
function toRow(item) {
  return {
    company: item.company || null,
    ceoname: item.ceoname || null,
    worksaddr: item.worksaddr || null,
    area1: item.area1 || null,
    area2: item.area2 || null,
    businesstype: item.businesstype || null,
    businesstype_nm: item.businesstypeNm || item.businessstypeNm || null,
    businessitem_nm: item.businessitemNm || null,
    product_gb: item.productGb || null,
    appointno: item.appointno || null,
    issuedate: item.issuedate || null,
    issueenddate: item.issueenddate || null,
    lcns_no: item.LCNS_NO || item.lcns_no || null,
    synced_at: new Date().toISOString(),
  };
}

// ===== 전체 동기화 (최초 1회용) =====
async function fullSync() {
  console.log('[HACCP] 전체 동기화 시작...');

  const { totalCount } = await fetchPage(1, 1);
  console.log('[HACCP] 총 건수:', totalCount);
  if (totalCount === 0) return;

  const pageSize = 100;
  const totalPages = Math.ceil(totalCount / pageSize);
  let allRows = [];

  for (let page = 1; page <= totalPages; page++) {
    try {
      const { items } = await fetchPage(page, pageSize);
      const rows = items.map(toRow);
      allRows = allRows.concat(rows);
      console.log(`[HACCP] 페이지 ${page}/${totalPages} 수집 (${rows.length}건)`);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`[HACCP] 페이지 ${page} 실패:`, err.message);
    }
  }

  if (allRows.length === 0) {
    console.log('[HACCP] 수집 0건, 저장 건너뜀');
    return;
  }

  // 기존 데이터 삭제 후 삽입
  await supabase.from('haccp_companies').delete().neq('id', 0);

  for (let i = 0; i < allRows.length; i += 1000) {
    const batch = allRows.slice(i, i + 1000);
    const { error } = await supabase.from('haccp_companies').insert(batch);
    if (error) {
      console.error(`[HACCP] 배치 삽입 실패 (${i}~${i + batch.length}):`, error.message);
    } else {
      console.log(`[HACCP] 배치 삽입 완료: ${i + batch.length}/${allRows.length}`);
    }
  }

  console.log(`[HACCP] ✅ 전체 동기화 완료! ${allRows.length}건 저장됨`);
}

// ===== 증분 동기화 (24시간마다 - 신규/누락분만 추가) =====
async function incrementalSync() {
  console.log('[HACCP] 증분 동기화 시작...');

  try {
    // 1. 현재 Supabase에 저장된 인증번호(appointno) 목록 가져오기
    let existingAppointNos = new Set();
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('haccp_companies')
        .select('appointno')
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('[HACCP] 기존 데이터 조회 실패:', error.message);
        break;
      }
      if (!data || data.length === 0) break;

      data.forEach(row => {
        if (row.appointno) existingAppointNos.add(row.appointno);
      });
      from += batchSize;
    }

    console.log(`[HACCP] 기존 인증번호 ${existingAppointNos.size}개 로드 완료`);

    // 2. API에서 전체 건수 확인
    const { totalCount } = await fetchPage(1, 1);
    const currentCount = existingAppointNos.size;
    console.log(`[HACCP] API 총 건수: ${totalCount}, Supabase 현재: ${currentCount}`);

    // 3. 최신 데이터부터 가져오면서 신규분만 수집
    const pageSize = 100;
    const totalPages = Math.ceil(totalCount / pageSize);
    let newRows = [];
    let consecutiveNoNew = 0; // 연속으로 신규 없는 페이지 수

    for (let page = 1; page <= totalPages; page++) {
      try {
        const { items } = await fetchPage(page, pageSize);
        let pageNewCount = 0;

        for (const item of items) {
          if (item.appointno && !existingAppointNos.has(item.appointno)) {
            newRows.push(toRow(item));
            existingAppointNos.add(item.appointno);
            pageNewCount++;
          }
        }

        console.log(`[HACCP] 페이지 ${page}/${totalPages} - 신규 ${pageNewCount}건`);

        if (pageNewCount === 0) {
          consecutiveNoNew++;
        } else {
          consecutiveNoNew = 0;
        }

        // 연속 10페이지 신규 없으면 나머지 건너뜀 (이미 있는 데이터)
        if (consecutiveNoNew >= 10 && newRows.length > 0) {
          console.log(`[HACCP] 연속 ${consecutiveNoNew}페이지 신규 없음, 나머지 건너뜀`);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        console.error(`[HACCP] 페이지 ${page} 실패:`, err.message);
      }
    }

    // 4. 신규분만 Supabase에 추가 (기존 데이터 삭제 안함!)
    if (newRows.length > 0) {
      for (let i = 0; i < newRows.length; i += 1000) {
        const batch = newRows.slice(i, i + 1000);
        const { error } = await supabase.from('haccp_companies').insert(batch);
        if (error) {
          console.error(`[HACCP] 신규 삽입 실패:`, error.message);
        }
      }
      console.log(`[HACCP] ✅ 증분 동기화 완료! 신규 ${newRows.length}건 추가됨`);
    } else {
      console.log('[HACCP] ✅ 증분 동기화 완료! 신규 데이터 없음');
    }

  } catch (err) {
    console.error('[HACCP] 증분 동기화 실패:', err.message);
  }
}

// ===== 메인 동기화 함수 =====
async function syncHaccpData() {
  if (isSyncing) {
    console.log('[HACCP] 이미 동기화 중...');
    return;
  }
  isSyncing = true;

  try {
    const { count } = await supabase
      .from('haccp_companies')
      .select('*', { count: 'exact', head: true });

    if (!count || count === 0) {
      // 데이터 없음 → 전체 동기화
      await fullSync();
    } else {
      // 데이터 있음 → 증분 동기화
      await incrementalSync();
    }
  } catch (err) {
    console.error('[HACCP] 동기화 에러:', err.message);
  } finally {
    isSyncing = false;
  }
}

// ===== 서버 시작 시 동기화 판단 =====
async function initSync() {
  const { data } = await supabase
    .from('haccp_companies')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1);

  const lastSyncTime = data?.[0]?.synced_at ? new Date(data[0].synced_at).getTime() : 0;
  const hoursSinceSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60);
  const { count } = await supabase
    .from('haccp_companies')
    .select('*', { count: 'exact', head: true });

  console.log(`[HACCP] 현재 ${count || 0}건, 마지막 동기화: ${hoursSinceSync.toFixed(1)}시간 전`);

  if (!count || count === 0) {
    console.log('[HACCP] Supabase 비어있음, 전체 동기화 시작');
    syncHaccpData();
  } else if (hoursSinceSync >= 24) {
    console.log('[HACCP] 24시간 경과, 증분 동기화 시작');
    syncHaccpData();
  } else {
    const remainingMs = (24 - hoursSinceSync) * 60 * 60 * 1000;
    console.log(`[HACCP] ${(24 - hoursSinceSync).toFixed(1)}시간 후 다음 동기화 예약`);
    setTimeout(syncHaccpData, remainingMs);
  }
}
initSync();
setInterval(syncHaccpData, 24 * 60 * 60 * 1000);

// ===== API 엔드포인트 (Supabase에서 조회) =====

// 목록 조회
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

// 동기화 상태 확인
router.get('/api/haccp/status', async (req, res) => {
  const { count } = await supabase
    .from('haccp_companies')
    .select('*', { count: 'exact', head: true });

  res.json({
    totalRecords: count || 0,
    isSyncing,
  });
});

// 수동 동기화 트리거
router.post('/api/haccp/sync', (req, res) => {
  syncHaccpData();
  res.json({ message: '동기화가 시작되었습니다.' });
});

module.exports = router;