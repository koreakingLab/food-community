import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './HaccpList.css';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function HaccpList() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/haccp`, {
        params: { pageNo: page, numOfRows: pageSize, search }
      });
      setItems(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(input);
    setPage(1);
  };

  // 페이지 번호 목록 생성 (최대 5개씩)
  const getPageNumbers = () => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="haccp-list-page">
      <div className="haccp-list-container">
        <div className="haccp-list-header">
          <h1>🏭 HACCP 인증업체</h1>
          <p className="haccp-list-count">
            총 <strong>{totalCount.toLocaleString()}</strong>개 업체
          </p>
        </div>

        {/* 검색바 */}
        <form className="haccp-search" onSubmit={handleSearch}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="업체명으로 검색..."
          />
          <button type="submit">검색</button>
        </form>

        {/* 게시판 테이블 */}
        {loading ? (
          <div className="haccp-loading">데이터를 불러오는 중...</div>
        ) : (
          <table className="haccp-table">
            <thead>
              <tr>
                <th className="col-no">No</th>
                <th className="col-name">업체명</th>
                <th className="col-industry">업종</th>
                <th className="col-date">인증일</th>
                <th className="col-addr">소재지</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item, idx) => (
                <tr key={idx}>
                  <td className="col-no">{(page - 1) * pageSize + idx + 1}</td>
                  <td>{item.company}</td>
                  <td>{item.businesstypeNm}</td>
                  <td>{item.issuedate}</td>
                  <td>{item.worksaddr}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="no-data">검색 결과가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* 페이지네이션 */}
        <div className="haccp-pagination">
          <button disabled={page <= 1} onClick={() => setPage(1)}>«</button>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          {getPageNumbers().map((num) => (
            <button
              key={num}
              className={num === page ? 'active' : ''}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
        </div>
      </div>
    </div>
  );
}