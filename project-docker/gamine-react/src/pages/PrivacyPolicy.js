import React, { useState, useEffect } from 'react';
import './PrivacyPolicy.css';
import { fetchPrivacyPolicies } from '../services/api';

function PrivacyPolicy() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        setLoading(true);
        const data = await fetchPrivacyPolicies();
        setPolicies(data);
        setError(null);
      } catch (err) {
        setError('Không thể tải chính sách bảo mật. Vui lòng thử lại sau.');
        console.error('Error loading privacy policies:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
  }, []);

  // Hiển thị nội dung mặc định nếu không có dữ liệu từ API
  const renderDefaultPolicy = () => (
    <>
      <div className="policy-section">
        <h3>1. Giới Thiệu</h3>
        <p>Tại GaMine, chúng tôi coi trọng quyền riêng tư của bạn. Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin của bạn khi bạn truy cập trang web, sử dụng ứng dụng di động hoặc mua sắm thông qua nền tảng của chúng tôi.</p>
        <p>Vui lòng đọc kỹ Chính sách Bảo mật này. Bằng cách truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý tuân theo tất cả các điều khoản được nêu trong chính sách này.</p>
      </div>

      <div className="data-visual"></div>

      <div className="policy-section">
        <h3>2. Thông Tin Chúng Tôi Thu Thập</h3>
        
        <h4>2.1 Thông Tin Cá Nhân</h4>
        <p>Chúng tôi có thể thu thập thông tin cá nhân mà bạn tự nguyện cung cấp khi bạn:</p>
        <ul>
          <li>Tạo tài khoản hoặc đặt hàng</li>
          <li>Đăng ký nhận bản tin</li>
          <li>Tham gia các cuộc thi, khảo sát hoặc chương trình khuyến mãi</li>
          <li>Liên hệ với bộ phận hỗ trợ khách hàng của chúng tôi</li>
        </ul>
        <p>Thông tin này có thể bao gồm tên, địa chỉ email, địa chỉ bưu điện, số điện thoại và thông tin thanh toán của bạn.</p>
        
        <h4>2.2 Thông Tin Thu Thập Tự Động</h4>
        <p>Khi bạn truy cập trang web hoặc sử dụng ứng dụng của chúng tôi, chúng tôi có thể tự động thu thập một số thông tin về thiết bị của bạn, bao gồm:</p>
        <ul>
          <li>Địa chỉ IP</li>
          <li>Loại trình duyệt</li>
          <li>Hệ điều hành</li>
          <li>Trang web giới thiệu</li>
          <li>Các trang đã xem</li>
          <li>Thời gian dành cho các trang</li>
          <li>Các liên kết đã nhấp</li>
        </ul>
      </div>

      <div className="data-visual"></div>

      <div className="policy-section">
        <h3>3. Cách Chúng Tôi Sử Dụng Thông Tin Của Bạn</h3>
        <p>Chúng tôi có thể sử dụng thông tin thu thập được cho nhiều mục đích khác nhau, bao gồm:</p>
        <ul>
          <li>Xử lý và thực hiện đơn đặt hàng của bạn</li>
          <li>Tạo và quản lý tài khoản của bạn</li>
          <li>Cung cấp hỗ trợ khách hàng</li>
          <li>Gửi email giao dịch (xác nhận đơn hàng, cập nhật vận chuyển)</li>
          <li>Gửi thông tin tiếp thị (nếu bạn đã đồng ý)</li>
          <li>Cải thiện trang web, sản phẩm và dịch vụ của chúng tôi</li>
          <li>Tiến hành nghiên cứu và phân tích</li>
          <li>Ngăn chặn gian lận và tăng cường bảo mật</li>
        </ul>
      </div>

      <div className="policy-section">
        <h3>8. Liên Hệ Với Chúng Tôi</h3>
        <p>Nếu bạn có câu hỏi hoặc thắc mắc về Chính sách Bảo mật này, vui lòng liên hệ với chúng tôi tại:</p>
        <div className="contact-info">
          <p><i className="far fa-envelope"></i> Email: privacy@gamine.com</p>
          <p><i className="fas fa-map-marker-alt"></i> Địa chỉ: 123 Cyber Street, Tech District, CA 94103</p>
          <p><i className="fas fa-phone"></i> Điện thoại: +1 (555) 123-4567</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="policy-container">
      {/* Cyberpunk decorative corners */}
      <div className="cyber-corner top-left"></div>
      <div className="cyber-corner top-right"></div>
      <div className="cyber-corner bottom-left"></div>
      <div className="cyber-corner bottom-right"></div>
      
      <div className="policy-header">
        <h2>Chính Sách Bảo Mật</h2>
        <p>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', {year: 'numeric', month: '2-digit', day: '2-digit'})}</p>
      </div>

      <div className="policy-content">
        {loading && (
          <div className="loading-container">
            <div className="cyber-loading"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            {renderDefaultPolicy()}
          </div>
        )}

        {!loading && !error && policies.length > 0 ? (
          policies.map((policy) => (
            <div key={policy.id} className="policy-section">
              <h3>{policy.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, '<br/>') }}></div>
              <div className="data-visual"></div>
            </div>
          ))
        ) : (
          !loading && !error && renderDefaultPolicy()
        )}
      </div>
    </div>
  );
}

export default PrivacyPolicy; 