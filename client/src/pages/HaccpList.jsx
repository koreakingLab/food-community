import React, { useState, useEffect, useCallback } from 'react';
import './HaccpList.css';

const API_BASE = 'https://food-community-production.up.railway.app';

export default function HaccpList() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyItems, setCompanyItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/haccp?pageNo=${page}&numOfRows=${pageSize}&search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(input);
    setPage(1);
  };

  const handleCompanyClick = async (companyName) => {
    setDetailLoading(true);
    setSelectedCompany(companyName);
    try {
      const res = await fetch(API_BASE + '/api/haccp/company?name=' + encodeURIComponent(companyName));
      const data = await res.json();
      setCompanyItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedCompany(null);
    setCompanyItems([]);
  };

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
          <p className="haccp-list-count">총 <strong>{totalCount.toLocaleString()}</strong>개 인증</p>
        </div>

        <form className="haccp-search" onSubmit={handleSearch}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="업체명으로 검색..."
          />
          <button type="submit">검색</button>
        </form>

        {loading ? (
          <div className="haccp-loading">데이터를 불러오는 중...</div>
        ) : (
          <table className="haccp-table">
            <thead>
              <tr>
                <th className="col-no">No</th>
                <th className="col-name">업체명</th>
                <th>업종</th>
                <th>품목</th>
                <th className="col-date">인증일</th>
                <th>지역</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item, idx) => (
                <tr key={idx}>
                  <td className="col-no">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="col-name haccp-company-link" onClick={() => handleCompanyClick(item.company)}>
                    {item.company}
                  </td>
                  <td>{item.businesstypeNm}</td>
                  <td>{item.businessitemNm || '-'}</td>
                  <td className="col-date">{item.issuedate}</td>
                  <td>{(item.area1 || '') + ' ' + (item.area2 || '')}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="no-data">검색 결과가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        )}

        <div className="haccp-pagination">
          <button disabled={page <= 1} onClick={() => setPage(1)}>«</button>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          {getPageNumbers().map((num) => (
            <button key={num} className={num === page ? 'active' : ''} onClick={() => setPage(num)}>{num}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
        </div>
      </div>

      {/* 상세정보 모달 */}
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
                  {companyItems.map((item, idx) => (
                    <div className="modal-item-row" key={idx}>
                      <div className="modal-item-left">
                        <span className="modal-item-name">{item.businessitemNm || item.businesstypeNm || '-'}</span>
                        <span className="modal-item-type">{item.productGb || ''}</span>
                      </div>
                      <div className="modal-item-right">
                        <span className="modal-item-date">{item.issuedate} ~ {item.issueenddate || '진행중'}</span>
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