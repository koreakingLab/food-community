import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconUser, IconCalendar, IconEye, IconMessage } from './Icons';
import { API_BASE } from '../utils/constants';

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

export default PostDetail;