import HaccpList from './pages/HaccpList';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import SignupPage from './pages/SignupPage';
import SmartNotices from './SmartNotices';
import SmartNoticeDetail from './SmartNoticeDetail';
import useCachedFetch from './hooks/useCachedFetch';
import {
  IconFactory, IconActivity, IconHome, IconNewspaper,
  IconShield, IconMessage, IconPen, IconUser,
  IconCalendar, IconEye, IconLock, IconLogout
} from './components/Icons';

const API_BASE = 'https://food-community-production.up.railway.app';

const DUMMY_NEWS = [
  { id: 1, title: '[속보] 식약처, HACCP 인증기준 개정안 발표… 소규모 업체 부담 완화', date: '2026. 3. 10.' },
  { id: 2, title: '2026년 식품산업 트렌드: AI 품질관리 도입 급증', date: '2026. 3. 8.' },
  { id: 3, title: '밀가루 가격 3개월 연속 상승세… 제빵업계 비상', date: '2026. 3. 7.' },
  { id: 4, title: '친환경 포장재 의무화 로드맵 발표, 2028년부터 단계적 시행', date: '2026. 3. 5.' },
  { id: 5, title: '중소 식품기업 수출 지원 확대… 해외 인증비 최대 80% 지원', date: '2026. 3. 3.' },
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

// ========================================
// AuthContext — 인증 상태 관리
// ========================================
const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://food-community-production.up.railway.app';

  // 앱 시작 시 저장된 토큰으로 사용자 정보 복원
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // 401 응답 시 자동 로그아웃
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401 && token) {
        logout();
        window.location.href = '/login';
      }
      return res;
    };
    return () => { window.fetch = originalFetch; };
  }, [token]);

  // 로그인
  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '로그인에 실패했습니다.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value= {{user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 커스텀 훅
function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// ========================================
// Header 컴포넌트 (로그인 상태 연동)
// ========================================
function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
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
          {user ? (
            <div className="user-menu-wrapper" ref={menuRef}>
              <button
                className="user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0) : user.username.charAt(0)}
                </div>
                <span className="user-name">{user.name || user.username}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4.5l3 3 3-3"/>
                </svg>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-info">
                    <strong>{user.name || user.username}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="user-dropdown-divider"></div>
                  <button onClick={() => { navigate('/mypage'); setShowUserMenu(false); }}>
                    마이페이지
                  </button>
                  <button onClick={handleLogout} className="logout-btn">
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">로그인</Link>
              <Link to="/signup" className="btn-signup">회원가입</Link>
            </>
          )}
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

/* ===== 슬라이드 배너 (⑧ API 연동 + 폴백) ===== */
const FALLBACK_SLIDES = [
  { label: '스마트제조 지원사업', title: '식품제조업체를 위한 최신 지원사업 공고를 확인하세요', meta: '지원사업 전체보기에서 상세 내용을 확인할 수 있습니다', link: '/smart-notices' }
];

function SlideBanner() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(API_BASE + '/api/smart-notices?page=1&limit=3');
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
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="slide-banner">
      <div className="slide-content">
        <div className="slide-label">{slides[current].label}</div>
        <div className="slide-title">{slides[current].title}</div>
        <div className="slide-meta">{slides[current].meta}</div>
      </div>
      <div className="slide-actions">
        <Link to={slides[current].link} className="slide-btn">자세히 보기 →</Link>
        {slides.length > 1 && (
          <div className="slide-nav">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={'slide-dot' + (idx === current ? ' active' : '')}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
        )}
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
  const { data, loading } = useCachedFetch(
    API_BASE + '/api/posts?board_type=free&limit=5'
  );
  const posts = data?.posts || [];

  if (loading && posts.length === 0) {
    return <p className="loading-message">불러오는 중...</p>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconMessage /> 자유게시판</div>
        <Link to="/board/free" className="card-more">전체보기 →</Link>
      </div>
        <ul className="board-list">
          {posts.map(post => (
            <li key={post.id} className="board-item">
              <div className="board-title-wrap">
                <Link to={'/board/free/' + post.id} className="board-title-text">{post.title}</Link>
                {post.comment_count > 0 && <span className="board-comment">[{post.comment_count}]</span>}
              </div>
              <span className="board-date">
                {new Date(post.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
              </span>
            </li>
          ))}
          {posts.length === 0 && (
            <li className="board-item">
              <span className="board-title-text text-muted">게시글이 없습니다.</span>
            </li>
          )}
        </ul>
    </div>
  );
}

/* ===== 게시판 목록 (전체 페이지) ===== */
function Board({ type, title }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(API_BASE + '/api/posts?board_type=' + type + '&page=' + page + '&limit=20')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPosts(json.posts);
          setTotalPages(json.totalPages);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [type, page]);

  return (
    <div className="main">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {type === 'news' ? <IconNewspaper /> : <IconMessage />} {title}
          </div>
          {type === 'free' && (
            <button onClick={() => navigate('/write/free')} className="btn-write-small"><IconPen /> 글쓰기</button>
          )}
        </div>
        {loading ? (
          <p className="loading-message">불러오는 중...</p>
        ) : (
          <>
            <table className="board-table">
              <thead>
                <tr>
                  <th className="col-id">번호</th>
                  <th>제목</th>
                  <th className="col-date">작성자</th>
                  <th className="col-date">날짜</th>
                  <th className="col-id">조회</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">게시글이 없습니다.</td>
                  </tr>
                ) : (
                  posts.map(post => (
                    <tr key={post.id} onClick={() => navigate('/board/' + type + '/' + post.id)} className="board-row">
                      <td className="text-center">{post.id}</td>
                      <td className="td-title">
                        {post.title}
                        {post.comment_count > 0 && <span className="board-comment"> [{post.comment_count}]</span>}
                      </td>
                      <td className="text-center">{post.nickname}</td>
                      <td className="text-center">{new Date(post.created_at).toLocaleDateString('ko-KR')}</td>
                      <td className="text-center">{post.views || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pagination-simple">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</button>
              <span>{page} / {totalPages || 1}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== 게시글 상세 ===== */
// ========================================
// PostDetail 컴포넌트 (로그인 연동 완료 버전)
// ========================================
function PostDetail({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 게시글 + 댓글 불러오기
  useEffect(() => {
    fetch(API_BASE + '/api/posts/' + id)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPost(json.post);
          setComments(json.comments || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // 게시글 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(API_BASE + '/api/posts/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        navigate('/board/' + type);
      } else {
        const err = await res.json();
        alert(err.message || '삭제 실패');
      }
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 게시글 수정
  const handleEdit = async () => {
    try {
      const res = await fetch(API_BASE + '/api/posts/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const json = await res.json();
      if (res.ok) {
        setPost({ ...post, title: editTitle, content: editContent });
        setIsEditing(false);
      } else {
        alert(json.message || '수정 실패');
      }
    } catch (e) {
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  // 댓글 작성
  const handleComment = async () => {
    if (!newComment.trim()) return;
    if (!user || !token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(API_BASE + '/api/posts/' + id + '/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (e) {
      alert('댓글 작성 실패');
    }
  };

  if (loading) return <div className="main"><p className="loading-message">로딩 중...</p></div>;
  if (!post) return <div className="main"><p className="loading-message">게시글을 찾을 수 없습니다.</p></div>;

  // 현재 로그인한 사용자가 작성자인지 확인
  const isAuthor = user && post.user_id === user.id;

  return (
    <div className="main">
      <div className="card">
        <button onClick={() => navigate('/board/' + type)} className="btn-back">← 목록으로</button>
        <div className="post-detail">
          {isEditing ? (
            <div className="edit-form">
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="edit-title-input"
                placeholder="제목"
              />
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="edit-content-input"
                rows={12}
                placeholder="내용"
              />
              <div className="edit-actions">
                <button onClick={() => setIsEditing(false)} className="btn-cancel">취소</button>
                <button onClick={handleEdit} className="btn-save">저장</button>
              </div>
            </div>
          ) : (
            <>
              <h2>{post.title}</h2>
              <div className="post-meta">
                <span><IconUser /> {post.nickname || '익명'}</span>
                <span><IconCalendar /> {new Date(post.created_at).toLocaleString('ko-KR')}</span>
                <span><IconEye /> {post.views}</span>
              </div>
              {isAuthor && (
                <div className="post-actions">
                  <button
                    onClick={() => {
                      setEditTitle(post.title);
                      setEditContent(post.content);
                      setIsEditing(true);
                    }}
                    className="btn-edit"
                  >수정</button>
                  <button onClick={handleDelete} className="btn-delete-post">삭제</button>
                </div>
              )}
              <hr />
              <div className="post-content">
                {post.content.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 댓글 섹션 */}
        <div className="comment-section">
          <h3><IconMessage /> 댓글 ({comments.length})</h3>
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-header">
                <strong>{c.nickname || '익명'}</strong>
                <span className="comment-date">{new Date(c.created_at).toLocaleString('ko-KR')}</span>
              </div>
              <p>{c.content}</p>
            </div>
          ))}

          {/* 로그인 상태에 따라 댓글 입력 or 로그인 안내 */}
          {user ? (
            <div className="comment-input">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="input-comment"
                onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
              />
              <button onClick={handleComment} className="btn-comment">등록</button>
            </div>
          ) : (
            <div className="comment-login-prompt">
              <p>댓글을 작성하려면 <Link to="/login">로그인</Link>이 필요합니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WritePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE + '/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ title, content, board_type: 'free' }),
      });
      if (res.ok) {
        navigate('/board/free');
      } else {
        const err = await res.json();
        alert(err.message || '글 작성 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  if (!user) return null;

  return (
    <div className="main">
      <div className="card">
        <h2 className="write-heading"><IconPen /> 글쓰기</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            required
            className="write-input"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            required
            rows={15}
            className="write-textarea"
          />
          <div className="form-footer">
            <button type="button" onClick={() => navigate(-1)} className="btn-cancel">취소</button>
            <button type="submit" className="btn-write-small">등록</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================================
// LoginPage 컴포넌트
// ========================================
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('아이디를 입력해주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>로그인</h2>
          <p>식품산업 커뮤니티에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#e74c3c" strokeWidth="1.5"/>
                <path d="M8 4.5v4M8 10.5v.5" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="login-field">
            <label>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>비밀번호</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>아이디 기억하기</span>
            </label>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                로그인 중...
              </span>
            ) : '로그인'}
          </button>
        </form>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <div className="login-links">
          <p>아직 회원이 아니신가요? <Link to="/signup">회원가입</Link></p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MyPage 컴포넌트
// ========================================
function MyPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // 프로필 상태
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveMsg, setSaveMsg] = useState('');

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // 내 글
  const [myPosts, setMyPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);

  // 내 댓글
  const [myComments, setMyComments] = useState([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // 비밀번호 확인 모달
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [user, navigate]);

  // 프로필 로드
  useEffect(() => {
    if (!token) return;
    setProfileLoading(true);
    fetch(API_BASE + '/api/mypage/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setProfile(json.user);
          setEditForm(json.user);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setProfileLoading(false));
  }, [token]);

  // 내 글 로드
  useEffect(() => {
    if (activeTab !== 'posts' || !token) return;
    setPostsLoading(true);
    fetch(API_BASE + '/api/mypage/posts?page=' + postsPage + '&limit=10', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setMyPosts(json.posts);
          setPostsTotalPages(json.totalPages);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setPostsLoading(false));
  }, [activeTab, postsPage, token]);

  // 내 댓글 로드
  useEffect(() => {
    if (activeTab !== 'comments' || !token) return;
    setCommentsLoading(true);
    fetch(API_BASE + '/api/mypage/comments?page=' + commentsPage + '&limit=10', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setMyComments(json.comments);
          setCommentsTotalPages(json.totalPages);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setCommentsLoading(false));
  }, [activeTab, commentsPage, token]);

  // 프로필 저장
  const handleSaveProfile = async () => {
    setSaveMsg('');
    try {
      const res = await fetch(API_BASE + '/api/mypage/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.user);
        setIsEditing(false);
        setSaveMsg('정보가 수정되었습니다.');
        // localStorage의 user 정보도 업데이트
        const updatedUser = { ...user, name: json.user.name, email: json.user.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setSaveMsg(json.message || '수정 실패');
      }
    } catch (err) {
      setSaveMsg('오류가 발생했습니다.');
    }
  };

  // 비밀번호 확인 후 수정모드 진입
  const handleVerifyPassword = async () => {
    setVerifyMsg('');
    if (!verifyPassword.trim()) {
      setVerifyMsg('비밀번호를 입력해주세요.');
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/mypage/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ password: verifyPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setShowVerifyModal(false);
        setVerifyPassword('');
        setVerifyMsg('');
        setIsEditing(true);
      } else {
        setVerifyMsg(json.message || '비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setVerifyMsg('오류가 발생했습니다.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.newPassword !== pwForm.newPasswordConfirm) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/mypage/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const json = await res.json();
      setPwMsg(json.message);
      if (json.success) {
        setPwForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
      }
    } catch (err) {
      setPwMsg('오류가 발생했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  // 주소 검색
  const searchAddress = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        setEditForm(prev => ({
          ...prev,
          address_zipcode: data.zonecode,
          address_main: data.roadAddress || data.jibunAddress,
        }));
      }
    }).open();
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (!user) return null;

  return (
    <div className="main">
      <div className="mypage-container">
        {/* 사이드바 */}
        <div className="mypage-sidebar">
          <div className="mypage-user-card">
            <div className="mypage-avatar">
              {user.name ? user.name.charAt(0) : user.username.charAt(0)}
            </div>
            <div className="mypage-user-name">{user.name || user.username}</div>
            <div className="mypage-user-email">{user.email}</div>
          </div>
          <nav className="mypage-nav">
            <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
              <IconUser /> 내 정보
            </button>
            <button className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>
              <IconLock /> 비밀번호 변경
            </button>
            <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
              <IconPen /> 내가 쓴 글
            </button>
            <button className={activeTab === 'comments' ? 'active' : ''} onClick={() => setActiveTab('comments')}>
              <IconMessage /> 내가 쓴 댓글
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="mypage-logout-btn">
              <IconLogout /> 로그아웃
            </button>
          </nav>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="mypage-content">

          {/* ===== 프로필 탭 ===== */}
          {activeTab === 'profile' && (
            <div className="mypage-section">
              <h2>내 정보</h2>
              {profileLoading ? (
                <p className="loading-message">불러오는 중...</p>
              ) : profile && !isEditing ? (
                <>
                  {saveMsg && <p className="msg-success mypage-msg">{saveMsg}</p>}

                  {/* 기본 정보 */}
                  <div className="profile-section-title"><IconUser /> 기본 정보</div>
                  <div className="profile-grid">
                    <div className="profile-group">
                      <span className="profile-label">아이디</span>
                      <span className="profile-value">{profile.username}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">성명</span>
                      <span className="profile-value">{profile.name || '-'}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">생년월일</span>
                      <span className="profile-value">{profile.birthdate || '-'}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">가입일</span>
                      <span className="profile-value">{new Date(profile.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>

                  {/* 연락처 정보 */}
                  <div className="profile-section-title"><IconMessage /> 연락처</div>
                  <div className="profile-grid">
                    <div className="profile-group">
                      <span className="profile-label">이메일</span>
                      <span className="profile-value">{profile.email || '-'}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">핸드폰</span>
                      <span className="profile-value">{profile.phone || '-'}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">연락처</span>
                      <span className="profile-value">{profile.tel || '-'}</span>
                    </div>
                  </div>

                  {/* 업체 정보 */}
                  <div className="profile-section-title"><IconFactory /> 업체 정보</div>
                  <div className="profile-grid">
                    <div className="profile-group">
                      <span className="profile-label">업체명</span>
                      <span className="profile-value">{profile.company_name || '-'}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">직급</span>
                      <span className="profile-value">{profile.position || '-'}</span>
                    </div>
                    <div className="profile-group">
                      <span className="profile-label">사업자번호</span>
                      <span className="profile-value">{profile.business_number || '-'}</span>
                    </div>
                    <div className="profile-group profile-group-full">
                      <span className="profile-label">사업장주소</span>
                      <span className="profile-value">
                        {profile.address_main
                          ? `(${profile.address_zipcode}) ${profile.address_main} ${profile.address_detail || ''}`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* 기타 */}
                  <div className="profile-section-title"><IconShield /> 기타</div>
                  <div className="profile-grid">
                    <div className="profile-group">
                      <span className="profile-label">마케팅 수신</span>
                      <span className="profile-value">{profile.marketing_agreed ? '동의' : '미동의'}</span>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button onClick={() => { setShowVerifyModal(true); setVerifyPassword(''); setVerifyMsg(''); }} className="btn-edit">정보 수정</button>
                  </div>
                </>
              ) : profile && isEditing ? (
                <div className="profile-edit-form">
                  <div className="form-group">
                    <label>아이디</label>
                    <input value={profile.username} disabled className="input-disabled" />
                  </div>
                  <div className="form-group">
                    <label>성명</label>
                    <input name="name" value={editForm.name || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>이메일</label>
                    <input name="email" value={editForm.email || ''} onChange={handleEditChange} type="email" />
                  </div>
                  <div className="form-group">
                    <label>핸드폰</label>
                    <input name="phone" value={editForm.phone || ''} onChange={handleEditChange} placeholder="010-0000-0000" />
                  </div>
                  <div className="form-group">
                    <label>연락처</label>
                    <input name="tel" value={editForm.tel || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>업체명</label>
                    <input name="company_name" value={editForm.company_name || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>직급</label>
                    <input name="position" value={editForm.position || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>사업자번호</label>
                    <input name="business_number" value={editForm.business_number || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>사업장주소</label>
                    <div className="input-with-btn">
                      <input name="address_zipcode" value={editForm.address_zipcode || ''} readOnly placeholder="우편번호" className="input-short" />
                      <button type="button" onClick={searchAddress} className="btn-check">주소검색</button>
                    </div>
                    <input name="address_main" value={editForm.address_main || ''} readOnly placeholder="기본주소" className="input-mt" />
                    <input name="address_detail" value={editForm.address_detail || ''} onChange={handleEditChange} placeholder="상세주소" className="input-mt" />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" name="marketing_agreed" checked={editForm.marketing_agreed || false} onChange={handleEditChange} />
                      <span className="checkbox-text">마케팅 정보 수신 동의</span>
                    </label>
                  </div>
                  <div className="profile-actions">
                    <button onClick={() => { setIsEditing(false); setEditForm(profile); }} className="btn-cancel">취소</button>
                    <button onClick={handleSaveProfile} className="btn-save">저장</button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ===== 비밀번호 변경 탭 ===== */}
          {activeTab === 'password' && (
            <div className="mypage-section">
              <h2>비밀번호 변경</h2>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label>현재 비밀번호</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="8자 이상"
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={pwForm.newPasswordConfirm}
                    onChange={e => setPwForm({ ...pwForm, newPasswordConfirm: e.target.value })}
                    placeholder="새 비밀번호를 다시 입력"
                  />
                </div>
                {pwMsg && <p className={pwMsg.includes('변경되었습니다') ? 'msg-success' : 'msg-error'}>{pwMsg}</p>}
                <button type="submit" className="btn-save" disabled={pwLoading}>
                  {pwLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </div>
          )}

          {/* ===== 내가 쓴 글 탭 ===== */}
          {activeTab === 'posts' && (
            <div className="mypage-section">
              <h2>내가 쓴 글</h2>
              {postsLoading ? (
                <p className="loading-message">불러오는 중...</p>
              ) : myPosts.length === 0 ? (
                <p className="empty-message">작성한 글이 없습니다.</p>
              ) : (
                <>
                  <table className="board-table">
                    <thead>
                      <tr>
                        <th className="col-id">번호</th>
                        <th>제목</th>
                        <th className="col-date">게시판</th>
                        <th className="col-date">날짜</th>
                        <th className="col-id">조회</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPosts.map(post => (
                        <tr
                          key={post.id}
                          className="board-row"
                          onClick={() => navigate('/board/' + post.board_type + '/' + post.id)}
                        >
                          <td className="text-center">{post.id}</td>
                          <td className="td-title">
                            {post.title}
                            {post.comment_count > 0 && <span className="board-comment"> [{post.comment_count}]</span>}
                          </td>
                          <td className="text-center">{post.board_type === 'free' ? '자유게시판' : '뉴스'}</td>
                          <td className="text-center">{new Date(post.created_at).toLocaleDateString('ko-KR')}</td>
                          <td className="text-center">{post.views || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pagination-simple">
                    <button disabled={postsPage <= 1} onClick={() => setPostsPage(p => p - 1)}>이전</button>
                    <span>{postsPage} / {postsTotalPages || 1}</span>
                    <button disabled={postsPage >= postsTotalPages} onClick={() => setPostsPage(p => p + 1)}>다음</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== 내가 쓴 댓글 탭 ===== */}
          {activeTab === 'comments' && (
            <div className="mypage-section">
              <h2>내가 쓴 댓글</h2>
              {commentsLoading ? (
                <p className="loading-message">불러오는 중...</p>
              ) : myComments.length === 0 ? (
                <p className="empty-message">작성한 댓글이 없습니다.</p>
              ) : (
                <>
                  <div className="my-comments-list">
                    {myComments.map(c => (
                      <div
                        key={c.id}
                        className="my-comment-item"
                        onClick={() => navigate('/board/' + c.board_type + '/' + c.post_id)}
                      >
                        <div className="my-comment-post-title">
                          <span className="my-comment-badge">{c.board_type === 'free' ? '자유게시판' : '뉴스'}</span>
                          {c.post_title}
                        </div>
                        <div className="my-comment-content">{c.content}</div>
                        <div className="my-comment-date">{new Date(c.created_at).toLocaleString('ko-KR')}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pagination-simple">
                    <button disabled={commentsPage <= 1} onClick={() => setCommentsPage(p => p - 1)}>이전</button>
                    <span>{commentsPage} / {commentsTotalPages || 1}</span>
                    <button disabled={commentsPage >= commentsTotalPages} onClick={() => setCommentsPage(p => p + 1)}>다음</button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* 비밀번호 확인 모달 */}
        {showVerifyModal && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content verify-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowVerifyModal(false)}>✕</button>
              <div className="verify-modal-icon"><IconLock /></div>
              <h3 className="verify-modal-title">비밀번호 확인</h3>
              <p className="verify-modal-desc">정보 수정을 위해 현재 비밀번호를 입력해주세요.</p>
              <input
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="verify-modal-input"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyPassword(); }}
              />
              {verifyMsg && <p className="msg-error verify-modal-msg">{verifyMsg}</p>}
              <div className="verify-modal-actions">
                <button onClick={() => setShowVerifyModal(false)} className="btn-cancel">취소</button>
                <button onClick={handleVerifyPassword} className="btn-save" disabled={verifyLoading}>
                  {verifyLoading ? '확인 중...' : '확인'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                <PriceFullPage priceData={priceData} loading={priceLoading} error={priceError} onRefresh={fetchPrices} />
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