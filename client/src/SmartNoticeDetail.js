import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'https://food-community-production.up.railway.app';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function SmartNoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/smart-notices/${id}`);
        const json = await res.json();
        if (json.success) setNotice(json.data);
      } catch (err) {
        console.error('상세 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

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

  // ⑦ 원문 URL: DB의 pblanc_url 우선, 없으면 pblanc_id로 기업마당 URL 생성
  const getOriginalUrl = (notice) => {
    if (notice.pblanc_url && notice.pblanc_url.startsWith('http')) return notice.pblanc_url;
    if (notice.pblanc_id) return `https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=${notice.pblanc_id}`;
    return null;
  };

  if (loading) return (
    <div className="detail-page">
      <div className="card" style=textAlign:'center',padding:'60px 20px'>
        <p>⏳ 로딩 중...</p>
      </div>
    </div>
  );

  if (!notice) return (
    <div className="detail-page">
      <div className="card" style=textAlign:'center',padding:'60px 20px'>
        <p>공고를 찾을 수 없습니다.</p>
      </div>
    </div>
  );

  const status = getStatus(notice);
  const originalUrl = getOriginalUrl(notice);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <Link to="/smart-notices" className="back-link">← 목록으로</Link>
      </div>
      <div className="card">
        {notice.pldir_sport_realm && (
          <div className="detail-category">{notice.pldir_sport_realm}</div>
        )}
        <h1 className="detail-title">{notice.pblanc_nm}</h1>
        <div className="detail-date">
          {notice.creat_pnttm ? new Date(notice.creat_pnttm).toLocaleDateString('ko-KR') : ''}
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span className={status.className}>{status.text}</span>
        </div>
        <hr className="detail-divider" />
        <table className="detail-info-table">
          <tbody>
            <tr><th>소관부처·지자체</th><td>{notice.jrsd_instt_nm || '-'}</td></tr>
            <tr><th>신청기간</th><td>{formatDate(notice)}</td></tr>
            <tr><th>지원분야</th><td>{notice.pldir_sport_realm || '-'}</td></tr>
            <tr><th>해시태그</th><td>{notice.hash_tags || '-'}</td></tr>
            {notice.refrnc_nm && <tr><th>참고자료</th><td>{notice.refrnc_nm}</td></tr>}
          </tbody>
        </table>
        <hr className="detail-divider" />
        {notice.bsns_sumry_cn && (
          <div className="detail-section">
            <h3>사업개요</h3>
            <p className="detail-summary">{stripHtml(notice.bsns_sumry_cn)}</p>
          </div>
        )}
        {notice.reqst_mth_papers_cn && (
          <div className="detail-section">
            <h3>신청방법 및 제출서류</h3>
            <p className="detail-summary">{stripHtml(notice.reqst_mth_papers_cn)}</p>
          </div>
        )}
        <div className="detail-link-section">
          {notice.rcept_engn_hmpg_url && (
            <a href={notice.rcept_engn_hmpg_url} target="_blank" rel="noopener noreferrer" className="detail-apply-link">
              📝 접수 사이트 바로가기
            </a>
          )}
          {originalUrl && (
            <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="detail-original-link">
              📄 원문 공고 보기 (기업마당)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}