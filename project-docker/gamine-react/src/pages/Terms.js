import React from 'react';
import './TermsConditions.css';

function Terms() {
  return (
    <div className="terms-container">
      {/* Cyberpunk decorative corners */}
      <div className="cyber-corner top-left"></div>
      <div className="cyber-corner top-right"></div>
      <div className="cyber-corner bottom-left"></div>
      <div className="cyber-corner bottom-right"></div>
      
      <div className="terms-header">
        <h2>Điều Khoản & Điều Kiện</h2>
        <p>Cập nhật lần cuối: Ngày 14 tháng 04 năm 2025</p>
      </div>

      <div className="terms-content">
        <div className="terms-section">
          <h3>1. Giới Thiệu</h3>
          <p>Chào mừng đến với GaMine. Các Điều khoản và Điều kiện này điều chỉnh việc bạn sử dụng trang web, ứng dụng di động và dịch vụ của chúng tôi. Bằng cách truy cập hoặc sử dụng GaMine, bạn đồng ý bị ràng buộc bởi những Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn có thể không truy cập dịch vụ của chúng tôi.</p>
        </div>

        <div className="terms-section">
          <h3>2. Định Nghĩa</h3>
          <ul>
            <li><strong>Dịch vụ</strong> đề cập đến trang web GaMine, ứng dụng di động và các dịch vụ liên quan.</li>
            <li><strong>Người dùng</strong>, <strong>Bạn</strong>, và <strong>Của bạn</strong> đề cập đến cá nhân hoặc tổ chức sử dụng Dịch vụ của chúng tôi.</li>
            <li><strong>Chúng tôi</strong>, <strong>Của chúng tôi</strong> đề cập đến GaMine.</li>
            <li><strong>Điều khoản</strong> đề cập đến các Điều khoản và Điều kiện này.</li>
            <li><strong>Nội dung</strong> đề cập đến văn bản, hình ảnh, video, âm thanh và các tài liệu khác có thể xuất hiện trên Dịch vụ của chúng tôi.</li>
          </ul>
        </div>

        <div className="terms-section">
          <h3>3. Đăng Ký Tài Khoản</h3>
          <p>Để truy cập một số tính năng nhất định của Dịch vụ của chúng tôi, bạn có thể cần tạo một tài khoản. Bạn chịu trách nhiệm về:</p>
          <ul>
            <li>Cung cấp thông tin đăng ký chính xác và đầy đủ</li>
            <li>Duy trì bảo mật thông tin đăng nhập tài khoản của bạn</li>
            <li>Tất cả các hoạt động diễn ra dưới tài khoản của bạn</li>
          </ul>
          <p>Chúng tôi có quyền chấm dứt tài khoản hoặc từ chối dịch vụ cho bất kỳ ai vì bất kỳ lý do gì theo quyết định của chúng tôi.</p>
        </div>

        <div className="terms-section">
          <h3>4. Sản Phẩm và Giao Dịch Mua Hàng</h3>
          <p><strong>4.1 Thông Tin Sản Phẩm</strong></p>
          <p>Chúng tôi cố gắng hiển thị thông tin sản phẩm chính xác, bao gồm mô tả, hình ảnh, giá cả và tình trạng sẵn có. Tuy nhiên, chúng tôi không đảm bảo rằng mô tả sản phẩm hoặc nội dung khác là chính xác, đầy đủ hoặc không có lỗi.</p>
          
          <p><strong>4.2 Giá Cả và Thanh Toán</strong></p>
          <p>Tất cả giá được liệt kê bằng đơn vị tiền tệ được chỉ định và có thể thay đổi mà không cần thông báo trước. Thanh toán phải được thực hiện thông qua một trong các phương thức thanh toán được chấp nhận của chúng tôi. Bạn đồng ý cung cấp thông tin mua hàng và tài khoản hiện tại, đầy đủ và chính xác.</p>
          
          <p><strong>4.3 Chấp Nhận Đơn Hàng</strong></p>
          <p>Chúng tôi có quyền từ chối hoặc hủy bất kỳ đơn đặt hàng nào vì bất kỳ lý do gì, bao gồm nhưng không giới hạn ở tình trạng sẵn có của sản phẩm, lỗi trong định giá hoặc thông tin sản phẩm, hoặc vấn đề với quá trình xử lý thanh toán.</p>
        </div>

        <div className="terms-section">
          <h3>5. Vận Chuyển và Giao Hàng</h3>
          <p>Thời gian và phương thức vận chuyển khác nhau tùy theo địa điểm và chỉ là ước tính. Chúng tôi không chịu trách nhiệm về những chậm trễ do đơn vị vận chuyển, hải quan hoặc các yếu tố khác ngoài tầm kiểm soát của chúng tôi gây ra.</p>
        </div>

        <div className="terms-section">
          <h3>6. Đổi Trả và Hoàn Tiền</h3>
          <p>Vui lòng tham khảo Chính sách Đổi trả riêng của chúng tôi để biết thông tin chi tiết về việc đổi trả, trao đổi và hoàn tiền.</p>
        </div>

        <div className="terms-section">
          <h3>7. Quyền Sở Hữu Trí Tuệ</h3>
          <p>Tất cả nội dung, thiết kế, đồ họa, logo và quyền sở hữu trí tuệ khác trên Dịch vụ của chúng tôi là tài sản độc quyền của GaMine hoặc người cấp phép của chúng tôi và được bảo vệ bởi luật bản quyền, thương hiệu và các luật khác.</p>
          <p>Bạn không được sử dụng, sao chép, phân phối hoặc tạo các tác phẩm phái sinh từ bất kỳ nội dung nào mà không có sự cho phép bằng văn bản rõ ràng từ chúng tôi hoặc chủ sở hữu quyền tương ứng.</p>
        </div>

        <div className="terms-section">
          <h3>8. Hành Vi Người Dùng</h3>
          <p>Khi sử dụng Dịch vụ của chúng tôi, bạn đồng ý không:</p>
          <ul>
            <li>Vi phạm bất kỳ luật hoặc quy định hiện hành nào</li>
            <li>Xâm phạm quyền của người khác</li>
            <li>Gửi thông tin sai lệch hoặc gây hiểu lầm</li>
            <li>Tải lên hoặc truyền vi-rút hoặc mã độc</li>
            <li>Cố gắng truy cập trái phép vào hệ thống của chúng tôi</li>
            <li>Can thiệp vào hoạt động thích hợp của Dịch vụ</li>
            <li>Tham gia vào bất kỳ hành vi nào hạn chế hoặc ngăn cản bất kỳ người dùng nào khác sử dụng Dịch vụ</li>
          </ul>
        </div>

        <div className="terms-section">
          <h3>9. Giới Hạn Trách Nhiệm</h3>
          <p>Trong phạm vi tối đa được pháp luật cho phép, GaMine sẽ không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, do hậu quả hoặc mang tính trừng phạt nào, bao gồm mất lợi nhuận, dữ liệu hoặc uy tín, phát sinh từ việc bạn sử dụng hoặc không thể sử dụng Dịch vụ.</p>
        </div>

        <div className="terms-section">
          <h3>10. Thay Đổi Điều Khoản</h3>
          <p>Chúng tôi có quyền sửa đổi các Điều khoản này bất cứ lúc nào. Chúng tôi sẽ thông báo về những thay đổi quan trọng bằng cách cập nhật ngày "Cập nhật lần cuối" ở đầu các Điều khoản này. Việc bạn tiếp tục sử dụng Dịch vụ sau những thay đổi đó cấu thành sự chấp nhận các Điều khoản mới của bạn.</p>
        </div>

        <div className="terms-section">
          <h3>11. Thông Tin Liên Hệ</h3>
          <p>Nếu bạn có câu hỏi về các Điều khoản này, vui lòng liên hệ với chúng tôi tại:</p>
          <div className="contact-info">
            <p><i className="far fa-envelope"></i> Email: legal@gamine.com</p>
            <p><i className="fas fa-map-marker-alt"></i> Địa chỉ: 123 Cyber Street, Tech District, CA 94103</p>
            <p><i className="fas fa-phone"></i> Điện thoại: +1 (555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms; 