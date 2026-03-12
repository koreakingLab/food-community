import React from 'react';
import { Link } from 'react-router-dom';
import { IconNewspaper } from '../Icons';
import { DUMMY_NEWS } from '../../utils/constants';

function NewsPreview() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><IconNewspaper /> 업계 뉴스</div>
        <Link to="/board/news" className="card-more">전체보기 →</Link>
      </div>
      <ul className="news-list">
        {DUMMY_NEWS.map(post => (
          <li key={post.id} className="news-item">
            <Link to={'/board/news/' + post.id} className="news-title">{post.title}</Link>
            <div className="news-date">{post.date}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NewsPreview;