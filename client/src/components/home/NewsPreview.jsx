import React, { useState, useEffect } from 'react';
import { IconNewspaper } from '../Icons';
import { API_BASE } from '../../utils/constants';
import { Link } from 'react-router-dom';

function NewsPreview() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(API_BASE + '/api/news/search?query="식품제조" OR "식품산업" OR "식품업계" OR "HACCP"&display=5&sort=date');
        const json = await res.json();
        if (json.success) {
          setArticles(json.articles);
        }
      } catch (err) {
        console.error('뉴스 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // 날짜 포맷
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconNewspaper /> 업계 뉴스</div>
        <Link to="/news" className="card-more">전체보기 →</Link>
      </div>
      {loading ? (
        <p className="loading-message">불러오는 중...</p>
      ) : (
        <ul className="news-list">
          {articles.map((article, idx) => (
            <li key={idx} className="news-item">
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="news-title">
                {article.title}
              </a>
              <div className="news-date">{formatDate(article.pubDate)}</div>
            </li>
          ))}
          {articles.length === 0 && (
            <li className="news-item">
              <span className="news-title text-muted">뉴스를 불러오지 못했습니다.</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default NewsPreview;