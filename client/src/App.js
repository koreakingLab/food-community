import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { API_BASE } from './utils/constants';

import Header from './components/Header';
import Footer from './components/Footer';

// ✅ 기존 페이지
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import BoardWrapper from './pages/BoardPage';
import WritePost from './pages/WritePost';
import PricesPage from './pages/PricesPage';
import SmartNotices from './pages/SmartNotices';
import SmartNoticeDetail from './pages/SmartNoticeDetail';
import HaccpList from './pages/HaccpList';
import MyPage from './pages/MyPage';
import NewsPage from './pages/NewsPage';

// ✅ 플레이스홀더 (신규 메뉴용)
import PlaceholderPage from './pages/PlaceholderPage';

/* ===== App ===== */
function App() {
  const [priceData, setPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);

  const fetchPrices = async () => {
    setPriceLoading(true);
    setPriceError(null);
    try {
      const response = await fetch(API_BASE + '/api/kamis/prices');
      if (!response.ok) throw new Error('서버 응답 오류');
      const data = await response.json();
      if (data.success === false) throw new Error(data.error || '데이터 오류');
      setPriceData(data);
    } catch (err) {
      console.error('시세 조회 실패:', err);
      setPriceError('시세 정보를 불러오지 못했습니다.');
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main>
            <Routes>

              {/* ────── 홈 ────── */}
              <Route path="/" element={
                <HomePage
                  priceData={priceData}
                  priceLoading={priceLoading}
                  priceError={priceError}
                  onPriceRefresh={fetchPrices}
                />
              } />

              {/* ────── 원자재 시세 (기존 + 신규 하위) ────── */}
              <Route path="/prices" element={
                <PricesPage
                  priceData={priceData}
                  loading={priceLoading}
                  error={priceError}
                  onRefresh={fetchPrices}
                />
              } />
              <Route path="/prices/trend" element={<PlaceholderPage title="시세 추이(차트)" description="품목별 시세 변동 추이를 차트로 확인할 수 있습니다." />} />
              <Route path="/prices/compare" element={<PlaceholderPage title="품목별 비교" description="여러 품목의 시세를 한눈에 비교할 수 있습니다." />} />

              {/* ────── 장비 마켓 (신규) ────── */}
              <Route path="/equipment" element={<PlaceholderPage title="장비 마켓" description="식품 제조 장비를 검색하고 비교할 수 있습니다." />} />
              <Route path="/equipment/catalog" element={<PlaceholderPage title="장비 카탈로그" description="장비 종류별 카탈로그를 확인하세요." />} />
              <Route path="/equipment/directory" element={<PlaceholderPage title="장비 업체 디렉토리" description="장비 공급업체 정보를 한눈에 확인하세요." />} />
              <Route path="/equipment/inquiry" element={<PlaceholderPage title="장비 문의/견적" description="장비에 대한 문의 및 견적 요청을 할 수 있습니다." />} />

              {/* ────── AI 장비 추천 (신규) ────── */}
              <Route path="/ai-recommend" element={<PlaceholderPage title="AI 장비 추천" description="제품 사진을 업로드하면 적합한 장비를 추천받을 수 있습니다." />} />
              <Route path="/ai-recommend/results" element={<PlaceholderPage title="추천 결과" description="AI가 분석한 장비 추천 결과를 확인하세요." />} />
              <Route path="/ai-recommend/guide" element={<PlaceholderPage title="활용 가이드" description="AI 장비 추천 기능 활용법을 안내합니다." />} />

              {/* ────── 지원사업 (기존 + 신규 하위) ────── */}
              <Route path="/smart-notices" element={<SmartNotices />} />
              <Route path="/notices/:id" element={<SmartNoticeDetail />} />
              <Route path="/smart-notices/closing" element={<PlaceholderPage title="마감 임박 지원사업" description="곧 마감되는 지원사업을 확인하세요." />} />
              <Route path="/smart-notices/calendar" element={<PlaceholderPage title="지원사업 캘린더" description="지원사업 일정을 캘린더로 한눈에 확인하세요." />} />
              <Route path="/smart-notices/guide" element={<PlaceholderPage title="지원 가이드" description="지원사업 신청 방법을 안내합니다." />} />

              {/* ────── 정보센터 (뉴스·HACCP 기존 + 신규 하위) ────── */}
              <Route path="/info" element={<PlaceholderPage title="정보센터" description="식품 제조업에 필요한 정보를 한곳에서 확인하세요." />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/haccp" element={<HaccpList />} />
              <Route path="/info/regulations" element={<PlaceholderPage title="법규/인증 가이드" description="식품 관련 법규 및 인증 절차를 안내합니다." />} />
              <Route path="/info/safety" element={<PlaceholderPage title="식품 안전 자료실" description="식품 안전 관련 자료를 다운로드하세요." />} />

              {/* ────── 커뮤니티 (기존 자유게시판 + 신규 하위) ────── */}
              <Route path="/board/free/*" element={<BoardWrapper type="free" title="자유게시판" />} />
              <Route path="/board/qna/*" element={<BoardWrapper type="qna" title="Q&A" />} />
              <Route path="/board/reviews/*" element={<BoardWrapper type="reviews" title="업체 후기" />} />
              <Route path="/board/jobs/*" element={<BoardWrapper type="jobs" title="구인/구직" />} />
              <Route path="/write/free" element={<WritePost />} />
              <Route path="/write/qna" element={<WritePost />} />
              <Route path="/write/reviews" element={<WritePost />} />
              <Route path="/write/jobs" element={<WritePost />} />

              {/* ────── 인증/회원 (기존) ────── */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/mypage" element={<MyPage />} />

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;