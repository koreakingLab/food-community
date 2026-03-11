import HaccpList from './pages/HaccpList';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import SmartNotices from './SmartNotices';
import SmartNoticeDetail from './SmartNoticeDetail';

const API_BASE = 'https://food-community-production.up.railway.app';

/* ===== 더미 데이터 ===== */
const DUMMY_NEWS = [
  { id: 1, title: '[속보] 식약처, HACCP 인증기준 개정안 발표… 소규모 업체 부담 완화', date: '2026. 3. 10.' },
  { id: 2, title: '2026년 식품산업 트렌드: AI 품질관리 도입 급증', date: '2026. 3. 8.' },
  { id: 3, title: '밀가루 가격 3개월 연속 상승세… 제빵업계 비상', date: '2026. 3. 7.' },
  { id: 4, title: '친환경 포장재 의무화 로드맵 발표, 2028년부터 단계적 시행', date: '2026. 3. 5.' },
  { id: 5, title: '중소 식품기업 수출 지원 확대… 해외 인증비 최대 80% 지원', date: '2026. 3. 3.' },
];

const DUMMY_FREE = [
  { id: 1, title: '라벨 프린터 자동화 후기 (비용 50% 절감)', comments: 12, date: '03.10.' },
  { id: 2, title: 'OEM 제조 맡길 수 있는 업체 찾습니다 (건강기능식품)', comments: 8, date: '03.09.' },
  { id: 3, title: '식품공장 여름철 온도관리 팁 공유합니다', comments: 23, date: '03.08.' },
  { id: 4, title: '충전기 추천 부탁합니다 (소스류, 시간당 500병)', comments: 15, date: '03.07.' },
  { id: 5, title: '소규모 소스 제조 시작하려는데 조언 부탁드립니다', comments: 31, date: '03.06.' },
];

/* ===== 공고 날짜/상태 헬퍼 (SlideBanner, NoticePreview 공용) ===== */
function formatNoticeDate(notice) {
  if (notice.reqst_date_raw && !notice.reqst_begin_de) return notice.reqst_date_raw;
  const begin = notice.reqst_begin_de ? new Date(notice.reqst_begin_de).toLocaleDateString('ko-KR') : '-';
  const end = notice.reqst_end_de ? new Date(notice.reqst_end_de).toLocaleDateString('ko-KR') : '-';
  return begin + ' ~ ' + end;
}
function getNoticeStatus(notice) {
  if (!notice.reqst_end_de) return { text: '상시', cls: 'badge-ongoing' };
  const today = new Date().toISOString().split('T')[0];
  if (notice.reqst_end_de >= today) return { text: '접수중', cls: 'badge-active' };
  return { text: '마감', cls: 'badge-expired' };
}

const DUMMY_COMMENTS = [
  { id: 1, postId: 1, author: '이대리', content: '좋은 정보 감사합니다!', date: '2026-03-02' },
  { id: 2, postId: 1, author: '박과장', content: '저도 관심 있어요', date: '2026-03-03' },
];

/* ===== SVG 아이콘 컴포넌트 ===== */
const IconFactory = () => (
  <svg className="icon-svg" viewBox="0 0 24 24">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
  </svg>
);
const IconActivity = () => (
  <svg className="icon-svg" viewBox="0 0 24 24">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconHome = () => (
  <svg className="icon-svg" viewBox="0 0 24 24">
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
);
const IconNewspaper = () => (
  <svg className="icon-svg" viewBox="0 0 24 24">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
    <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
  </svg>
);
const IconShield = () => (
  <svg className="icon-svg" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconMessage = () => (
  <svg className="icon-svg" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

/* ===== 헤더 ===== */
function Header() {
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-mark"><IconFactory /></div>
          <span className="logo-text"><em>Food</em>Community</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={isActive('/') ? 'active' : ''}>홈</Link>
          <Link to="/prices" className={isActive('/prices') ? 'active' : ''}>원자재 시세</Link>
          <Link to="/smart-notices" className={isActive('/smart-notices') || isActive('/notices') ? 'active' : ''}>지원사업</Link>
          <Link to="/haccp" className={isActive('/haccp') ? 'active' : ''}>HACCP</Link>
          <Link to="/board/news" className={isActive('/board/news') ? 'active' : ''}>뉴스</Link>
          <Link to="/board/free" className={isActive('/board/free') ? 'active' : ''}>게시판</Link>
        </nav>
        <div className="header-actions">
          <Link to="/login" className="btn-login">로그인</Link>
          <Link to="/signup" className="btn-signup">회원가입</Link>
        </div>
      </div>
    </header>
  );
}

/* ===== 시세 카드 ===== */
function PriceCard({ item }) {
  return (
    <div className="price-card">
      <div className="item-name">{item.name} ({item.kind})</div>
      <div className="item-price">{item.price}</div>
      <div className="item-unit">{item.unit}</div>
      <div className={'item-change' + (item.direction === 'up' ? ' up' : item.direction === 'down' ? ' down' : '')}>
        {item.direction === 'up' ? '▲' : item.direction === 'down' ? '▼' : ''} {item.changeRate}
      </div>
    </div>
  );
}

/* ===== 홈 - 시세 섹션 (⑥ 5개만 한줄) ===== */
function PriceSection({ priceData, loading, error, onRefresh }) {
  if (loading) {
    return (
      <section className="price-section">
        <div className="price-header">
          <div className="price-title"><IconActivity /> 오늘의 원자재 시세</div>
        </div>
        <p className="loading-text">⏳ 시세 정보를 불러오는 중...</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="price-section">
        <div className="price-header">
          <div className="price-title"><IconActivity /> 오늘의 원자재 시세</div>
        </div>
        <p className="error-text">⚠️ {error}</p>
        <button onClick={onRefresh} className="btn-retry">다시 시도</button>
      </section>
    );
  }
  const allItems = [...(priceData?.grains || []), ...(priceData?.fruits || [])].slice(0, 5);
  return (
    <section className="price-section">
      <div className="price-header">
        <div className="price-title"><IconActivity /> 오늘의 원자재 시세</div>
        <div className="price-date">
          {priceData?.updatedAt
            ? new Date(priceData.updatedAt).toLocaleDateString('ko-KR') + ' 기준 (KAMIS)'
            : ''}
          <button onClick={onRefresh} className="btn-refresh-inline">🔄</button>
        </div>
      </div>
      {priceData?.isFallback && (
        <p className="fallback-notice">⚠️ 이전 캐시 데이터를 표시 중입니다.</p>
      )}
      <div className="price-grid">
        {allItems.map((item, idx) => <PriceCard key={idx} item={item} />)}
      </div>
    </section>
  );
}

/* ===== 시세 전체보기 ===== */
function PriceFullPage({ priceData, loading, error, onRefresh }) {
  if (loading) return <div className="main"><p className="loading-text">⏳ 시세 정보를 불러오는 중...</p></div>;
  if (error) return <div className="main"><p className="error-text">⚠️ {error}</p><button onClick={onRefresh} className="btn-retry">다시 시도</button></div>;
  return (
    <div className="main">
      <section className="price-section">
        <div className="price-header">
          <div className="price-title"><IconActivity /> 원자재 시세 전체보기</div>
          <button onClick={onRefresh} className="btn-refresh-small">🔄 새로고침</button>
        </div>
        <h3 className="sub-title">🌾 곡물 (식량작물)</h3>
        <div className="price-grid price-grid-full">
          {(priceData?.grains || []).map((item, idx) => <PriceCard key={'g' + idx} item={item} />)}
        </div>
        <h3 className="sub-title">🍎 과일류</h3>
        <div className="price-grid price-grid-full">
          {(priceData?.fruits || []).map((item, idx) => <PriceCard key={'f' + idx} item={item} />)}
        </div>
        <p className="price-source">
          출처: KAMIS 농산물유통정보 (소매가격) |
          {priceData?.updatedAt && (' ' + new Date(priceData.updatedAt).toLocaleString('ko-KR') + ' 기준')}
        </p>
      </section>
    </div>
  );
}

/* ===== 슬라이드 배너 (⑧ API 연동 + 자동 순환) ===== */
function SlideBanner() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(API_BASE + '/api/smart-notices?page=1&limit=3&status=active');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setSlides(json.data.map(n => ({
            label: getNoticeStatus(n).text + (n.jrsd_instt_nm ? ' · ' + n.jrsd_instt_nm : ''),
            title: n.pblanc_nm,
            meta: '신청기간 ' + formatNoticeDate(n),
            link: '/notices/' + n.id
          })));
        }
      } catch (err) {
        console.error('배너 로딩 실패:', err);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="slide-banner">
      <div className="slide-content">
        <div className="slide-label">{slides[current].label}</div>
        <div className="slide-title">{slides[current].title}</div>
        <div className="slide-meta">{slides[current].meta}</div>
      </div>
      <div className="slide-actions">
        <Link to={slides[current].link} className="slide-btn">자세히 보기 →</Link>
        <div className="slide-nav">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={'slide-dot' + (idx === current ? ' active' : '')}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== 홈 - 지원사업 공고 (① 필터 버튼 제거 + API 연동) ===== */
function NoticePreview() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(API_BASE + '/api/smart-notices?page=1&limit=5');
        const json = await res.json();
        if (json.success) {
          const sorted = [...json.data].sort((a, b) => {
            const da = a.creat_pnttm || '';
            const db = b.creat_pnttm || '';
            return db.localeCompare(da);
          });
          setNotices(sorted);
        }
      } catch (err) {
        console.error('공고 로딩 실패:', err);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconHome /> 지원사업 공고</div>
        <Link to="/smart-notices" className="card-more">전체보기 →</Link>
      </div>
      <ul className="notice-list">
        {notices.map(notice => {
          const status = getNoticeStatus(notice);
          return (
            <li key={notice.id} className="notice-item">
              <div className="notice-info">
                <Link to={'/notices/' + notice.id} className="notice-name">{notice.pblanc_nm}</Link>
                <div className="notice-meta">{notice.jrsd_instt_nm} · {formatNoticeDate(notice)}</div>
              </div>
              <span className={'badge ' + status.cls}>{status.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ===== 홈 - 업계 뉴스 ===== */
function NewsPreview() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconNewspaper /> 업계 뉴스</div>
        <Link to="/board/news" className="card-more">전체보기 →</Link>
      </div>
      <ul className="news-list">
        {DUMMY_NEWS.map(post => (
          <li key={post.id} className="news-item">
            <Link to={'/board/news/' + post.id} className="news-title">{post.title}</Link>
            <div className="news-date">{post.date}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===== 홈 - HACCP 인증업체 ===== */
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
          if (unique.length >= 4) break;
        }
        setItems(unique);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleCardClick = async (companyName) => {
    setDetailLoading(true);
    setSelectedCompany(companyName);
    try {
      const res = await fetch(API_BASE + '/api/haccp/company?name=' + encodeURIComponent(companyName));
      const data = await res.json();
      setCompanyItems(data.items || []);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const closeModal = () => { setSelectedCompany(null); setCompanyItems([]); };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconShield /> HACCP 인증업체</div>
        <Link to="/haccp" className="card-more">전체보기 →</Link>
      </div>
      <ul className="haccp-list">
        {items.map((item, idx) => (
          <li key={idx} className="haccp-item" onClick={() => handleCardClick(item.company)}>
            <div>
              <div className="haccp-name">{item.company}</div>
              <div className="haccp-info">{item.area1} {item.area2} · {item.businesstypeNm}</div>
            </div>
            <span className="haccp-badge">HACCP 인증</span>
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
    </div>
  );
}

/* ===== 홈 - 자유게시판 ===== */
function FreePreview() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconMessage /> 자유게시판</div>
        <Link to="/board/free" className="card-more">전체보기 →</Link>
      </div>
      <ul className="board-list">
        {DUMMY_FREE.map(post => (
          <li key={post.id} className="board-item">
            <div className="board-title-wrap">
              <Link to={'/board/free/' + post.id} className="board-title-text">{post.title}</Link>
              {post.comments != null && <span className="board-comment">[{post.comments}]</span>}
            </div>
            <span className="board-date">{post.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===== 게시판 목록 (전체 페이지) ===== */
function Board({ type, title }) {
  const posts = type === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const navigate = useNavigate();
  return (
    <div className="main">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {type === 'news' ? <IconNewspaper /> : <IconMessage />} {title}
          </div>
        </div>
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
              <tr key={post.id} onClick={() => navigate('/board/' + type + '/' + post.id)} className="board-row">
                <td className="text-center">{post.id}</td>
                <td className="td-title">{post.title}</td>
                <td className="text-center">{post.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

  if (!post) return <div className="main"><p>게시글을 찾을 수 없습니다.</p></div>;

  return (
    <div className="main">
      <div className="card">
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
      </div>
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
        <button className="btn-login-submit">로그인</button>
        <p className="login-footer">
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

/* ===== 푸터 ===== */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">FoodCommunity</div>
        <div className="footer-copy">© 2026 식품업계 커뮤니티 | 식품 제조사와 장비 업체를 연결합니다</div>
      </div>
    </footer>
  );
}

/* ===== 홈페이지 ===== */
function HomePage({ priceData, priceLoading, priceError, onPriceRefresh }) {
  return (
    <div className="main">
      <PriceSection priceData={priceData} loading={priceLoading} error={priceError} onRefresh={onPriceRefresh} />
      <SlideBanner />
      <div className="dashboard-grid">
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
              <HomePage priceData={priceData} priceLoading={priceLoading} priceError={priceError} onPriceRefresh={fetchPrices} />
            } />
            <Route path="/prices" element={
              <PriceFullPage priceData={priceData} loading={priceLoading} error={priceError} onRefresh={fetchPrices} />
            } />
            <Route path="/board/news/*" element={<BoardWrapper type="news" title="업계 뉴스" />} />
            <Route path="/board/free/*" element={<BoardWrapper type="free" title="자유게시판" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/haccp" element={<HaccpList />} />
            <Route path="/smart-notices" element={<SmartNotices />} />
            <Route path="/notices/:id" element={<SmartNoticeDetail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;