// client/src/pages/HaccpList.jsx
import React, { useState } from 'react';
import { useHaccp } from '../hooks/useHaccp';

export default function HaccpList() {
  const { items, totalCount, page, setPage, setSearch, loading, pageSize } = useHaccp();
  const [input, setInput] = useState('');
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(input);
    setPage(1);
  };

  return (
    <div className="haccp-container">
      <h2>🏭 HACCP 인증업체 목록</h2>
      <p className="subtitle">총 {totalCount.toLocaleString()}개 업체</p>

      {/* 검색바 */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="업체명으로 검색..."
        />
        <button type="submit">검색</button>
      </form>

      {/* 테이블 */}
      {loading ? (
        <div className="loading">불러오는 중...</div>
      ) : (
        <table className="haccp-table">
          <thead>
            <tr>
              <th>No</th>
              <th>업체명</th>cd 
              <th>업종</th>
              <th>HACCP 지정일</th>
              <th>소재지</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{item.BSSH_NM}</td>
                <td>{item.INDUTY_NM}</td>
                <td>{item.HACCP_DESIG_DT}</td>
                <td>{item.SITE_ADDR}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
        <span>{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>다음</button>
      </div>
    </div>
  );
}