import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'https://food-community-production.up.railway.app';

export default function SmartNotices() {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/api/smart-notices?page=${page}&limit=15`;
        if (filter !== 'all') url += `&status=${filter}`;
  
        const res = await fetch(url);
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
  
    fetchNotices();
  }, [page, filter]);

  const formatDate = (notice) => {
    // 원문 텍스트가 있고, 날짜가 아닌 경우 원문 표시
    if (notice.reqst_date_raw && !notice.reqst_begin_de) {
      return notice.reqst_date_raw;
    }
    const begin = notice.reqst_begin_de
      ? new Date(notice.reqst_begin_de).toLocaleDateString('ko-KR')
      : '-';
    const end = notice.reqst_end_de
      ? new Date(notice.reqst_end_de).toLocaleDateString('ko-KR')
      : '-';
    return `${begin} ~ ${end}`;
  };

  const getStatus = (notice) => {
    if (!notice.reqst_end_de) return { text: '상시', className: 'badge ongoing' };
    const today = new Date().toISOString().split('T')[0];
    if (notice.reqst_end_de >= today) {
      return { text: '접수중', className: 'badge active' };
    }
    return { text: '마감', className: 'badge expired' };
  };

  return (
    <section className="smart-notices-section">
      <h2>🏭 스마트제조 지원사업 공고</h2>

      <div className="notice-filters">
        <button
          className={filter === 'all' ? 'filter-btn selected' : 'filter-btn'}
          onClick={() => { setFilter('all'); setPage(1); }}
        >전체</button>
        <button
          className={filter === 'active' ? 'filter-btn selected' : 'filter-btn'}
          onClick={() => { setFilter('active'); setPage(1); }}
        >접수중</button>
        <button
          className={filter === 'expired' ? 'filter-btn selected' : 'filter-btn'}
          onClick={() => { setFilter('expired'); setPage(1); }}
        >마감</button>
      </div>

      {loading ? (
        <p className="loading">⏳ 공고 정보를 불러오는 중...</p>
      ) : notices.length === 0 ? (
        <p className="no-data">등록된 공고가 없습니다.</p>
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
              {notices.map((notice, idx) => {
                const status = getStatus(notice);
                return (
                  <tr key={notice.pblanc_id}>
                    <td>{(page - 1) * 15 + idx + 1}</td>
                    <td className="notice-title">
                      <Link to={`/notices/${notice.id}`}>
                        {notice.pblanc_nm}
                      </Link>
                    </td>
                    <td>{notice.jrsd_instt_nm}</td>
                    <td>{formatDate(notice)}</td>
                    <td><span className={status.className}>{status.text}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >◀ 이전</button>
            <span>{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >다음 ▶</button>
          </div>
        </>
      )}
    </section>
  );
}