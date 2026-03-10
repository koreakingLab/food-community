require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const haccpRoutes = require('./routes/haccp');
const cron = require('node-cron');
const fetch = require('node-fetch');

// ===== 미들웨어 =====
app.use(cors({
  origin: [
    'https://food-community-ebon.vercel.app',
    'http://localhost:3000'  // 로컬 개발용
  ]
}));
app.use(express.json());
app.use(haccpRoutes);   
// ===== 기존 라우트 =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/news', require('./routes/news'));

// ============================================
// ===== KAMIS API (농산물유통정보) 연동 =====
// ============================================

const KAMIS_KEY = process.env.KAMIS_CERT_KEY || '319907e6-31e8-46e9-b245-33cf19ccac95';
const KAMIS_ID = process.env.KAMIS_CERT_ID || '7313';
const KAMIS_URL = 'http://www.kamis.or.kr/service/price/xml.do';

let priceCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000;

function isCacheValid() {
  return priceCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION);
}

async function fetchKamisDaily() {
  const response = await axios.get(KAMIS_URL, {
    params: {
      action: 'dailySalesList',
      p_cert_key: KAMIS_KEY,
      p_cert_id: KAMIS_ID,
      p_returntype: 'json',
      p_product_cls_code: '01',
      p_country_code: '',
      p_regday: '',
      p_convert_kg_yn: 'N',
    },
    timeout: 15000,
  });
  return response.data;
}

function getDirectionSymbol(direction, value) {
  const rate = parseFloat(value) || 0;
  if (direction === '1') return `+${rate}%`;
  if (direction === '0') return `-${rate}%`;
  return '0.0%';
}

function getDirectionClass(direction) {
  if (direction === '1') return 'up';
  if (direction === '0') return 'down';
  return '';
}

function parseByCategory(items, categoryCode, limit) {
  return items
    .filter(item =>
      item.product_cls_code === '01' &&
      item.category_code === categoryCode &&
      item.item_name &&
      item.dpr1 &&
      typeof item.dpr1 === 'string' &&
      item.dpr1 !== '-'
    )
    .slice(0, limit)
    .map(item => {
      const parts = (item.item_name || '').split('/');
      return {
        name: parts[0] || '',
        kind: parts[1] || '',
        price: item.dpr1,
        unit: item.unit || '',
        changeRate: getDirectionSymbol(item.direction, item.value),
        direction: getDirectionClass(item.direction),
        lastestDay: item.lastest_day || '',
      };
    });
}

app.get('/api/kamis/prices', async (req, res) => {
  try {
    if (isCacheValid()) {
      console.log('[KAMIS] 캐시 데이터 반환');
      return res.json(priceCache);
    }

    console.log('[KAMIS] API 호출 시작...');
    const data = await fetchKamisDaily();
    const allItems = data?.price || [];

    if (!Array.isArray(allItems) || allItems.length === 0) {
      throw new Error('KAMIS 응답에 price 배열이 없습니다');
    }

    const grains = parseByCategory(allItems, '100', 5);
    const fruits = parseByCategory(allItems, '400', 5);

    console.log(`[KAMIS] 곡물 ${grains.length}개, 과일 ${fruits.length}개 파싱 완료`);

    const result = {
      success: true,
      updatedAt: new Date().toISOString(),
      grains,
      fruits,
    };

    priceCache = result;
    cacheTimestamp = Date.now();
    res.json(result);
  } catch (error) {
    console.error('[KAMIS] 에러:', error.message);
    if (priceCache) {
      return res.json({ ...priceCache, isFallback: true });
    }
    res.status(500).json({ success: false, error: 'KAMIS 가격 정보를 가져오지 못했습니다.' });
  }
});

app.get('/api/kamis/debug', async (req, res) => {
  try {
    const raw = await fetchKamisDaily();
    res.json({ status: 'ok', rawResponse: raw });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/kamis/clear-cache', (req, res) => {
  priceCache = null;
  cacheTimestamp = null;
  res.json({ message: '캐시가 초기화되었습니다.' });
});

// ===== 서버 시작 (맨 마지막) =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 매일 오전 7시, 오후 1시에 동기화
cron.schedule('0 7,13 * * *', async () => {
  console.log('📡 스마트제조 공고 동기화 시작...');
  try {
    await fetch(`${process.env.SERVER_URL}/api/smart-notices/sync`, {
      method: 'POST'
    });
    console.log('✅ 동기화 완료');
  } catch (err) {
    console.error('❌ 동기화 실패:', err);
  }
});