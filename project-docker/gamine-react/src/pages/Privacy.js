import React from 'react';
import './TermsConditions.css';

function Privacy() {
  return (
    <div className="terms-container">
      {/* Cyberpunk decorative corners */}
      <div className="cyber-corner top-left"></div>
      <div className="cyber-corner top-right"></div>
      <div className="cyber-corner bottom-left"></div>
      <div className="cyber-corner bottom-right"></div>
      
      <div className="terms-header">
        <h2>Chính Sách Bảo Mật</h2>
        <p>Cập nhật lần cuối: Ngày 01 tháng 06 năm 2023</p>
      </div>

      <div className="terms-content">
        <div className="terms-section">
          <h3>1. Giới Thiệu</h3>
          <p>GaMine ("chúng tôi", "của chúng tôi") cam kết bảo vệ quyền riêng tư của bạn. Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng trang web và dịch vụ của chúng tôi.</p>
          <p>Bằng cách sử dụng GaMine, bạn đồng ý với việc thu thập và sử dụng thông tin theo Chính sách này. Nếu bạn không đồng ý với Chính sách của chúng tôi, vui lòng không sử dụng dịch vụ của chúng tôi.</p>
        </div>

        <div className="terms-section">
          <h3>2. Thông Tin Chúng Tôi Thu Thập</h3>
          <p><strong>2.1 Thông Tin Cá Nhân</strong></p>
          <p>Chúng tôi có thể thu thập các loại thông tin cá nhân sau đây:</p>
          <ul>
            <li>Thông tin liên hệ (như tên, địa chỉ email, số điện thoại, địa chỉ giao hàng)</li>
            <li>Thông tin tài khoản (như tên người dùng, mật khẩu)</li>
            <li>Thông tin thanh toán (như thông tin thẻ tín dụng, hóa đơn)</li>
            <li>Thông tin giao dịch (như sản phẩm đã mua, giá cả)</li>
            <li>Thông tin hồ sơ (như sở thích, lịch sử mua hàng)</li>
          </ul>
          
          <p><strong>2.2 Thông Tin Tự Động</strong></p>
          <p>Khi bạn truy cập trang web của chúng tôi, chúng tôi có thể tự động thu thập thông tin kỹ thuật như:</p>
          <ul>
            <li>Địa chỉ IP</li>
            <li>Loại trình duyệt và phiên bản</li>
            <li>Thông tin thiết bị</li>
            <li>Hệ điều hành</li>
            <li>Dữ liệu cookie và công nghệ theo dõi tương tự</li>
            <li>Thời gian truy cập và trang đã xem</li>
          </ul>
        </div>

        <div className="terms-section">
          <h3>3. Cách Chúng Tôi Sử Dụng Thông Tin Của Bạn</h3>
          <p>Chúng tôi sử dụng thông tin thu thập được để:</p>
          <ul>
            <li>Cung cấp, duy trì và cải thiện dịch vụ của chúng tôi</li>
            <li>Xử lý giao dịch và gửi thông báo liên quan</li>
            <li>Gửi thông tin kỹ thuật, cập nhật, cảnh báo bảo mật và thông báo hỗ trợ</li>
            <li>Phản hồi các yêu cầu, câu hỏi và mối quan tâm của bạn</li>
            <li>Tùy chỉnh trải nghiệm mua sắm của bạn</li>
            <li>Gửi thông tin tiếp thị và quảng cáo (với sự đồng ý của bạn)</li>
            <li>Theo dõi và phân tích xu hướng, việc sử dụng và hoạt động liên quan đến dịch vụ của chúng tôi</li>
            <li>Phát hiện, ngăn chặn và giải quyết các hoạt động gian lận hoặc bất hợp pháp</li>
          </ul>
        </div>

        <div className="terms-section">
          <h3>4. Chia Sẻ Thông Tin</h3>
          <p>Chúng tôi có thể chia sẻ thông tin cá nhân của bạn với:</p>
          <ul>
            <li><strong>Nhà cung cấp dịch vụ</strong>: Các công ty làm việc thay mặt chúng tôi để cung cấp dịch vụ nhất định (như xử lý thanh toán, giao hàng, phân tích dữ liệu, tiếp thị qua email)</li>
            <li><strong>Đối tác kinh doanh</strong>: Với sự đồng ý của bạn, chúng tôi có thể chia sẻ thông tin với các đối tác kinh doanh để cung cấp sản phẩm hoặc dịch vụ nhất định</li>
            <li><strong>Tuân thủ pháp luật</strong>: Khi chúng tôi tin rằng việc tiết lộ là cần thiết để tuân thủ pháp luật, quy định, quy trình pháp lý hoặc yêu cầu của chính phủ</li>
            <li><strong>Bảo vệ quyền</strong>: Để bảo vệ quyền, tài sản hoặc sự an toàn của GaMine, người dùng của chúng tôi hoặc những người khác</li>
          </ul>
          <p>Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba.</p>
        </div>

        <div className="terms-section">
          <h3>5. Cookie và Công Nghệ Theo Dõi</h3>
          <p>Chúng tôi sử dụng cookie và các công nghệ theo dõi tương tự để thu thập và lưu trữ thông tin khi bạn sử dụng dịch vụ của chúng tôi. Cookie giúp chúng tôi cung cấp trải nghiệm cá nhân hóa và cải thiện dịch vụ của mình.</p>
          <p>Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt của mình. Tuy nhiên, việc chặn một số cookie có thể ảnh hưởng đến trải nghiệm của bạn và các tính năng chúng tôi cung cấp.</p>
        </div>

        <div className="terms-section">
          <h3>6. Bảo Mật Dữ Liệu</h3>
          <p>Chúng tôi thực hiện các biện pháp bảo mật hợp lý để bảo vệ thông tin cá nhân của bạn khỏi bị mất mát, truy cập trái phép, tiết lộ, thay đổi hoặc phá hủy. Tuy nhiên, không có phương thức truyền qua internet hoặc lưu trữ điện tử nào là 100% an toàn.</p>
        </div>

        <div className="terms-section">
          <h3>7. Quyền Riêng Tư Của Bạn</h3>
          <p>Tùy thuộc vào khu vực của bạn, bạn có thể có các quyền nhất định liên quan đến thông tin cá nhân của mình, bao gồm:</p>
          <ul>
            <li>Quyền truy cập và xem thông tin cá nhân của bạn</li>
            <li>Quyền chỉnh sửa hoặc cập nhật thông tin không chính xác</li>
            <li>Quyền xóa thông tin cá nhân của bạn</li>
            <li>Quyền hạn chế hoặc phản đối việc xử lý</li>
            <li>Quyền di chuyển dữ liệu</li>
            <li>Quyền từ chối tiếp thị trực tiếp</li>
          </ul>
          <p>Để thực hiện bất kỳ quyền nào trong số này, vui lòng liên hệ với chúng tôi qua thông tin liên hệ được cung cấp bên dưới.</p>
        </div>

        <div className="terms-section">
          <h3>8. Lưu Giữ Dữ Liệu</h3>
          <p>Chúng tôi lưu giữ thông tin cá nhân của bạn trong thời gian cần thiết để đạt được các mục đích được nêu trong Chính sách Bảo mật này, trừ khi cần phải lưu giữ lâu hơn theo yêu cầu hoặc được phép của pháp luật.</p>
        </div>

        <div className="terms-section">
          <h3>9. Quyền Riêng Tư Của Trẻ Em</h3>
          <p>Dịch vụ của chúng tôi không dành cho người dưới 16 tuổi. Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ em dưới 16 tuổi. Nếu bạn là phụ huynh hoặc người giám hộ và bạn biết rằng con bạn đã cung cấp cho chúng tôi thông tin cá nhân, vui lòng liên hệ với chúng tôi để chúng tôi có thể thực hiện các hành động cần thiết.</p>
        </div>

        <div className="terms-section">
          <h3>10. Thay Đổi Đối Với Chính Sách Này</h3>
          <p>Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi nào bằng cách đăng Chính sách mới trên trang này và cập nhật ngày "Cập nhật lần cuối" ở đầu Chính sách này.</p>
          <p>Bạn nên xem lại Chính sách này định kỳ để biết về những cập nhật. Những thay đổi đối với Chính sách này có hiệu lực khi chúng được đăng trên trang này.</p>
        </div>

        <div className="terms-section">
          <h3>11. Thông Tin Liên Hệ</h3>
          <p>Nếu bạn có bất kỳ câu hỏi hoặc lo ngại nào về Chính sách Bảo mật của chúng tôi, vui lòng liên hệ với chúng tôi tại:</p>
          <div className="contact-info">
            <p><i className="far fa-envelope"></i> Email: privacy@gamine.com</p>
            <p><i className="fas fa-map-marker-alt"></i> Địa chỉ: 123 Cyber Street, Tech District, CA 94103</p>
            <p><i className="fas fa-phone"></i> Điện thoại: +1 (555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy; 