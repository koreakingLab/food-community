import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

const API_BASE = 'https://food-community-production.up.railway.app';

const DUMMY_NEWS = [
  { id: 1, title: '2026년 식품 제조 트렌드 전망', author: '관리자', date: '2026-03-01', content: '올해 식품 제조 업계에서는 자동화와 친환경 패키징이 핵심 트렌드로...' },
  { id: 2, title: 'HACCP 인증 간소화 방안 발표', author: '관리자', date: '2026-02-28', content: '식약처에서 중소 식품 제조업체를 위한 HACCP 인증 간소화 방안을...' },
  { id: 3, title: '식품 원자재 가격 동향 리포트', author: '관리자', date: '2026-02-25', content: '최근 3개월간 주요 식품 원자재 가격 동향을 분석한 결과...' },
];

const DUMMY_FREE = [
  { id: 1, title: '소규모 식품 공장 창업 후기', author: '김사장', date: '2026-03-02', content: '작년에 소규모 식품 공장을 창업했는데, 경험담을 공유합니다...' },
  { id: 2, title: '포장기계 추천 부탁드립니다', author: '박과장', date: '2026-03-01', content: '월 생산량 5톤 정도 되는 소스류 제조하는데 적합한 포장기계...' },
  { id: 3, title: '식품 전시회 같이 가실 분?', author: '이대리', date: '2026-02-27', content: '다음 달 코엑스에서 열리는 식품 제조 장비 전시회 같이...' },
];

const DUMMY_COMMENTS = [
  { id: 1, postId: 1, author: '이대리', content: '좋은 정보 감사합니다!', date: '2026-03-02' },
  { id: 2, postId: 1, author: '박과장', content: '저도 관심 있어요', date: '2026-03-03' },
];

// ===== 헤더 =====
function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <h1 className="header-title">🏭 식품업계 커뮤니티</h1>
      </Link>
      <nav className="header-nav">
        <Link to="/board/news" className="nav-link">📰 업계뉴스</Link>
        <Link to="/board/free" className="nav-link">💬 자유게시판</Link>
        <Link to="/login" className="nav-login">로그인</Link>
      </nav>
    </header>
  );
}

// ===== 원자재 시세 (KAMIS API) =====
function PriceBoard({ priceData, loading, error, onRefresh }) {
  const getArrow = (direction) => {
    if (direction === 'up') return '▲';
    if (direction === 'down') return '▼';
    return '-';
  };

  const getRateClass = (direction) => {
    if (direction === 'up') return 'rate-up';
    if (direction === 'down') return 'rate-down';
    return 'rate-same';
  };

  if (loading) {
    return (
      <section className="price-section">
        <h2>📊 오늘의 원자재 시세</h2>
        <p className="loading-text">⏳ 시세 정보를 불러오는 중...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="price-section">
        <h2>📊 오늘의 원자재 시세</h2>
        <p className="error-text">⚠️ {error}</p>
        <button onClick={onRefresh} className="btn-refresh">다시 시도</button>
      </section>
    );
  }

  return (
    <section className="price-section">
      <div className="price-header">
        <h2>📊 오늘의 원자재 시세</h2>
        <div className="price-meta">
          {priceData?.updatedAt && (
            <span className="update-time">
              {new Date(priceData.updatedAt).toLocaleString('ko-KR')} 기준
            </span>
          )}
          <button onClick={onRefresh} className="btn-refresh-small">🔄 새로고침</button>
        </div>
      </div>

      {priceData?.isFallback && (
        <p className="fallback-notice">⚠️ 이전 캐시 데이터를 표시 중입니다.</p>
      )}

      <h3 className="category-title">🌾 곡물</h3>
      <table className="price-table">
        <thead>
          <tr>
            <th>품목</th>
            <th>품종</th>
            <th className="text-right">가격</th>
            <th className="text-center">단위</th>
            <th className="text-right">등락률</th>
          </tr>
        </thead>
        <tbody>
          {(priceData?.grains || []).map((item, idx) => (
            <tr key={'grain-' + idx}>
              <td className="td-name">{item.name}</td>
              <td className="td-kind">{item.kind}</td>
              <td className="text-right">{item.price}원</td>
              <td className="text-center">{item.unit}</td>
              <td className={'text-right ' + getRateClass(item.direction)}>
                {getArrow(item.direction)} {item.changeRate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="category-title">🍎 과일</h3>
      <table className="price-table">
        <thead>
          <tr>
            <th>품목</th>
            <th>품종</th>
            <th className="text-right">가격</th>
            <th className="text-center">단위</th>
            <th className="text-right">등락률</th>
          </tr>
        </thead>
        <tbody>
          {(priceData?.fruits || []).map((item, idx) => (
            <tr key={'fruit-' + idx}>
              <td className="td-name">{item.name}</td>
              <td className="td-kind">{item.kind}</td>
              <td className="text-right">{item.price}원</td>
              <td className="text-center">{item.unit}</td>
              <td className={'text-right ' + getRateClass(item.direction)}>
                {getArrow(item.direction)} {item.changeRate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="price-source">출처: KAMIS 농산물유통정보 (소매가격 기준)</p>
    </section>
  );
}

// ===== 게시판 =====
function Board({ type, title }) {
  const posts = type === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const navigate = useNavigate();

  return (
    <section className="board-section">
      <h2>{title}</h2>
      <table className="board-table">
        <thead>
          <tr>
            <th className="col-id">번호</th>
            <th>제목</th>
            <th className="col-author">작성자</th>
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
              <td className="text-center">{post.author}</td>
              <td className="text-center">{post.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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

  if (!post) return <div className="board-section">게시글을 찾을 수 없습니다.</div>;

  return (
    <article className="board-section">
      <button onClick={() => navigate(-1)} className="btn-back">← 목록으로</button>
      <div className="post-detail">
        <h2>{post.title}</h2>
        <div className="post-meta">
          <span>✍️ {post.author}</span>
          <span>📅 {post.date}</span>
        </div>
        <hr />
        <p className="post-content">{post.content}</p>
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
    <div className="home-page">
      <PriceBoard
        priceData={priceData}
        loading={priceLoading}
        error={priceError}
        onRefresh={onPriceRefresh}
      />
      <div className="home-boards">
        <section className="home-board-card">
          <h3>📰 최신 업계뉴스</h3>
          {DUMMY_NEWS.slice(0, 3).map(post => (
            <Link key={post.id} to={'/board/news/' + post.id} className="home-post-link">
              <div className="home-post-item">
                <p className="home-post-title">{post.title}</p>
                <span className="home-post-date">{post.date}</span>
              </div>
            </Link>
          ))}
        </section>
        <section className="home-board-card">
          <h3>💬 최신 자유게시판</h3>
          {DUMMY_FREE.slice(0, 3).map(post => (
            <Link key={post.id} to={'/board/free/' + post.id} className="home-post-link">
              <div className="home-post-item">
                <p className="home-post-title">{post.title}</p>
                <span className="home-post-date">{post.date} | {post.author}</span>
              </div>
            </Link>
          ))}
        </section>
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
      setPriceError('시세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <HomePage
                priceData={priceData}
                priceLoading={priceLoading}
                priceError={priceError}
                onPriceRefresh={fetchPrices}
              />
            } />
            <Route path="/board/news/*" element={<BoardWrapper type="news" title="📰 업계뉴스" />} />
            <Route path="/board/free/*" element={<BoardWrapper type="free" title="💬 자유게시판" />} />
            <Route path="/login" element={<LoginPage />} />
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