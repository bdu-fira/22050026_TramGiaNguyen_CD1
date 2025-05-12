import React, { useState, useEffect } from 'react';
import './TermsConditions.css';
import { fetchTermsAndConditions } from '../services/api';

function TermsConditions() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const getTermsData = async () => {
      try {
        setLoading(true);
        const data = await fetchTermsAndConditions();
        setTerms(data);
        
        // Lấy ngày cập nhật mới nhất nếu có dữ liệu
        if (data.length > 0) {
          const newestTerm = [...data].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          setLastUpdated(formatDate(newestTerm.created_at));
        }
      } catch (err) {
        console.error('Failed to fetch terms:', err);
        setError('Không thể tải dữ liệu điều khoản sử dụng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    getTermsData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="terms-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terms-container">
        <div className="terms-header">
          <h2>Điều Khoản & Điều Kiện</h2>
        </div>
        <div className="terms-content" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              marginTop: '20px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="terms-container">
      {/* Cyberpunk decorative corners */}
      <div className="cyber-corner top-left"></div>
      <div className="cyber-corner top-right"></div>
      <div className="cyber-corner bottom-left"></div>
      <div className="cyber-corner bottom-right"></div>
      
      <div className="terms-header">
        <h2>Điều Khoản & Điều Kiện</h2>
        <p>Cập nhật lần cuối: {lastUpdated}</p>
      </div>

      <div className="terms-content">
        {terms.map((term) => (
          <div className="terms-section" key={term.id}>
            <h3>{term.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: term.content }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TermsConditions; 