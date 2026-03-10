import HaccpList from './pages/HaccpList';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';
import SmartNotices from './SmartNotices';
import SmartNoticeDetail from './SmartNoticeDetail';

const API_BASE = 'https://food-community-production.up.railway.app';

const DUMMY_NEWS = [
  { id: 1, title: '[속보] 식약처, HACCP 인증기준 개정안 발표 — 소규모 업체 부담 완화', date: '2026. 3. 10.' },
  { id: 2, title: '2026년 식품산업 트렌드: AI 품질관리 도입 급증', date: '2026. 3. 9.' },
  { id: 3, title: '밀가루 가격 3개월 연속 상승세 — 제빵업계 비상', date: '2026. 3. 7.' },
  { id: 4, title: '친환경 포장재 의무화 로드맵 발표, 2028년부터 단계적 시행', date: '2026. 3. 5.' },
  { id: 5, title: '중소 식품기업 수출 지원 확대 — 해외 인증비 최대 80% 지원', date: '2026. 3. 3.' },
];

const DUMMY_FREE = [
  { id: 1, title: '라벨 프린터 자동화 후기 (비용 50% 절감)', comments: 12, date: '03.10.' },
  { id: 2, title: 'OEM 제조 맡길 수 있는 업체 찾습니다 (건강기능식품)', comments: 36, date: '03.09.' },
  { id: 3, title: '식품공장 여름철 온도관리 팁 공유합니다', comments: 23, date: '03.08.' },
  { id: 4, title: '충전기 추천 부탁합니다 (소스류, 시간당 500병)', comments: 15, date: '03.07.' },
  { id: 5, title: '소규모 소스 제조 시작하려는데 조언 부탁드립니다', comments: 31, date: '03.06.' },
];

const DUMMY_NOTICES_HOME = [
  { id: 1, title: '2026년 소프트웨어 보급·확산사업 참여기업 모집', org: '중소벤처기업부', period: '2026.01.15 ~ 2026.03.15', status: '접수중' },
  { id: 2, title: '식품제조 HACCP 컨설팅 지원사업 공고', org: '식품의약품안전처', period: '2026.02.15 ~ 2026.03.15', status: '접수중' },
  { id: 3, title: '[공모] AI 융합형 주력산업 육성 지원사업 모집 공고', org: '산업통상자원부', period: '2026.01.10 ~ 2026.03.13', status: '접수중' },
  { id: 4, title: '중소기업 제조혁신 바우처 지원사업', org: '중소기업진흥공단', period: '2025.12.01 ~ 2026.01.31', status: '모집' },
  { id: 5, title: '2026년 1차 스마트제조혁신 R&D 지원사업', org: '산업통상자원부', period: '2026.01.03 ~ 2026.02.03', status: '마감' },
];

const DUMMY_COMMENTS = [
  { id: 1, postId: 1, author: '이대리', content: '좋은 정보 감사합니다!', date: '2026-03-02' },
  { id: 2, postId: 1, author: '박과장', content: '저도 관심 있어요', date: '2026-03-03' },
];

/* ===== 헤더 ===== */
function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text"><b>Food</b>Community</span>
        </Link>
        <nav className="header-nav">
          <Link to="/" className="nav-link nav-home-icon">🏠</Link>
          <Link to="/prices" className="nav-link">원자재 시세</Link>
          <Link to="/smart-notices" className="nav-link">지원사업</Link>
          <Link to="/haccp" className="nav-link">HACCP</Link>
          <Link to="/board/news" className="nav-link">뉴스</Link>
          <Link to="/board/free" className="nav-link">게시판</Link>
        </nav>
        <div className="header-auth">
          <Link to="/login" className="btn-header-login">로그인</Link>
          <Link to="/signup" className="btn-header-signup">회원가입</Link>
        </div>
      </div>
    </header>
  );
}

/* ===== 시세 카드 ===== */
function PriceCard({ item }) {
  const getDirectionClass = (direction) => {
    if (direction === 'up') return 'card-rate rate-up';
    if (direction === 'down') return 'card-rate rate-down';
    return 'card-rate rate-same';
  };
  const getArrow = (direction) => {
    if (direction === 'up') return '▲';
    if (direction === 'down') return '▼';
    return '';
  };
  return (
    <div className="price-card">
      <p className="card-name">{item.name} ({item.kind})</p>
      <p className="card-price">
        <strong>{item.price}</strong> <span className="card-unit">{item.unit}</span>
      </p>
      <p className={getDirectionClass(item.direction)}>
        {getArrow(item.direction)} {item.changeRate}
      </p>
    </div>
  );
}

/* ===== 홈 - 시세 섹션 ===== */
function PriceSection({ priceData, loading, error, onRefresh }) {
  if (loading) {
    return (
      <section className="section-box">
        <div className="section-header">
          <h2 className="section-title">📊 오늘의 원자재 시세</h2>
        </div>
        <p className="loading-text">⏳ 시세 정보를 불러오는 중...</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="section-box">
        <div className="section-header">
          <h2 className="section-title">📊 오늘의 원자재 시세</h2>
        </div>
        <p className="error-text">⚠️ {error}</p>
        <button onClick={onRefresh} className="btn-retry">다시 시도</button>
      </section>
    );
  }
  const allItems = [...(priceData?.grains || []), ...(priceData?.fruits || [])];
  return (
    <section className="section-box">
      <div className="section-header">
        <h2 className="section-title">📊 오늘의 원자재 시세</h2>
        <span className="price-date-info">
          {priceData?.updatedAt
            ? new Date(priceData.updatedAt).toLocaleDateString('ko-KR') + ' 기준 (KAMIS)'
            : ''}
          <button onClick={onRefresh} className="btn-refresh-inline">🔄</button>
        </span>
      </div>
      {priceData?.isFallback && (
        <p className="fallback-notice">⚠️ 이전 캐시 데이터를 표시 중입니다.</p>
      )}
      <div className="price-grid-home">
        {allItems.map((item, idx) => (
          <PriceCard key={idx} item={item} />
        ))}
      </div>
    </section>
  );
}

/* ===== 시세 전체보기 ===== */
function PriceFullPage({ priceData, loading, error, onRefresh }) {
  if (loading) return <div className="page-wrapper"><p className="loading-text">⏳ 시세 정보를 불러오는 중...</p></div>;
  if (error) return <div className="page-wrapper"><p className="error-text">⚠️ {error}</p><button onClick={onRefresh} className="btn-retry">다시 시도</button></div>;
  return (
    <div className="page-wrapper">
      <section className="section-box">
        <div className="section-header">
          <h2 className="section-title">📊 원자재 시세 전체보기</h2>
          <button onClick={onRefresh} className="btn-refresh-small">🔄 새로고침</button>
        </div>
        <h3 className="sub-title">🌾 곡물 (식량작물)</h3>
        <div className="price-grid">
          {(priceData?.grains || []).map((item, idx) => (
            <PriceCard key={'g' + idx} item={item} />
          ))}
        </div>
        <h3 className="sub-title">🍎 과일류</h3>
        <div className="price-grid">
          {(priceData?.fruits || []).map((item, idx) => (
            <PriceCard key={'f' + idx} item={item} />
          ))}
        </div>
        <p className="price-source">
          출처: KAMIS 농산물유통정보 (소매가격) |
          {priceData?.updatedAt && (' ' + new Date(priceData.updatedAt).toLocaleString('ko-KR') + ' 기준')}
        </p>
      </section>
    </div>
  );
}

/* ===== 배너 ===== */
function NoticeBanner() {
  return (
    <div className="notice-banner">
      <div className="banner-inner">
        <div className="banner-text">
          <div className="banner-tags">
            <span className="banner-tag-status">접수중</span>
            <span className="banner-tag-org">· 식품의약품안전처</span>
          </div>
          <h3 className="banner-title">식품제조 HACCP 컨설팅 지원사업 공고</h3>
          <p className="banner-period">신청기간 2026.02.15 ~ 2026.03.15</p>
        </div>
        <div className="banner-right">
          <Link to="/notices/2" className="banner-btn">자세히 보기 →</Link>
          <div className="banner-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== 홈 - 지원사업 미리보기 ===== */
function NoticePreview() {
  const [filter, setFilter] = useState('전체');
  const filtered = filter === '전체'
    ? DUMMY_NOTICES_HOME
    : DUMMY_NOTICES_HOME.filter(n => n.status === filter);
  return (
    <section className="section-box">
      <div className="section-header">
        <h2 className="section-title">📋 지원사업 공고</h2>
        <Link to="/smart-notices" className="section-more">전체보기 →</Link>
      </div>
      <div className="notice-filter-tabs">
        {['전체', '접수중', '마감'].map(f => (
          <button
            key={f}
            className={'filter-tab' + (filter === f ? ' active' : '')}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <ul className="notice-preview-list">
        {filtered.map(notice => (
          <li key={notice.id} className="notice-preview-item">
            <Link to={'/notices/' + notice.id} className="notice-preview-link">
              <div className="notice-preview-info">
                <span className="notice-preview-title">{notice.title}</span>
                <span className="notice-preview-period">{notice.org} · {notice.period}</span>
              </div>
              <span className={'notice-status-badge' +
                (notice.status === '접수중' ? ' badge-active' :
                 notice.status === '마감' ? ' badge-expired' : ' badge-ongoing')}>
                {notice.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ===== 홈 - 뉴스 미리보기 ===== */
function NewsPreview() {
  return (
    <section className="section-box">
      <div className="section-header">
        <h2 className="section-title">📰 업계 뉴스</h2>
        <Link to="/board/news" className="section-more">전체보기 →</Link>
      </div>
      <ul className="news-preview-list">
        {DUMMY_NEWS.map(post => (
          <li key={post.id}>
            <Link to={'/board/news/' + post.id} className="news-preview-link">
              <span className="news-preview-title">{post.title}</span>
              <span className="news-preview-date">{post.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ===== 홈 - 자유게시판 미리보기 ===== */
function FreePreview() {
  return (
    <section className="section-box">
      <div className="section-header">
        <h2 className="section-title">💬 자유게시판</h2>
        <Link to="/board/free" className="section-more">전체보기 →</Link>
      </div>
      <ul className="free-preview-list">
        {DUMMY_FREE.map(post => (
          <li key={post.id}>
            <Link to={'/board/free/' + post.id} className="free-preview-link">
              <div className="free-preview-left">
                <span className="free-preview-title">{post.title}</span>
                {post.comments != null && (
                  <span className="free-preview-comments">({post.comments})</span>
                )}
              </div>
              <span className="free-preview-date">{post.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ===== 홈 - HACCP 미리보기 (리스트형) ===== */
function HaccpPreview() {
  const [items, setItems] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyItems, setCompanyItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_BASE + '/api/haccp?pageNo=1&numOfRows=100');
        const data = await res.json();
        const allItems = data.items || [];
        const seen = new Set();
        const unique = [];
        for (const item of allItems) {
          if (!seen.has(item.company)) {
            seen.add(item.company);
            unique.push(item);
          }
          if (unique.length >= 5) break;
        }
        setItems(unique);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleCardClick = async (companyName) => {
    setDetailLoading(true);
    setSelectedCompany(companyName);
    try {
      const res = await fetch(
        API_BASE + '/api/haccp/company?name=' + encodeURIComponent(companyName)
      );
      const data = await res.json();
      setCompanyItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedCompany(null);
    setCompanyItems([]);
  };

  return (
    <section className="section-box">
      <div className="section-header">
        <h2 className="section-title">🏭 HACCP 인증업체</h2>
        <Link to="/haccp" className="section-more">전체보기 →</Link>
      </div>
      <ul className="haccp-preview-list">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="haccp-preview-item"
            onClick={() => handleCardClick(item.company)}
          >
            <div className="haccp-preview-info">
              <span className="haccp-preview-name">{item.company}</span>
              <span className="haccp-preview-location">
                {item.area1} {item.area2} · {item.businesstypeNm}
              </span>
            </div>
            <span className="haccp-badge-sm">HACCP 인증</span>
          </li>
        ))}
      </ul>

      {selectedCompany && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <h3 className="modal-title">{selectedCompany}</h3>
            {detailLoading ? (
              <p className="modal-loading">불러오는 중...</p>
            ) : (
              <>
                {companyItems.length > 0 && (
                  <div className="modal-company-info">
                    <p><span className="modal-label-inline">대표자</span> {companyItems[0].ceoname || '-'}</p>
                    <p><span className="modal-label-inline">주소</span> {companyItems[0].worksaddr || '-'}</p>
                    <p><span className="modal-label-inline">지역</span> {(companyItems[0].area1 || '') + ' ' + (companyItems[0].area2 || '')}</p>
                  </div>
                )}
                <h4 className="modal-subtitle">📋 품목별 인증 현황 ({companyItems.length}건)</h4>
                <div className="modal-items-list">
                  {companyItems.map((ci, idx) => (
                    <div className="modal-item-row" key={idx}>
                      <div className="modal-item-left">
                        <span className="modal-item-name">{ci.businessitemNm || ci.businesstypeNm || '-'}</span>
                        <span className="modal-item-type">{ci.productGb || ''}</span>
                      </div>
                      <div className="modal-item-right">
                        <span className="modal-item-date">{ci.issuedate} ~ {ci.issueenddate || '진행중'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ===== 게시판 목록 ===== */
function Board({ type, title }) {
  const posts = type === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const navigate = useNavigate();
  return (
    <div className="page-wrapper">
      <section className="section-box">
        <h2 className="section-title">{title}</h2>
        <table className="board-table">
          <thead>
            <tr>
              <th className="col-id">번호</th>
              <th>제목</th>
              <th className="col-date">날짜</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr
                key={post.id}
                onClick={() => navigate('/board/' + type + '/' + post.id)}
                className="board-row"
              >
                <td className="text-center">{post.id}</td>
                <td className="td-title">{post.title}</td>
                <td className="text-center">{post.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ===== 게시글 상세 ===== */
function PostDetail({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const posts = type === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const post = posts.find(p => p.id === parseInt(id));
  const comments = DUMMY_COMMENTS.filter(c => c.postId === parseInt(id));
  const [newComment, setNewComment] = useState('');

  if (!post) return <div className="page-wrapper"><p>게시글을 찾을 수 없습니다.</p></div>;

  return (
    <div className="page-wrapper">
      <article className="section-box">
        <button onClick={() => navigate(-1)} className="btn-back">← 목록으로</button>
        <div className="post-detail">
          <h2>{post.title}</h2>
          <div className="post-meta"><span>📅 {post.date}</span></div>
          <hr />
          <p className="post-content">{post.content || '본문 내용이 없습니다.'}</p>
        </div>
        <div className="comment-section">
          <h3>💬 댓글 ({comments.length})</h3>
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-header">
                <strong>{c.author}</strong>
                <span className="comment-date">{c.date}</span>
              </div>
              <p>{c.content}</p>
            </div>
          ))}
          <div className="comment-input">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="input-comment"
            />
            <button className="btn-comment">등록</button>
          </div>
        </div>
      </article>
    </div>
  );
}

/* ===== 로그인 ===== */
function LoginPage() {
  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2>🔐 로그인</h2>
        <input type="text" placeholder="아이디" className="input-field" />
        <input type="password" placeholder="비밀번호" className="input-field" />
        <button className="btn-login">로그인</button>
        <p className="login-footer">
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

/* ===== 홈페이지 ===== */
function HomePage({ priceData, priceLoading, priceError, onPriceRefresh }) {
  return (
    <div className="page-wrapper">
      <PriceSection
        priceData={priceData}
        loading={priceLoading}
        error={priceError}
        onRefresh={onPriceRefresh}
      />
      <NoticeBanner />
      <div className="home-grid-2x2">
        <NoticePreview />
        <NewsPreview />
        <HaccpPreview />
        <FreePreview />
      </div>
    </div>
  );
}

/* ===== BoardWrapper ===== */
function BoardWrapper({ type, title }) {
  return (
    <Routes>
      <Route index element={<Board type={type} title={title} />} />
      <Route path=":id" element={<PostDetail type={type} />} />
    </Routes>
  );
}

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
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={
              <HomePage
                priceData={priceData}
                priceLoading={priceLoading}
                priceError={priceError}
                onPriceRefresh={fetchPrices}
              />
            } />
            <Route path="/prices" element={
              <PriceFullPage
                priceData={priceData}
                loading={priceLoading}
                error={priceError}
                onRefresh={fetchPrices}
              />
            } />
            <Route path="/board/news/*" element={<BoardWrapper type="news" title="📰 업계 뉴스" />} />
            <Route path="/board/free/*" element={<BoardWrapper type="free" title="💬 자유게시판" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/haccp" element={<HaccpList />} />
            <Route path="/smart-notices" element={<SmartNotices />} />
            <Route path="/notices/:id" element={<SmartNoticeDetail />} />
          </Routes>
        </main>
        <footer className="app-footer">
          © 2026 FoodCommunity | 식품 제조사와 장비 업체를 연결합니다
        </footer>
      </div>
    </Router>
  );
}

export default App;