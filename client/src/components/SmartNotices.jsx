// components/SmartNotices.jsx
import { useState, useEffect } from 'react';
import './SmartNotices.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function SmartNotices() {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, [page]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/smart-notices?page=${page}&limit=15`
      );
      const json = await res.json();
      if (json.success) {
        setNotices(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error('공고 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <section className="smart-notices">
      <h2>🏭 스마트제조 지원사업 공고</h2>
      
      {loading ? (
        <p className="loading">⏳ 공고 정보를 불러오는 중...</p>
      ) : (
        <>
          <table className="notice-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>공고명</th>
                <th>소관기관</th>
                <th>신청기간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice, idx) => (
                <tr key={notice.pblanc_id}>
                  <td>{(page - 1) * 15 + idx + 1}</td>
                  <td>
                    <a 
                      href={notice.pblanc_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {notice.pblanc_nm}
                    </a>
                  </td>
                  <td>{notice.jrsd_instt_nm}</td>
                  <td>
                    {formatDate(notice.reqst_begin_de)} ~ {formatDate(notice.reqst_end_de)}
                  </td>
                  <td>
                    <span className={
                      isExpired(notice.reqst_end_de) 
                        ? 'badge expired' 
                        : 'badge active'
                    }>
                      {isExpired(notice.reqst_end_de) ? '마감' : '접수중'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ◀ 이전
            </button>
            <span>{page} / {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              다음 ▶
            </button>
          </div>
        </>
      )}
    </section>
  );
}