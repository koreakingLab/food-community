import HaccpList from './pages/HaccpList';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

const API_BASE = 'https://food-community-production.up.railway.app';

const DUMMY_NEWS = [
  { id: 1, title: '[속보] 식약처, HACCP 인증기준 개정안 발표', date: '2026. 3. 4.' },
  { id: 2, title: '2026년 식품산업 트렌드: AI 품질관리 도입 급증', date: '2026. 3. 3.' },
  { id: 3, title: '밀가루 가격 3개월 연속 상승세...제빵업계 비상', date: '2026. 3. 2.' },
  { id: 4, title: '중소기업 식품공장 설비지원 사업 공고 (2026 상반기)', date: '2026. 3. 1.' },
  { id: 5, title: '친환경 포장재 의무화 로드맵 발표...2028년부터 단계적 시행', date: '2026. 2. 28.' },
];

const DUMMY_FREE = [
  { id: 1, title: '소규모 소스 제조 시작하려는데 조언 부탁드립니다', date: '2026. 3. 4.' },
  { id: 2, title: '충전기 추천 부탁합니다 (소스류, 시간당 500병)', date: '2026. 3. 3.' },
  { id: 3, title: '식품공장 여름철 온도관리 팁 공유합니다', date: '2026. 3. 2.' },
  { id: 4, title: 'OEM 제조 맡길 수 있는 업체 찾습니다 (건강기능식품)', date: '2026. 3. 1.' },
  { id: 5, title: '라벨 프린터 자동화 후기 (비용 50% 절감)', date: '2026. 2. 28.' },
];

const DUMMY_COMMENTS = [
  { id: 1, postId: 1, author: '이대리', content: '좋은 정보 감사합니다!', date: '2026-03-02' },
  { id: 2, postId: 1, author: '박과장', content: '저도 관심 있어요', date: '2026-03-03' },
];

// ===== 헤더 =====
function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">식품업계 커뮤니티</span>
        </Link>
        <nav className="header-nav">
          <Link to="/prices" className="nav-link">📊 원자재 시세</Link>
          <Link to="/board/news" className="nav-link">📰 업계 뉴스</Link>
          <Link to="/board/free" className="nav-link">💬 자유게시판</Link>
        </nav>
        <Link to="/login" className="btn-header-login">로그인</Link>
      </div>
    </header>
  );
}

// ===== 시세 카드 1개 =====
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

// ===== 홈 - 시세 섹션 =====
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
        <Link to="/prices" className="section-more">전체보기 →</Link>
      </div>

      {priceData?.isFallback && (
        <p className="fallback-notice">⚠️ 이전 캐시 데이터를 표시 중입니다.</p>
      )}

      <div className="price-grid">
        {allItems.map((item, idx) => (
          <PriceCard key={idx} item={item} />
        ))}
      </div>

      <p className="price-source">
        출처: KAMIS 농산물유통정보 (소매가격) |
        {priceData?.updatedAt && (' ' + new Date(priceData.updatedAt).toLocaleString('ko-KR') + ' 기준')}
        <button onClick={onRefresh} className="btn-refresh-inline">🔄</button>
      </p>
    </section>
  );
}

// ===== 시세 전체보기 페이지 =====
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

// ===== 홈 - 게시판 미리보기 =====
function BoardPreview({ title, icon, posts, basePath }) {
  return (
    <section className="section-box board-preview">
      <div className="section-header">
        <h2 className="section-title">{icon} {title}</h2>
        <Link to={basePath} className="section-more">전체보기 →</Link>
      </div>
      <ul className="preview-list">
        {posts.map(post => (
          <li key={post.id}>
            <Link to={basePath + '/' + post.id} className="preview-link">
              <span className="preview-title">{post.title}</span>
              <span className="preview-date">{post.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ===== 홈 - HACCP 미리보기 =====
function HaccpPreview() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_BASE + '/api/haccp?pageNo=1&numOfRows=12');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="section-box">
      <div className="section-header">
        <h2 className="section-title">🏭 HACCP 인증업체</h2>
        <button className="section-more" onClick={() => navigate('/haccp')}>
          전체보기 →
        </button>
      </div>
      <div className="price-grid">
        {items.map((item, idx) => (
          <div className="price-card" key={idx}>
            <span className="haccp-badge">HACCP</span>
            <p className="card-name">{item.BSSH_NM}</p>
            <p className="card-unit">{item.INDUTY_NM}</p>
            <p className="card-rate rate-same">인증일 {item.HACCP_DESIG_DT}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ===== 게시판 목록 =====
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
              <tr key={post.id}
                onClick={() => navigate('/board/' + type + '/' + post.id)}
                className="board-row">
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

// ===== 게시글 상세 =====
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
          <div className="post-meta">
            <span>📅 {post.date}</span>
          </div>
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

// ===== 로그인 =====
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

// ===== 홈페이지 =====
function HomePage({ priceData, priceLoading, priceError, onPriceRefresh }) {
  return (
    <div className="page-wrapper">
      <PriceSection
        priceData={priceData}
        loading={priceLoading}
        error={priceError}
        onRefresh={onPriceRefresh}
      />

      <HaccpPreview />

      <div className="board-grid">
        <BoardPreview
          title="업계 뉴스"
          icon="📰"
          posts={DUMMY_NEWS}
          basePath="/board/news"
        />
        <BoardPreview
          title="자유게시판"
          icon="💬"
          posts={DUMMY_FREE}
          basePath="/board/free"
        />
      </div>
    </div>
  );
}

// ===== BoardWrapper =====
function BoardWrapper({ type, title }) {
  return (
    <Routes>
      <Route index element={<Board type={type} title={title} />} />
      <Route path=":id" element={<PostDetail type={type} />} />
    </Routes>
  );
}

// ===== App =====
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
          </Routes>
        </main>
        <footer className="app-footer">
          © 2026 식품업계 커뮤니티 | 식품 제조사와 장비 업체를 연결합니다
        </footer>
      </div>
    </Router>
  );
}

export default App;