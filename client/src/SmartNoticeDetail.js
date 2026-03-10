import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'https://food-community-production.up.railway.app';

export default function SmartNoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/smart-notices/${id}`);
        const json = await res.json();
        if (json.success) {
          setNotice(json.data);
        }
      } catch (err) {
        console.error('상세 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const formatDate = (notice) => {
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

  if (loading) return <div className="detail-page"><p>⏳ 로딩 중...</p></div>;
  if (!notice) return <div className="detail-page"><p>공고를 찾을 수 없습니다.</p></div>;

  const status = getStatus(notice);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">← 목록으로</Link>
      </div>

      <div className="detail-category">
        {notice.hash_tags && notice.hash_tags.split(',')[0]}
      </div>

      <h1 className="detail-title">{notice.pblanc_nm}</h1>

      <div className="detail-date">
        {notice.creat_pnttm ? new Date(notice.creat_pnttm).toLocaleDateString('ko-KR') : ''}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span className={status.className}>{status.text}</span>
      </div>

      <hr className="detail-divider" />

      <table className="detail-info-table">
        <tbody>
          <tr>
            <th>소관부처·지자체</th>
            <td>{notice.jrsd_instt_nm || '-'}</td>
          </tr>
          <tr>
            <th>신청기간</th>
            <td>{formatDate(notice)}</td>
          </tr>
          <tr>
            <th>해시태그</th>
            <td>{notice.hash_tags || '-'}</td>
          </tr>
        </tbody>
      </table>

      <hr className="detail-divider" />

      <div className="detail-section">
        <h3>사업개요</h3>
        <p className="detail-summary">{notice.bsns_sumry_cn || '상세 내용은 원문을 확인해주세요.'}</p>
      </div>

      <div className="detail-link-section">
        <a
          href={notice.pblanc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="detail-original-link"
        >
          📄 원문 공고 보기 (기업마당)
        </a>
      </div>
    </div>
  );
}