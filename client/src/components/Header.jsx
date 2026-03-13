import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconFactory } from './Icons';

// ✅ 메뉴 구조 정의
const menuItems = [
  { label: '홈', path: '/' },
  {
    label: '원자재 시세',
    path: '/prices',
    sub: [
      { label: '일별 시세', path: '/prices' },
      { label: '시세 추이(차트)', path: '/prices/trend' },
      { label: '품목별 비교', path: '/prices/compare' },
    ],
  },
  {
    label: '장비 마켓',
    path: '/equipment',
    sub: [
      { label: '장비 카탈로그', path: '/equipment/catalog' },
      { label: '장비 업체 디렉토리', path: '/equipment/directory' },
      { label: '장비 문의/견적', path: '/equipment/inquiry' },
    ],
  },
  {
    label: 'AI 장비 추천',
    path: '/ai-recommend',
    sub: [
      { label: '제품 사진 업로드', path: '/ai-recommend' },
      { label: '추천 결과', path: '/ai-recommend/results' },
      { label: '활용 가이드', path: '/ai-recommend/guide' },
    ],
  },
  {
    label: '지원사업',
    path: '/smart-notices',
    sub: [
      { label: '모집 중', path: '/smart-notices' },
      { label: '마감 임박', path: '/smart-notices/closing' },
      { label: '지원사업 캘린더', path: '/smart-notices/calendar' },
      { label: '지원 가이드', path: '/smart-notices/guide' },
    ],
  },
  {
    label: '정보센터',
    path: '/info',
    sub: [
      { label: '업계 뉴스', path: '/news' },
      { label: 'HACCP 인증업체', path: '/haccp' },
      { label: '법규/인증 가이드', path: '/info/regulations' },
      { label: '식품 안전 자료실', path: '/info/safety' },
    ],
  },
  {
    label: '커뮤니티',
    path: '/board/free',
    sub: [
      { label: '자유게시판', path: '/board/free' },
      { label: 'Q&A', path: '/board/qna' },
      { label: '업체 후기', path: '/board/reviews' },
      { label: '구인/구직', path: '/board/jobs' },
    ],
  },
];

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const menuRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  const isActive = (item) => {
    const path = item.path;
    if (path === '/') return location.pathname === '/';

    // 메인 경로 또는 서브메뉴 경로 중 하나라도 매칭되면 active
    if (location.pathname.startsWith(path)) return true;
    if (item.sub) {
      return item.sub.some((sub) => location.pathname.startsWith(sub.path));
    }
    return false;
  };

  // 유저 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭다운 hover 핸들러
  const handleMouseEnter = (index) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150); // 약간의 딜레이로 마우스 이동 시 깜빡임 방지
  };

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
          {menuItems.map((item, index) => (
            <div
              key={item.path}
              className="nav-item-wrapper"
              onMouseEnter={() => item.sub && handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to={item.path}
                className={isActive(item) ? 'active' : ''}
              >
                {item.label}
              </Link>

              {/* 드롭다운 서브메뉴 */}
              {item.sub && openDropdown === index && (
                <div className="nav-dropdown">
                  {item.sub.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className="nav-dropdown-item"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
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

export default Header;