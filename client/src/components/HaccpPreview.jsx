import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HaccpPreview.css';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function HaccpPreview() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/haccp`, {
          params: { pageNo: 1, numOfRows: 12 }
        });
        setItems(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="haccp-preview">
      <div className="haccp-preview-header">
        <h2><span className="haccp-icon">🏭</span> HACCP 인증업체</h2>
        <button className="view-all-btn" onClick={() => navigate('/haccp')}>
          전체보기 →
        </button>
      </div>
      <div className="haccp-grid">
        {items.map((item, idx) => (
          <div className="haccp-card" key={idx}>
            <div className="haccp-card-badge">HACCP</div>
            <h3 className="haccp-card-name">{item.BSSH_NM}</h3>
            <p className="haccp-card-industry">{item.INDUTY_NM}</p>
            <p className="haccp-card-date">
              인증일 {item.HACCP_DESIG_DT}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}