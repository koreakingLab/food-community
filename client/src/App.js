import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';

// ===== 설정 =====
// Railway 백엔드 주소 (본인 주소로 변경하세요)
const API_BASE = 'https://food-community-production.up.railway.app';

// ===== 더미 데이터 (뉴스, 자유게시판, 댓글 — 나중에 DB 연동 시 교체) =====
const DUMMY_NEWS = [
  { id: 1, title: '[속보] 식약처, HACCP 인증기준 개정안 발표', nickname: '관리자', company_name: '식품안전뉴스', created_at: '2026-03-04T09:00:00', views: 342, comment_count: 12, content: '식품의약품안전처는 3월 4일 HACCP 인증기준 개정안을 발표했습니다. 주요 변경사항으로는 소규모 업체에 대한 인증 절차 간소화, AI 기반 모니터링 시스템 도입 의무화 등이 포함되어 있습니다.\n\n특히 연매출 1억 미만 소규모 식품제조업체의 경우, 기존 7단계였던 인증 절차가 4단계로 줄어들어 행정 부담이 크게 감소할 것으로 예상됩니다.' },
  { id: 2, title: '2026년 식품산업 트렌드: AI 품질관리 도입 급증', nickname: '푸드테크저널', company_name: '', created_at: '2026-03-03T14:30:00', views: 289, comment_count: 8, content: '올해 식품 제조업계에서 가장 눈에 띄는 변화는 AI 기반 품질관리 시스템의 도입입니다.\n\n대기업뿐만 아니라 중소 제조업체에서도 이미지 인식을 활용한 불량 검출, 공정 데이터 분석을 통한 최적 조건 예측 등을 적극 도입하고 있습니다.' },
  { id: 3, title: '밀가루 가격 3개월 연속 상승세...제빵업계 비상', nickname: '곡물시황', company_name: 'aT한국농수산식품유통공사', created_at: '2026-03-02T11:00:00', views: 567, comment_count: 23, content: '국제 밀 가격 상승의 영향으로 국내 밀가루 가격이 3개월 연속 오름세를 보이고 있습니다.\n\n특히 강력분의 경우 지난 1월 대비 약 4.2% 상승하면서 제빵·제과 업계의 원가 부담이 가중되고 있습니다.' },
  { id: 4, title: '중소기업 식품공장 설비지원 사업 공고 (2026년 상반기)', nickname: '정책알리미', company_name: '중소벤처기업부', created_at: '2026-03-01T10:00:00', views: 892, comment_count: 45, content: '중소벤처기업부에서 2026년 상반기 식품제조 중소기업을 위한 설비지원 사업을 공고했습니다.\n\n지원 대상: 연매출 50억 이하 식품제조업체\n지원 규모: 업체당 최대 5천만원 (매칭 50%)\n접수 기간: 2026년 3월 15일 ~ 4월 15일' },
  { id: 5, title: '친환경 포장재 의무화 로드맵 발표...2028년부터 단계적 시행', nickname: '환경부', company_name: '', created_at: '2026-02-28T16:00:00', views: 445, comment_count: 31, content: '환경부는 식품 포장재에 대한 친환경 의무화 로드맵을 발표했습니다.\n\n2028년부터 대기업, 2029년부터 중소기업 순으로 생분해성 포장재 사용 비율을 단계적으로 확대할 예정입니다.' },
];

const DUMMY_FREE = [
  { id: 101, title: '소규모 소스 제조 시작하려는데 조언 부탁드립니다', nickname: '소스초보', company_name: '', created_at: '2026-03-04T08:30:00', views: 156, comment_count: 7, content: '안녕하세요, 소규모로 소스 제조를 시작하려고 합니다.\n\n현재 즉석판매제조가공업으로 등록하려고 하는데, 처음이라 어디서부터 시작해야 할지 모르겠습니다.\n\n1. 필요한 설비 목록\n2. 인허가 절차\n3. 예상 비용\n\n경험 있으신 분들 조언 부탁드립니다!' },
  { id: 102, title: '충전기 추천 부탁합니다 (소스류, 시간당 500병)', nickname: '맛있는공장', company_name: '(주)맛있는식품', created_at: '2026-03-03T15:20:00', views: 234, comment_count: 15, content: '소스류 충전기를 구매하려고 합니다.\n\n요구 사항:\n- 시간당 500병 이상\n- 500ml ~ 1L 용량 대응\n- 점도가 있는 소스 (케찹, 불고기소스 등)\n- 예산: 3000만원 이내\n\n사용해보신 장비 추천 부탁드립니다.' },
  { id: 103, title: '식품공장 여름철 온도관리 팁 공유합니다', nickname: '위생관리사K', company_name: '한국식품위생연구원', created_at: '2026-03-02T12:00:00', views: 423, comment_count: 19, content: '곧 여름이 다가오는데, 식품공장 온도관리 팁을 공유합니다.\n\n1. 작업장 온도: 25°C 이하 유지\n2. 원료 입고 시 즉시 냉장/냉동 보관\n3. 에어커튼 설치 (출입구)\n4. 온도 모니터링 자동화\n5. 직원 위생교육 강화' },
  { id: 104, title: 'OEM 제조 맡길 수 있는 업체 찾습니다 (건강기능식품)', nickname: '헬스브랜드', company_name: '', created_at: '2026-03-01T09:45:00', views: 312, comment_count: 22, content: '건강기능식품 OEM 제조를 맡길 수 있는 업체를 찾고 있습니다.\n\n제품: 비타민 젤리 (구미형)\n수량: 월 10,000개\nGMP 인증 필수\n\n견적 및 상담 가능한 업체 연락 부탁드립니다.' },
  { id: 105, title: '라벨 프린터 자동화 후기 (비용 50% 절감)', nickname: '스마트팩토리', company_name: '(주)그린푸드', created_at: '2026-02-28T14:00:00', views: 567, comment_count: 28, content: '라벨 프린터를 수동에서 자동으로 바꾸고 나서 후기 공유합니다.\n\n기존: 직원 2명이 하루 8시간 수작업\n변경: 자동 라벨링 머신 도입\n결과: 인건비 50% 절감, 불량률 90% 감소\n\n도입 비용은 약 1,500만원이었고 6개월 만에 투자금 회수했습니다.' },
];

const DUMMY_COMMENTS = {
  1: [
    { id: 1, nickname: '식품안전전문가', company_name: 'HACCP컨설팅', content: '소규모 업체 인증 간소화는 정말 환영할 만한 변화네요!', created_at: '2026-03-04T10:30:00' },
    { id: 2, nickname: '공장장이반', company_name: '(주)맛나식품', content: 'AI 모니터링 의무화 비용이 부담될 수 있을 것 같습니다. 지원 사업이 있으면 좋겠네요.', created_at: '2026-03-04T11:15:00' },
  ],
  101: [
    { id: 3, nickname: '소스마스터', company_name: '대한소스', content: '즉석판매제조가공업으로 시작하시는 게 맞습니다. 관할 보건소에 먼저 상담 받아보세요!', created_at: '2026-03-04T09:00:00' },
    { id: 4, nickname: '설비전문가', company_name: '한국식품기계', content: '소규모라면 초기에 스테인리스 솥(100L급) + 소형 충전기 정도면 시작 가능합니다. 예산 약 2000만원 내외입니다.', created_at: '2026-03-04T10:00:00' },
    { id: 5, nickname: '위생관리사K', company_name: '한국식품위생연구원', content: '인허가 관련해서는 식품위생법 시행규칙 별표14를 참고하시면 시설기준이 나와있습니다.', created_at: '2026-03-04T11:30:00' },
  ],
};

// ===== 헤더 =====
function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">🏭 식품업계 커뮤니티</Link>
        <nav className="nav">
          <Link to="/prices">📊 원자재 시세</Link>
          <Link to="/board/news">📰 업계 뉴스</Link>
          <Link to="/board/free">💬 자유게시판</Link>
        </nav>
        <div className="auth-area">
          <Link to="/login" className="btn-login">로그인</Link>
        </div>
      </div>
    </header>
  );
}

// ===== 원자재 시세 (KAMIS API 연동) =====
function PriceBoard({ priceData, loading, error, onRefresh }) {
  if (loading) {
    return (
      <div className="price-board">
        <h2>📊 오늘의 원자재 시세</h2>
        <p style= textAlign: 'center', padding: '40px' >🔄 KAMIS에서 가격 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-board">
        <h2>📊 오늘의 원자재 시세</h2>
        <p style= textAlign: 'center', padding: '40px', color: '#e74c3c' >
          ❌ {error}
        </p>
        <button onClick={onRefresh} style= display: 'block', margin: '0 auto', padding: '8px 20px', cursor: 'pointer' >
          🔄 다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="price-board">
      <div style= display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' >
        <h2>📊 오늘의 원자재 시세</h2>
        <button onClick={onRefresh} style= padding: '4px 12px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' >
          🔄 새로고침
        </button>
      </div>
      {priceData.updatedAt && (
        <p className="price-date">기준: {new Date(priceData.updatedAt).toLocaleString('ko-KR')}</p>
      )}

      {/* 곡물 (식량작물) */}
      {priceData.grains && priceData.grains.length > 0 && (
        <div className="price-category">
          <h3>🌾 곡물 (식량작물)</h3>
          <table className="price-table">
            <thead>
              <tr><th>품목</th><th>품종</th><th>가격</th><th>단위</th><th>등락률</th></tr>
            </thead>
            <tbody>
              {priceData.grains.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td className="price-value">{item.price}</td>
                  <td>{item.unit}</td>
                  <td className={`change ${getChangeClass(item.changeRate)}`}>
                    {item.changeRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 과일 */}
      {priceData.fruits && priceData.fruits.length > 0 && (
        <div className="price-category">
          <h3>🍎 과일</h3>
          <table className="price-table">
            <thead>
              <tr><th>품목</th><th>품종</th><th>가격</th><th>단위</th><th>등락률</th></tr>
            </thead>
            <tbody>
              {priceData.fruits.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td className="price-value">{item.price}</td>
                  <td>{item.unit}</td>
                  <td className={`change ${getChangeClass(item.changeRate)}`}>
                    {item.changeRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 등락률 CSS 클래스
function getChangeClass(rate) {
  if (typeof rate === 'string') {
    if (rate.startsWith('+')) return 'up';
    if (rate.startsWith('-')) return 'down';
  }
  return '';
}

// ===== 게시판 =====
function Board({ boardType }) {
  const navigate = useNavigate();
  const posts = boardType === 'news' ? DUMMY_NEWS : DUMMY_FREE;
  const boardNames = { free: '💬 자유게시판', news: '📰 업계 뉴스' };

  return (
    <div className="board">
      <div className="board-header">
        <h2>{boardNames[boardType]}</h2>
        <button className="btn-write" onClick={() => alert('로그인이 필요합니다.')}>✏️ 글쓰기</button>
      </div>
      <table className="board-table">
        <thead>
          <tr>
            <th className="col-no">번호</th>
            <th className="col-title">제목</th>
            <th className="col-author">작성자</th>
            <th className="col-date">작성일</th>
            <th className="col-views">조회</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="post-row">
              <td>{post.id}</td>
              <td className="post-title">
                {post.title}
                {post.comment_count > 0 && <span className="comment-count">{"[" + post.comment_count + "]"}</span>}
              </td>
              <td>
                {post.nickname}
                {post.company_name && <span className="company">({post.company_name})</span>}
              </td>
              <td>{new Date(post.created_at).toLocaleDateString('ko-KR')}</td>
              <td>{post.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== 게시글 상세 =====
function PostDetail() {
  const postId = parseInt(window.location.pathname.split('/').pop());
  const allPosts = [...DUMMY_NEWS, ...DUMMY_FREE];
  const post = allPosts.find(p => p.id === postId);
  const comments = DUMMY_COMMENTS[postId] || [];

  if (!post) return <div className="loading">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="post-detail">
      <div className="post-header">
        <h2>{post.title}</h2>
        <div className="post-meta">
          <span>{post.nickname}</span>
          {post.company_name && <span className="company">({post.company_name})</span>}
          <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
          <span>조회 {post.views}</span>
        </div>
      </div>
      <div className="post-content">
        {post.content.split('\n').map((line, i) => (
          <p key={i}>{line || <br/>}</p>
        ))}
      </div>
      <div className="comments-section">
        <h3>💬 댓글 ({comments.length})</h3>
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-meta">
              <strong>{comment.nickname}</strong>
              {comment.company_name && <span>({comment.company_name})</span>}
              <span>{new Date(comment.created_at).toLocaleString('ko-KR')}</span>
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
        <div className="comment-form">
          <textarea placeholder="댓글을 입력하세요... (로그인 필요)" disabled />
          <button onClick={() => alert('로그인이 필요합니다.')}>댓글 작성</button>
        </div>
      </div>
    </div>
  );
}

// ===== 로그인 =====
function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="login-page">
      <h2>{isRegister ? '회원가입' : '로그인'}</h2>
      <form onSubmit={(e) => { e.preventDefault(); alert('데모 버전에서는 로그인이 지원되지 않습니다.'); }}>
        <input type="email" placeholder="이메일" required />
        <input type="password" placeholder="비밀번호" required />
        {isRegister && (
          <>
            <input placeholder="닉네임" required />
            <input placeholder="회사명 (선택)" />
            <select>
              <option value="manufacturer">식품 제조업체</option>
              <option value="supplier">장비/원료 공급업체</option>
              <option value="other">기타</option>
            </select>
          </>
        )}
        <button type="submit" className="btn-submit">
          {isRegister ? '가입하기' : '로그인'}
        </button>
      </form>
      <button className="toggle-auth" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
      </button>
    </div>
  );
}

// ===== 홈페이지 (KAMIS 데이터 미리보기 포함) =====
function HomePage({ priceData, priceLoading }) {
  const navigate = useNavigate();

  // API 데이터를 홈 미리보기용 포맷으로 변환
  const previewItems = [];
  if (priceData.grains) {
    priceData.grains.slice(0, 4).forEach(item => {
      previewItems.push({
        id: `grain-${item.name}`,
        item_name: `${item.name} (${item.kind})`,
        price: item.price,
        unit: item.unit,
        changeRate: item.changeRate,
      });
    });
  }
  if (priceData.fruits) {
    priceData.fruits.slice(0, 4).forEach(item => {
      previewItems.push({
        id: `fruit-${item.name}`,
        item_name: `${item.name} (${item.kind})`,
        price: item.price,
        unit: item.unit,
        changeRate: item.changeRate,
      });
    });
  }

  return (
    <div className="homepage">
      <section className="section">
        <div className="section-header">
          <h2>📊 오늘의 원자재 시세</h2>
          <Link to="/prices">전체보기 →</Link>
        </div>
        <div className="price-preview">
          {priceLoading ? (
            <p style= padding: '20px', textAlign: 'center' >🔄 불러오는 중...</p>
          ) : previewItems.length > 0 ? (
            previewItems.map(item => (
              <div key={item.id} className="price-card">
                <div className="price-item-name">{item.item_name}</div>
                <div className="price-value">{item.price} {item.unit}</div>
                <div className={`change ${getChangeClass(item.changeRate)}`}>
                  {item.changeRate}
                </div>
              </div>
            ))
          ) : (
            <p style= padding: '20px', textAlign: 'center' >가격 정보를 불러오지 못했습니다.</p>
          )}
        </div>
      </section>

      <div className="board-previews">
        <section className="section">
          <div className="section-header">
            <h2>📰 업계 뉴스</h2>
            <Link to="/board/news">전체보기 →</Link>
          </div>
          <ul className="post-list">
            {DUMMY_NEWS.slice(0, 5).map(post => (
              <li key={post.id} onClick={() => navigate(`/post/${post.id}`)}>
                <span className="post-title">{post.title}</span>
                <span className="post-date">{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="section">
          <div className="section-header">
            <h2>💬 자유게시판</h2>
            <Link to="/board/free">전체보기 →</Link>
          </div>
          <ul className="post-list">
            {DUMMY_FREE.slice(0, 5).map(post => (
              <li key={post.id} onClick={() => navigate(`/post/${post.id}`)}>
                <span className="post-title">{post.title}</span>
                <span className="post-date">{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

// ===== 라우터 래퍼 =====
function BoardWrapper() {
  const type = window.location.pathname.split('/').pop();
  return <Board boardType={type} />;
}

// ===== 메인 App =====
function App() {
  const [priceData, setPriceData] = useState({ grains: [], fruits: [] });
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);

  const fetchPrices = () => {
    setPriceLoading(true);
    setPriceError(null);
    fetch(`${API_BASE}/api/kamis/prices`)
      .then(res => {
        if (!res.ok) throw new Error('서버 응답 오류');
        return res.json();
      })
      .then(data => {
        setPriceData(data);
        setPriceLoading(false);
      })
      .catch(err => {
        console.error('KAMIS 가격 로딩 실패:', err);
        setPriceError('가격 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        setPriceLoading(false);
      });
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <Router>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage priceData={priceData} priceLoading={priceLoading} />} />
          <Route path="/prices" element={<PriceBoard priceData={priceData} loading={priceLoading} error={priceError} onRefresh={fetchPrices} />} />
          <Route path="/board/:type" element={<BoardWrapper />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;