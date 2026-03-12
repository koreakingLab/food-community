import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconUser, IconLock, IconPen, IconMessage, IconLogout, IconFactory, IconShield } from '../components/Icons';
import { API_BASE } from '../utils/constants';

function MyPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveMsg, setSaveMsg] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [myPosts, setMyPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);

  const [myComments, setMyComments] = useState([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [user, navigate]);

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
        const updatedUser = { ...user, name: json.user.name, email: json.user.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setSaveMsg(json.message || '수정 실패');
      }
    } catch (err) {
      setSaveMsg('오류가 발생했습니다.');
    }
  };

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
          {/* 프로필 탭 */}
          {activeTab === 'profile' && (
            <div className="mypage-section">
              <h2>내 정보</h2>
              {profileLoading ? (
                <p className="loading-message">불러오는 중...</p>
              ) : profile && !isEditing ? (
                <>
                  {saveMsg && <p className="msg-success mypage-msg">{saveMsg}</p>}
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

          {/* 비밀번호 변경 탭 */}
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

          {/* 내가 쓴 글 탭 */}
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

          {/* 내가 쓴 댓글 탭 */}
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

export default MyPage;