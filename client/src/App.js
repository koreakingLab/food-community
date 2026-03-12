import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { API_BASE } from './utils/constants';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import BoardWrapper from './pages/BoardPage';
import WritePost from './pages/WritePost';
import PricesPage from './pages/PricesPage';
import SmartNotices from './SmartNotices';
import SmartNoticeDetail from './SmartNoticeDetail';
import HaccpList from './pages/HaccpList';
import MyPage from './pages/MyPage';

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
              <Route path="/" element={
                <HomePage priceData={priceData} priceLoading={priceLoading} priceError={priceError} onPriceRefresh={fetchPrices} />
              } />
              <Route path="/prices" element={
                <PricesPage priceData={priceData} loading={priceLoading} error={priceError} onRefresh={fetchPrices} />
              } />
              <Route path="/board/news/*" element={<BoardWrapper type="news" title="업계 뉴스" />} />
              <Route path="/board/free/*" element={<BoardWrapper type="free" title="자유게시판" />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/haccp" element={<HaccpList />} />
              <Route path="/smart-notices" element={<SmartNotices />} />
              <Route path="/notices/:id" element={<SmartNoticeDetail />} />
              <Route path="/write/free" element={<WritePost />} />
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