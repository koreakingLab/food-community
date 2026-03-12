import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../utils/constants';
import { getNoticeStatus, formatNoticeDate } from '../../utils/noticeHelpers';

const FALLBACK_SLIDES = [
  { label: '스마트제조 지원사업', title: '식품제조업체를 위한 최신 지원사업 공고를 확인하세요', meta: '지원사업 전체보기에서 상세 내용을 확인할 수 있습니다', link: '/smart-notices' }
];

function SlideBanner() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(API_BASE + '/api/smart-notices?page=1&limit=3');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setSlides(json.data.map(n => ({
            label: getNoticeStatus(n).text + (n.jrsd_instt_nm ? ' · ' + n.jrsd_instt_nm : ''),
            title: n.pblanc_nm,
            meta: '신청기간 ' + formatNoticeDate(n),
            link: '/notices/' + n.id
          })));
        }
      } catch (err) {
        console.error('배너 로딩 실패:', err);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="slide-banner">
      <div className="slide-content">
        <div className="slide-label">{slides[current].label}</div>
        <div className="slide-title">{slides[current].title}</div>
        <div className="slide-meta">{slides[current].meta}</div>
      </div>
      <div className="slide-actions">
        <Link to={slides[current].link} className="slide-btn">자세히 보기 →</Link>
        {slides.length > 1 && (
          <div className="slide-nav">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={'slide-dot' + (idx === current ? ' active' : '')}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SlideBanner;