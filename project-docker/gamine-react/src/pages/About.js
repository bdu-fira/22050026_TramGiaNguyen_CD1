import React from 'react';
import './About.css';
// Import hình ảnh từ thư mục assets
import personnel1 from '../assets/images/personnel-1.png';
import personnel2 from '../assets/images/personnel-2.png';
import personnel3 from '../assets/images/personnel-3.png';

function About() {
  return (
    <div className="page-container about-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      <div className="about-header">
        <h2>Về GaMine</h2>
        <p>Điểm đến hàng đầu cho thiết bị chơi game cao cấp</p>
      </div>

      <div className="about-content">
        <div className="about-section">
          <h3>Sứ Mệnh Của Chúng Tôi</h3>
          <p>Tại GaMine, chúng tôi tin rằng mỗi game thủ xứng đáng có được thiết bị phù hợp với đam mê và kỹ năng của họ. Sứ mệnh của chúng tôi là cung cấp phần cứng chơi game tiên tiến nhằm nâng cao hiệu suất, mang lại trải nghiệm đắm chìm vô song, và nổi bật với thiết kế lấy cảm hứng từ phong cách cyberpunk, giúp bộ setup của bạn ấn tượng như chính gameplay của bạn.</p>
        </div>

        <div className="about-section">
          <h3>Câu Chuyện Của Chúng Tôi</h3>
          <p>Được thành lập vào năm 2020 bởi một tập thể gồm các game thủ, kỹ sư và những người đam mê công nghệ, GaMine ra đời từ sự thất vọng chung về việc thiếu các thiết bị chơi game cân bằng giữa hiệu năng, độ bền và tính thẩm mỹ. Điều bắt đầu từ một xưởng nhỏ trong gara đã phát triển thành thương hiệu toàn cầu được tin dùng bởi cả người chơi thông thường và các game thủ chuyên nghiệp.</p>
          <p>Hành trình của chúng tôi được thúc đẩy bởi cam kết đổi mới, chất lượng và cộng đồng game. Mỗi sản phẩm chúng tôi tạo ra đều được đội ngũ game thủ chuyên nghiệp kiểm tra nghiêm ngặt để đảm bảo đáp ứng yêu cầu của các phiên chơi game mạnh mẽ nhất.</p>
        </div>

        <div className="about-section team-section">
          <h3>Đội Ngũ Của Chúng Tôi</h3>
          <div className="team-grid">
            <div className="team-member">
              <img src={personnel1} alt="Trầm Gia Nguyên - Trưởng phòng Dữ liệu" />
              <h4>Trầm Gia Nguyên</h4>
              <p className="title">Trưởng phòng Dữ liệu</p>
              <p className="bio">Với hơn 8 năm kinh nghiệm về phân tích dữ liệu lớn, Nguyên lãnh đạo đội ngũ phát triển các giải pháp AI và thống kê để tối ưu hóa trải nghiệm người dùng GaMine.</p>
            </div>

            <div className="team-member">
              <img src={personnel2} alt="Nguyễn Kỳ Quang - Trưởng phòng Backend" />
              <h4>Nguyễn Kỳ Quang</h4>
              <p className="title">Trưởng phòng Backend</p>
              <p className="bio">Chuyên gia về kiến trúc phân tán và đám mây, Quang xây dựng hệ thống backend mạnh mẽ, có khả năng mở rộng đáp ứng nhu cầu ngày càng tăng của nền tảng GaMine.</p>
            </div>

            <div className="team-member">
              <img src={personnel3} alt="Trần Minh Huân - Trưởng phòng Frontend" />
              <h4>Trần Minh Huân</h4>
              <p className="title">Trưởng phòng Frontend</p>
              <p className="bio">Với kinh nghiệm sâu rộng về React và UI/UX, Huân dẫn dắt việc phát triển giao diện người dùng hấp dẫn và thân thiện, tạo nên trải nghiệm mượt mà cho khách hàng GaMine.</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h3>Giá Trị Cốt Lõi</h3>
          <div className="values-container">
            <div className="value-box">
              <i className="fas fa-lightbulb value-icon"></i>
              <h4>Đổi Mới</h4>
              <p>Chúng tôi liên tục mở rộng giới hạn của phần cứng gaming, luôn tìm kiếm công nghệ mới và phương pháp thiết kế tiên tiến.</p>
            </div>
            <div className="value-box">
              <i className="fas fa-award value-icon"></i>
              <h4>Chất Lượng</h4>
              <p>Mỗi sản phẩm chúng tôi tạo ra đều trải qua kiểm tra nghiêm ngặt để đảm bảo độ bền, độ chính xác và hiệu suất vượt xa mong đợi.</p>
            </div>
            <div className="value-box">
              <i className="fas fa-users value-icon"></i>
              <h4>Cộng Đồng</h4>
              <p>Chúng tôi tích cực tương tác với cộng đồng game, lắng nghe phản hồi và thu hút người chơi vào quá trình phát triển sản phẩm.</p>
            </div>
            <div className="value-box">
              <i className="fas fa-leaf value-icon"></i>
              <h4>Bền Vững</h4>
              <p>Chúng tôi cam kết giảm thiểu tác động môi trường thông qua bao bì có thể tái chế, sản xuất tiết kiệm năng lượng và nguyên liệu có nguồn gốc có trách nhiệm.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About; 