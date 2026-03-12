import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconNewspaper, IconMessage, IconPen } from './Icons';
import { API_BASE } from '../utils/constants';

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

export default Board;