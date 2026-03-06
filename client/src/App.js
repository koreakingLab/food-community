import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

// ===== API 서버 주소 =====
const API_BASE = 'https://food-community-production.up.railway.app';

// ===== 더미 데이터 (뉴스, 자유게시판, 댓글) =====
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

// ===== 헤더 컴포넌트 =====
function Header() {
  return (
    <header style=
      background: 'linear-gradient(135deg, #1a5276, #2e86c1)',
      color: 'white',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    >
      <Link to="/" style= textDecoration: 'none', color: 'white' >
        <h1 style= margin: 0, fontSize: '1.5rem' >🏭 식품업계 커뮤니티</h1>
      </Link>
      <nav style= display: 'flex', gap: '20px', alignItems: 'center' >
        <Link to="/board/news" style= color: 'white', textDecoration: 'none' >📰 업계뉴스</Link>
        <Link to="/board/free" style= color: 'white', textDecoration: 'none' >💬 자유게시판</Link>
        <Link to="/login" style=
          color: 'white',
          textDecoration: 'none',
          background: 'rgba(255,255,255,0.2)',
          padding: '6px 15px',
          borderRadius: '20px'
        >로그인</Link>
      </nav>
    </header>
  );
}

// ===== 원자재 시세 컴포넌트 (KAMIS API 연동) =====
function PriceBoard({ priceData, loading, error, onRefresh }) {

  // 등락률 색상
  const getRateColor = (direction) => {
    if (direction === 'up') return '#e74c3c';    // 상승 = 빨강
    if (direction === 'down') return '#2e86c1';  // 하락 = 파랑
    return '#7f8c8d';                             // 보합 = 회색
  };

  // 등락 화살표
  const getArrow = (direction) => {
    if (direction === 'up') return '▲';
    if (direction === 'down') return '▼';
    return '-';
  };

  if (loading) {
    return (
      <section style= background: '#f8f9fa', padding: '25px', borderRadius: '12px', margin: '20px 0' >
        <h2 style= marginTop: 0 >📊 오늘의 원자재 시세</h2>
        <p style= textAlign: 'center', color: '#7f8c8d', padding: '30px 0' >
          ⏳ 시세 정보를 불러오는 중...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section style= background: '#f8f9fa', padding: '25px', borderRadius: '12px', margin: '20px 0' >
        <h2 style= marginTop: 0 >📊 오늘의 원자재 시세</h2>
        <p style= textAlign: 'center', color: '#e74c3c', padding: '20px 0' >
          ⚠️ {error}
        </p>
        <div style= textAlign: 'center' >
          <button onClick={onRefresh} style=
            padding: '8px 20px', background: '#2e86c1', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer'
          >다시 시도</button>
        </div>
      </section>
    );
  }

  const allItems = [...(priceData?.grains || []), ...(priceData?.fruits || [])];

  return (
    <section style= background: '#f8f9fa', padding: '25px', borderRadius: '12px', margin: '20px 0' >
      <div style= display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' >
        <h2 style= margin: 0 >📊 오늘의 원자재 시세</h2>
        <div style= display: 'flex', alignItems: 'center', gap: '10px' >
          {priceData?.updatedAt && (
            <span style= fontSize: '0.8rem', color: '#95a5a6' >
              {new Date(priceData.updatedAt).toLocaleString('ko-KR')} 기준
            </span>
          )}
          <button onClick={onRefresh} style=
            padding: '5px 12px', background: '#ecf0f1', border: '1px solid #bdc3c7',
            borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
          >🔄 새로고침</button>
        </div>
      </div>

      {priceData?.isFallback && (
        <p style= background: '#fff3cd', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', color: '#856404' >
          ⚠️ 이전 캐시 데이터를 표시 중입니다.
        </p>
      )}

      {/* 곡물 시세 */}
      <h3 style= margin: '15px 0 10px', color: '#1a5276' >🌾 곡물</h3>
      <table style= width: '100%', borderCollapse: 'collapse', marginBottom: '20px' >
        <thead>
          <tr style= background: '#2e86c1', color: 'white' >
            <th style= padding: '10px', textAlign: 'left' >품목</th>
            <th style= padding: '10px', textAlign: 'left' >품종</th>
            <th style= padding: '10px', textAlign: 'right' >가격</th>
            <th style= padding: '10px', textAlign: 'center' >단위</th>
            <th style= padding: '10px', textAlign: 'right' >등락률</th>
          </tr>
        </thead>
        <tbody>
          {(priceData?.grains || []).map((item, idx) => (
            <tr key={`grain-${idx}`} style= borderBottom: '1px solid #ecf0f1' >
              <td style= padding: '10px', fontWeight: 'bold' >{item.name}</td>
              <td style= padding: '10px', color: '#7f8c8d', fontSize: '0.9rem' >{item.kind}</td>
              <td style= padding: '10px', textAlign: 'right', fontWeight: 'bold' >{item.price}원</td>
              <td style= padding: '10px', textAlign: 'center', color: '#95a5a6', fontSize: '0.85rem' >{item.unit}</td>
              <td style= padding: '10px', textAlign: 'right', color: getRateColor(item.direction), fontWeight: 'bold' >
                {getArrow(item.direction)} {item.changeRate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 과일 시세 */}
      <h3 style= margin: '15px 0 10px', color: '#1a5276' >🍎 과일</h3>
      <table style= width: '100%', borderCollapse: 'collapse' >
        <thead>
          <tr style= background: '#e74c3c', color: 'white' >
            <th style= padding: '10px', textAlign: 'left' >품목</th>
            <th style= padding: '10px', textAlign: 'left' >품종</th>
            <th style= padding: '10px', textAlign: 'right' >가격</th>
            <th style= padding: '10px', textAlign: 'center' >단위</th>
            <th style= padding: '10px', textAlign: 'right' >등락률</th>
          </tr>
        </thead>
        <tbody>
          {(priceData?.fruits || []).map((item, idx) => (
            <tr key={`fruit-${idx}`} style= borderBottom: '1px solid #ecf0f1' >
              <td style= padding: '10px', fontWeight: 'bold' >{item.name}</td>
              <td style= padding: '10px', color: '#7f8c8d', fontSize: '0.9rem' >{item.kind}</td>
              <td style= padding: '10px', textAlign: 'right', fontWeight: 'bold' >{item.price}원</td>
              <td style= padding: '10px', textAlign: 'center', color: '#95a5a6', fontSize: '0.85rem' >{item.unit}</td>
              <td style= padding: '10px', textAlign: 'right', color: getRateColor(item.direction), fontWeight: 'bold' >
                {getArrow(item.direction)} {item.changeRate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style= textAlign: 'right', color: '#95a5a6', fontSize: '0.75rem', marginTop: '10px', marginBottom: 0 >
        출처: KAMIS 농산물유통정보 (소매가격 기준)
      </p>
    </section>
  );
}

// ===== 게시판 컴포넌트 =====
function Board({ type, title }) {
  const posts = type === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const navigate = useNavigate();

  return (
    <section style= padding: '20px' >
      <h2>{title}</h2>
      <table style= width: '100%', borderCollapse: 'collapse' >
        <thead>
          <tr style= background: '#f8f9fa', borderBottom: '2px solid #2e86c1' >
            <th style= padding: '10px', width: '60px' >번호</th>
            <th style= padding: '10px', textAlign: 'left' >제목</th>
            <th style= padding: '10px', width: '100px' >작성자</th>
            <th style= padding: '10px', width: '120px' >날짜</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id}
              onClick={() => navigate(`/board/${type}/${post.id}`)}
              style= borderBottom: '1px solid #ecf0f1', cursor: 'pointer' 
              onMouseOver={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}>
              <td style= padding: '10px', textAlign: 'center' >{post.id}</td>
              <td style= padding: '10px' >{post.title}</td>
              <td style= padding: '10px', textAlign: 'center' >{post.author}</td>
              <td style= padding: '10px', textAlign: 'center' >{post.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ===== 게시글 상세 컴포넌트 =====
function PostDetail({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const posts = type === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const post = posts.find(p => p.id === parseInt(id));
  const comments = DUMMY_COMMENTS.filter(c => c.postId === parseInt(id));
  const [newComment, setNewComment] = useState('');

  if (!post) return <div style= padding: '20px' >게시글을 찾을 수 없습니다.</div>;

  return (
    <article style= padding: '20px', maxWidth: '800px', margin: '0 auto' >
      <button onClick={() => navigate(-1)} style=
        background: 'none', border: 'none', color: '#2e86c1',
        cursor: 'pointer', fontSize: '1rem', marginBottom: '15px'
      >← 목록으로</button>

      <div style= background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' >
        <h2 style= marginTop: 0 >{post.title}</h2>
        <div style= display: 'flex', gap: '15px', color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '20px' >
          <span>✍️ {post.author}</span>
          <span>📅 {post.date}</span>
        </div>
        <hr style= border: 'none', borderTop: '1px solid #ecf0f1'  />
        <p style= lineHeight: '1.8', color: '#2c3e50' >{post.content}</p>
      </div>

      {/* 댓글 영역 */}
      <div style= marginTop: '25px' >
        <h3>💬 댓글 ({comments.length})</h3>
        {comments.map(c => (
          <div key={c.id} style=
            background: '#f8f9fa', padding: '12px 15px',
            borderRadius: '8px', marginBottom: '10px'
          >
            <div style= display: 'flex', justifyContent: 'space-between', marginBottom: '5px' >
              <strong>{c.author}</strong>
              <span style= color: '#95a5a6', fontSize: '0.85rem' >{c.date}</span>
            </div>
            <p style= margin: 0 >{c.content}</p>
          </div>
        ))}
        <div style= display: 'flex', gap: '10px', marginTop: '15px' >
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            style=
              flex: 1, padding: '10px 15px', borderRadius: '8px',
              border: '1px solid #ddd', fontSize: '0.95rem'
            
          />
          <button style=
            padding: '10px 20px', background: '#2e86c1', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer'
          >등록</button>
        </div>
      </div>
    </article>
  );
}

// ===== 로그인 페이지 =====
function LoginPage() {
  return (
    <div style=
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '60vh'
    >
      <div style=
        background: 'white', padding: '40px', borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '350px'
      >
        <h2 style= textAlign: 'center', marginTop: 0 >🔐 로그인</h2>
        <input type="text" placeholder="아이디" style=
          width: '100%', padding: '12px', marginBottom: '10px',
          borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box'
         />
        <input type="password" placeholder="비밀번호" style=
          width: '100%', padding: '12px', marginBottom: '20px',
          borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box'
         />
        <button style=
          width: '100%', padding: '12px', background: '#2e86c1',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '1rem', cursor: 'pointer'
        >로그인</button>
        <p style= textAlign: 'center', marginTop: '15px', color: '#7f8c8d' >
          아직 회원이 아니신가요? <a href="#" style= color: '#2e86c1' >회원가입</a>
        </p>
      </div>
    </div>
  );
}

// ===== 홈페이지 =====
function HomePage({ priceData, priceLoading, priceError, onPriceRefresh }) {
  return (
    <div style= padding: '20px' >
      {/* 원자재 시세 */}
      <PriceBoard
        priceData={priceData}
        loading={priceLoading}
        error={priceError}
        onRefresh={onPriceRefresh}
      />

      {/* 최신 게시글 미리보기 */}
      <div style= display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' >
        <section style= background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' >
          <h3 style= marginTop: 0 >📰 최신 업계뉴스</h3>
          {DUMMY_NEWS.slice(0, 3).map(post => (
            <Link key={post.id} to={`/board/news/${post.id}`} style= textDecoration: 'none', color: '#2c3e50' >
              <div style= padding: '8px 0', borderBottom: '1px solid #f0f0f0' >
                <p style= margin: '2px 0', fontSize: '0.95rem' >{post.title}</p>
                <span style= color: '#95a5a6', fontSize: '0.8rem' >{post.date}</span>
              </div>
            </Link>
          ))}
        </section>

        <section style= background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' >
          <h3 style= marginTop: 0 >💬 최신 자유게시판</h3>
          {DUMMY_FREE.slice(0, 3).map(post => (
            <Link key={post.id} to={`/board/free/${post.id}`} style= textDecoration: 'none', color: '#2c3e50' >
              <div style= padding: '8px 0', borderBottom: '1px solid #f0f0f0' >
                <p style= margin: '2px 0', fontSize: '0.95rem' >{post.title}</p>
                <span style= color: '#95a5a6', fontSize: '0.8rem' >{post.date} | {post.author}</span>
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

// ===== 메인 App 컴포넌트 =====
function App() {
  const [priceData, setPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);

  // KAMIS 시세 데이터 가져오기
  const fetchPrices = async () => {
    setPriceLoading(true);
    setPriceError(null);
    try {
      const response = await fetch(`${API_BASE}/api/kamis/prices`);
      if (!response.ok) throw new Error('서버 응답 오류');
      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.error || '데이터를 가져오지 못했습니다');
      }

      setPriceData(data);
    } catch (err) {
      console.error('시세 조회 실패:', err);
      setPriceError('시세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setPriceLoading(false);
    }
  };

  // 최초 로딩 시 시세 가져오기
  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <Router>
      <div style= minHeight: '100vh', background: '#f0f2f5' >
        <Header />
        <main style= maxWidth: '1100px', margin: '0 auto', padding: '20px' >
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

        <footer style=
          textAlign: 'center', padding: '20px',
          color: '#95a5a6', fontSize: '0.85rem', marginTop: '40px'
        >
          © 2026 식품업계 커뮤니티 | 식품 제조사와 장비 업체를 연결합니다
        </footer>
      </div>
    </Router>
  );
}

export default App;