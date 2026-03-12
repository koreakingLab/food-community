import React from 'react';
import PriceSection from '../components/home/PriceSection';
import SlideBanner from '../components/home/SlideBanner';
import NoticePreview from '../components/home/NoticePreview';
import NewsPreview from '../components/home/NewsPreview';
import HaccpPreview from '../components/home/HaccpPreview';
import FreePreview from '../components/home/FreePreview';

function HomePage({ priceData, priceLoading, priceError, onPriceRefresh }) {
  return (
    <div className="main">
      <PriceSection priceData={priceData} loading={priceLoading} error={priceError} onRefresh={onPriceRefresh} />
      <SlideBanner />
      <div className="dashboard-grid">
        <NoticePreview />
        <NewsPreview />
        <HaccpPreview />
        <FreePreview />
      </div>
    </div>
  );
}

export default HomePage;