import React from 'react';
import { Link } from 'react-router-dom';
import { IconActivity } from '../Icons';

/* ===== 시세 카드 ===== */
function PriceCard({ item }) {
  return (
    <div className="price-card">
      <div className="item-name">{item.name} ({item.kind})</div>
      <div className="item-price">{item.price}</div>
      <div className="item-unit">{item.unit}</div>
      <div className={'item-change' + (item.direction === 'up' ? ' up' : item.direction === 'down' ? ' down' : '')}>
        {item.direction === 'up' ? '▲' : item.direction === 'down' ? '▼' : ''} {item.changeRate}
      </div>
    </div>
  );
}

/* ===== 홈 - 시세 섹션 ===== */
function PriceSection({ priceData, loading, error, onRefresh }) {
  if (loading) {
    return (
      <section className="price-section">
        <div className="price-header">
          <div className="price-title"><IconActivity /> 오늘의 원자재 시세</div>
          <Link to="/prices" className="card-more">전체보기 →</Link>
        </div>
        <p className="loading-text">⏳ 시세 정보를 불러오는 중...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="price-section">
        <div className="price-header">
          <div className="price-title"><IconActivity /> 오늘의 원자재 시세</div>
          <Link to="/prices" className="card-more">전체보기 →</Link>
        </div>
        <p className="error-text">⚠️ {error}</p>
        <button onClick={onRefresh} className="btn-retry">다시 시도</button>
      </section>
    );
  }

  const allItems = [...(priceData?.grains || []), ...(priceData?.fruits || [])].slice(0, 5);

  return (
    <section className="price-section">
      <div className="price-header">
        <div className="price-title"><IconActivity /> 오늘의 원자재 시세</div>
        <div className="price-date">
          {priceData?.updatedAt
            ? new Date(priceData.updatedAt).toLocaleDateString('ko-KR') + ' 기준 (KAMIS)'
            : ''}
          <button onClick={onRefresh} className="btn-refresh-inline">🔄</button>
        </div>
        <Link to="/prices" className="card-more">전체보기 →</Link>
      </div>
      {priceData?.isFallback && (
        <p className="fallback-notice">⚠️ 이전 캐시 데이터를 표시 중입니다.</p>
      )}
      <div className="price-grid">
        {allItems.map((item, idx) => <PriceCard key={idx} item={item} />)}
      </div>
    </section>
  );
}

export default PriceSection;