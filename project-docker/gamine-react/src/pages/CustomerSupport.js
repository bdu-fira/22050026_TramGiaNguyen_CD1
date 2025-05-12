import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './CustomerSupport.css';
import { fetchFaqs } from '../services/api';

function CustomerSupport() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('faq');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Đọc tham số 'tab' từ URL khi component mount hoặc location thay đổi
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['faq', 'contact'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // Thêm một chút delay để đảm bảo tab đã được render
      if (tabParam === 'contact') {
        setTimeout(() => {
          const contactSection = document.getElementById('contact-section');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }
  }, [location]);

  // Lấy dữ liệu FAQs từ API khi component mount
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const data = await fetchFaqs();
        setFaqData(data);
        setError(null);
      } catch (err) {
        console.error("Không thể lấy dữ liệu FAQ:", err);
        setError("Không thể lấy dữ liệu câu hỏi thường gặp. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const toggleQuestion = (index) => {
    if (activeQuestion === index) {
      setActiveQuestion(null);
    } else {
      setActiveQuestion(index);
    }
  };

  // Dữ liệu mặc định khi API bị lỗi
  const fallbackFaqData = [
    {
      question: "Làm thế nào để theo dõi đơn hàng của tôi?",
      answer: "Bạn có thể theo dõi đơn hàng bằng cách đăng nhập vào tài khoản và điều hướng đến mục 'Đơn hàng'. Hoặc bạn có thể sử dụng mã số theo dõi được cung cấp trong email xác nhận vận chuyển của bạn."
    },
    {
      question: "Chính sách hoàn trả của bạn là gì?",
      answer: "Chúng tôi cung cấp chính sách hoàn trả 30 ngày cho hầu hết các mặt hàng. Sản phẩm phải ở trong tình trạng ban đầu với tất cả bao bì và phụ kiện. Các mặt hàng được tùy chỉnh hoặc cá nhân hóa không thể được trả lại trừ khi có lỗi."
    },
    {
      question: "Sản phẩm được bảo hành như thế nào?",
      answer: "Sản phẩm khi gửi đi đều có tem bảo hành được dán lên sản phẩm, chỉ cần tem này vẫn còn thì sản phẩm của bạn vẫn được bảo hành."
    },
    {
      question: "Bạn có giao hàng quốc tế không?",
      answer: "Rất tiếc là hiện tại chúng tôi chỉ cung cấp dịch vụ trong lãnh thổ Việt Nam."
    }
  ];

  // Hiển thị dữ liệu mặc định khi đang tải hoặc khi có lỗi
  const displayFaqData = loading || error ? fallbackFaqData : faqData;

  return (
    <div className="page-container support-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>

      <div className="support-header">
        <h2>Hỗ Trợ Khách Hàng</h2>
        <p>Chúng tôi luôn sẵn sàng giúp đỡ bạn với mọi câu hỏi hoặc vấn đề</p>
      </div>

      <div className="support-tabs">
        <button 
          className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          Câu Hỏi Thường Gặp
        </button>
        <button 
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Liên Hệ Hỗ Trợ
        </button>
      </div>

      <div className="support-content">
        {activeTab === 'faq' && (
          <div className="faq-section">
            <h3>Câu Hỏi Thường Gặp</h3>
            {loading ? (
              <div className="loading-indicator">Đang tải câu hỏi thường gặp...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="faq-list">
                {displayFaqData.map((faq, index) => (
                  <div className="faq-item" key={index}>
                    <div 
                      className={`faq-question ${activeQuestion === index ? 'active' : ''}`}
                      onClick={() => toggleQuestion(index)}
                    >
                      <h4>{faq.question}</h4>
                      <span className="toggle-icon">{activeQuestion === index ? '−' : '+'}</span>
                    </div>
                    {activeQuestion === index && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="contact-section" id="contact-section">
            <h3>Liên Hệ Đội Ngũ Hỗ Trợ</h3>
            <p>Điền vào mẫu dưới đây và chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>
            
            <div className="contact-info-grid">
              <div className="contact-details">
                <h4>Thông Tin Liên Hệ</h4>
                
                <div className="contact-item">
                  <h5>Địa Chỉ</h5>
                  <p>123 Cyber Street, Tech District, CA 94103</p>
                </div>
                
                <div className="contact-item">
                  <h5>Điện Thoại</h5>
                  <p>+1 (555) 123-4567</p>
                </div>
                
                <div className="contact-item">
                  <h5>Email</h5>
                  <p>support@gamine.com</p>
                </div>
                
                <div className="contact-item">
                  <h5>Giờ Làm Việc</h5>
                  <p>Thứ Hai - Thứ Sáu: 9:00 - 18:00</p>
                  <p>Thứ Bảy: 10:00 - 16:00</p>
                  <p>Chủ Nhật: Đóng cửa</p>
                </div>
              </div>
              
              <form className="support-form">
                <div className="form-group">
                  <label htmlFor="name">Họ Tên</label>
                  <input type="text" id="name" placeholder="Nhập họ tên của bạn" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="Nhập email của bạn" />
                </div>
                <div className="form-group">
                  <label htmlFor="order">Mã Đơn Hàng (không bắt buộc)</label>
                  <input type="text" id="order" placeholder="Nhập mã đơn hàng của bạn" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Chủ Đề</label>
                  <select id="subject">
                    <option value="">Chọn một chủ đề</option>
                    <option value="order">Trạng Thái Đơn Hàng</option>
                    <option value="return">Hoàn Trả & Hoàn Tiền</option>
                    <option value="product">Thông Tin Sản Phẩm</option>
                    <option value="technical">Hỗ Trợ Kỹ Thuật</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Nội Dung</label>
                  <textarea id="message" rows="5" placeholder="Mô tả vấn đề hoặc câu hỏi của bạn"></textarea>
                </div>
                <button type="submit" className="submit-btn">Gửi Yêu Cầu</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerSupport; 