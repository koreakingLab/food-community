import React from 'react';
import { Link } from 'react-router-dom';
import { IconMessage } from '../Icons';
import { API_BASE } from '../../utils/constants';
import useCachedFetch from '../../hooks/useCachedFetch';

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

export default FreePreview;