import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'https://food-community-production.up.railway.app';

/* SVG 아이콘 */
const IconHome = () => (
  <svg style=width:20,height:20,stroke:'currentColor',strokeWidth:2,fill:'none',strokeLinecap:'round',strokeLinejoin:'round',verticalAlign:'middle' viewBox="0 0 24 24">
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
);

export default function SmartNotices() {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/api/smart-notices?page=${page}&limit=15`;
        if (filter !== 'all') url += `&status=${filter}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          // ④ 최신순 정렬
          const sorted = [...json.data].sort((a, b) =>
            new Date(b.creat_pnttm || 0) - new Date(a.creat_pnttm || 0)
          );
          setNotices(sorted);
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
    if (notice.reqst_date_raw && !notice.reqst_begin_de) return notice.reqst_date_raw;
    const begin = notice.reqst_begin_de
      ? new Date(notice.reqst_begin_de).toLocaleDateString('ko-KR') : '-';
    const end = notice.reqst_end_de
      ? new Date(notice.reqst_end_de).toLocaleDateString('ko-KR') : '-';
    return `${begin} ~ ${end}`;
  };

  const getStatus = (notice) => {
    if (!notice.reqst_end_de) return { text: '상시', className: 'badge ongoing' };
    const today = new Date().toISOString().split('T')[0];
    if (notice.reqst_end_de >= today) return { text: '접수중', className: 'badge active' };
    return { text: '마감', className: 'badge expired' };
  };

  return (
    <div className="main">
      <div className="card">
        <div className="card-header">
          <div className="card-title"><IconHome /> 스마트제조 지원사업 공고</div>
        </div>

        {/* ⑤ 필터 버튼: 전체보기 페이지에서만 표시 */}
        <div className="filter-group">
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('all'); setPage(1); }}
          >전체</button>
          <button
            className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('active'); setPage(1); }}
          >접수중</button>
          <button
            className={filter === 'expired' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('expired'); setPage(1); }}
          >마감</button>
        </div>

        {loading ? (
          <p className="loading-text">⏳ 공고 정보를 불러오는 중...</p>
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
                    <tr key={notice.pblanc_id || notice.id}>
                      <td>{(page - 1) * 15 + idx + 1}</td>
                      <td className="notice-title-cell">
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
      </div>
    </div>
  );
}