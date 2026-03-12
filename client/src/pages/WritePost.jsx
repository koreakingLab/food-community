import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconPen } from '../components/Icons';
import { API_BASE } from '../utils/constants';

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

export default WritePost;