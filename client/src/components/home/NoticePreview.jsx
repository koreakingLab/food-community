import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconHome } from '../Icons';
import { API_BASE } from '../../utils/constants';
import { getNoticeStatus, formatNoticeDate } from '../../utils/noticeHelpers';

function NoticePreview() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(API_BASE + '/api/smart-notices?page=1&limit=5');
        const json = await res.json();
        if (json.success) {
          const sorted = [...json.data].sort((a, b) => {
            const da = a.creat_pnttm || '';
            const db = b.creat_pnttm || '';
            return db.localeCompare(da);
          });
          setNotices(sorted);
        }
      } catch (err) {
        console.error('공고 로딩 실패:', err);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconHome /> 지원사업 공고</div>
        <Link to="/smart-notices" className="card-more">전체보기 →</Link>
      </div>
      <ul className="notice-list">
        {notices.map(notice => {
          const status = getNoticeStatus(notice);
          return (
            <li key={notice.id} className="notice-item">
              <div className="notice-info">
                <Link to={'/notices/' + notice.id} className="notice-name">{notice.pblanc_nm}</Link>
                <div className="notice-meta">{notice.jrsd_instt_nm} · {formatNoticeDate(notice)}</div>
              </div>
              <span className={'badge ' + status.cls}>{status.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default NoticePreview;