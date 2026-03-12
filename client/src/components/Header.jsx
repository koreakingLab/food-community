import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconFactory } from './Icons';

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
          <Link to="/news" className={isActive('/news') ? 'active' : ''}>뉴스</Link>
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

export default Header;