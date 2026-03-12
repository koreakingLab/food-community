import React, { useState, useEffect } from 'react';
import { IconNewspaper } from '../components/Icons';
import { API_BASE } from '../utils/constants';

const SEARCH_KEYWORDS = [
  { label: '식품제조업', query: '식품제조업' },
  { label: '식품산업', query: '식품산업' },
  { label: 'HACCP', query: 'HACCP 식품' },
  { label: '식품안전', query: '식품안전' },
  { label: '식품 수출', query: '식품 수출' },
];

function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKeyword, setActiveKeyword] = useState(SEARCH_KEYWORDS[0]);
  const [page, setPage] = useState(1);
  const [expandedIdx, setExpandedIdx] = useState(null); // 펼친 뉴스 인덱스
  const display = 15; // ✅ 한 페이지 15개

  const fetchNews = async (keyword, pageNum) => {
    setLoading(true);
    setExpandedIdx(null); // 페이지 변경 시 펼침 초기화
    try {
      const start = (pageNum - 1) * display + 1;
      const res = await fetch(
        API_BASE + '/api/news/search?query=' + encodeURIComponent(keyword.query) +
        '&display=' + display + '&start=' + start + '&sort=date'
      );
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

  useEffect(() => {
    fetchNews(activeKeyword, page);
  }, [activeKeyword, page]);

  const handleKeywordChange = (keyword) => {
    setActiveKeyword(keyword);
    setPage(1);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const toggleExpand = (idx) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  return (
    <div className="main">
      <div className="card">
        <div className="card-header">
          <div className="card-title"><IconNewspaper /> 업계 뉴스</div>
        </div>

        {/* 키워드 필터 */}
        <div className="news-keywords">
          {SEARCH_KEYWORDS.map((kw) => (
            <button
              key={kw.query}
              className={'news-keyword-btn' + (activeKeyword.query === kw.query ? ' active' : '')}
              onClick={() => handleKeywordChange(kw)}
            >
              {kw.label}
            </button>
          ))}
        </div>

        {/* 뉴스 목록 */}
        {loading ? (
          <p className="loading-message">뉴스를 불러오는 중...</p>
        ) : (
          <>
            <div className="news-card-list">
              {articles.map((article, idx) => (
                <div key={idx} className={'news-card-item' + (expandedIdx === idx ? ' expanded' : '')}>
                  <div className="news-card-row" onClick={() => toggleExpand(idx)}>
                    <div className="news-card-title-wrap">
                      <h3 className="news-card-title">{article.title}</h3>
                      <div className="news-card-meta">
                        <span className="news-card-source">{article.source}</span>
                        <span className="news-card-date">{formatDate(article.pubDate)}</span>
                      </div>
                    </div>
                    <span className={'news-card-arrow' + (expandedIdx === idx ? ' open' : '')}>
                      ▼
                    </span>
                  </div>

                  {/* ✅ 펼침 영역: 요약 + 원문 보기 버튼 */}
                  {expandedIdx === idx && (
                    <div className="news-card-detail">
                      <p className="news-card-desc">{article.description || '요약 정보가 없습니다.'}</p>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-card-origin-btn"
                      >
                        원문 보기 →
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {articles.length === 0 && (
                <p className="empty-message">검색 결과가 없습니다.</p>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="pagination-simple">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</button>
              <span>{page} 페이지</span>
              <button disabled={articles.length < display} onClick={() => setPage(p => p + 1)}>다음</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NewsPage;