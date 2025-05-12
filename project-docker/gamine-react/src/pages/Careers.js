import React, { useState, useEffect } from 'react';
import { fetchCareers, submitCareerApplication } from '../services/api';
import Modal from '../components/Modal';
import './Careers.css';

function Careers() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [cvLink, setCvLink] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getCareers = async () => {
      try {
        setLoading(true);
        const data = await fetchCareers();
        setCareers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch careers:', err);
        setError('Không thể tải dữ liệu tuyển dụng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    getCareers();
  }, []);

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowModal(true);
    resetForm();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    resetForm();
  };

  const resetForm = () => {
    setCvLink('');
    setApplicantName('');
    setApplicantEmail('');
    setSubmitStatus({ message: '', type: '' });
  };

  const handleSubmitCvLink = async (e) => {
    e.preventDefault();
    
    if (!cvLink || !cvLink.trim()) {
      setSubmitStatus({
        message: 'Vui lòng nhập link Google Drive của CV',
        type: 'error'
      });
      return;
    }

    // Kiểm tra định dạng link
    if (!cvLink.includes('drive.google.com')) {
      setSubmitStatus({
        message: 'Link không hợp lệ. Vui lòng sử dụng link Google Drive',
        type: 'error'
      });
      return;
    }

    // Kiểm tra định dạng email
    if (applicantEmail && !isValidEmail(applicantEmail)) {
      setSubmitStatus({
        message: 'Email không hợp lệ. Vui lòng nhập đúng định dạng email',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Gọi API để gửi link CV và thông tin ứng viên
      await submitCareerApplication(
        selectedJob.job_id, 
        cvLink,
        applicantName,
        applicantEmail
      );
      
      setSubmitStatus({
        message: 'Đã gửi CV thành công. Chúng tôi sẽ liên hệ với bạn sớm!',
        type: 'success'
      });

      // Reset form sau khi submit thành công
      setCvLink('');
      setApplicantName('');
      setApplicantEmail('');
    } catch (error) {
      console.error('Failed to submit CV link:', error);
      setSubmitStatus({
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra định dạng email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Format a truncated version of the description for the card view
  const formatDescription = (description) => {
    if (description.length <= 100) return description;
    return `${description.substring(0, 100)}...`;
  };

  return (
    <div className="page-container careers-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      <div className="careers-header">
        <h2>Cơ Hội Nghề Nghiệp</h2>
        <p>Hãy cùng chúng tôi định hình tương lai của công nghệ gaming</p>
      </div>

      <div className="careers-content">
        <div className="careers-intro">
          <h3>Tại Sao Chọn Chúng Tôi</h3>
          <p>Tại GaMine, chúng tôi đam mê tạo ra các thiết bị gaming vượt ra khỏi giới hạn. Chúng tôi là đội ngũ gồm những người đam mê công nghệ, game thủ, nhà thiết kế, và những người sáng tạo cùng chia sẻ một mục tiêu chung: nâng cao trải nghiệm chơi game thông qua phần cứng tiên tiến.</p>
          <p>Chúng tôi mang đến môi trường làm việc năng động với các phúc lợi cạnh tranh, cơ hội phát triển chuyên môn, và văn hóa đề cao sự đổi mới, hợp tác và cân bằng giữa công việc và cuộc sống.</p>
        </div>

        <div className="careers-benefits">
          <h3>Quyền Lợi & Đãi Ngộ</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <span role="img" aria-label="Sức Khỏe">❤️</span>
              </div>
              <h4>Sức Khỏe & Thể Chất</h4>
              <p>Bảo hiểm sức khỏe toàn diện, chương trình wellness, và thành viên phòng tập gym</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <span role="img" aria-label="Học Tập">🎓</span>
              </div>
              <h4>Phát Triển Chuyên Môn</h4>
              <p>Hỗ trợ học tập, tham gia hội nghị, và chương trình cố vấn</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <span role="img" aria-label="Cân Bằng">⚖️</span>
              </div>
              <h4>Cân Bằng Công Việc</h4>
              <p>Giờ làm việc linh hoạt, lựa chọn làm việc từ xa, và chính sách nghỉ phép hào phóng</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <span role="img" aria-label="Gaming">🎮</span>
              </div>
              <h4>Đặc Quyền Gaming</h4>
              <p>Giảm giá cho nhân viên, chương trình thử nghiệm sản phẩm, và khu vực chơi game</p>
            </div>
          </div>
        </div>

        <div className="open-positions">
          <h3>Vị Trí Tuyển Dụng</h3>
          
          {loading ? (
            <div className="loading-indicator">Đang tải dữ liệu tuyển dụng...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : careers.length === 0 ? (
            <div className="no-positions">Hiện tại không có vị trí nào đang mở. Vui lòng kiểm tra lại sau.</div>
          ) : (
            careers.map((job) => (
              <div className="position-card" key={job.job_id}>
                <div className="position-info">
                  <h4>{job.title}</h4>
                  <p className="position-desc">{formatDescription(job.description)}</p>
                  <div className="tags">
                    <span className="tag">Toàn thời gian</span>
                    <span className="tag">ID: {job.job_id}</span>
                    <span className="tag">Ngày đăng: {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="apply-btn" onClick={() => handleApply(job)}>Ứng Tuyển Ngay</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for job application */}
      {showModal && selectedJob && (
        <Modal title={`Ứng tuyển: ${selectedJob.title}`} onClose={closeModal}>
          <div className="job-application-modal">
            <div className="job-details">
              <h4>{selectedJob.title}</h4>
              <p>{selectedJob.description}</p>
              
              {selectedJob.requirements && (
                <div className="job-requirements">
                  <h5>Yêu cầu công việc:</h5>
                  <p>{selectedJob.requirements}</p>
                </div>
              )}
            </div>
            
            <div className="application-instructions">
              <h5>Cách thức ứng tuyển:</h5>
              <p>Vui lòng gửi CV của bạn qua email <a href="mailto:careers@gamine.com">careers@gamine.com</a> với tiêu đề: "{selectedJob.title} - ID: {selectedJob.job_id}"</p>
              <p>Hoặc bạn có thể gửi link Google Drive chứa CV của bạn qua form bên dưới:</p>
            </div>
            
            <form onSubmit={handleSubmitCvLink} className="cv-link-form">
              <div className="form-group">
                <label htmlFor="applicant-name">Họ tên (không bắt buộc):</label>
                <input 
                  type="text" 
                  id="applicant-name" 
                  className="cv-link-input" 
                  placeholder="Nhập họ tên của bạn" 
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="applicant-email">Email liên hệ (không bắt buộc):</label>
                <input 
                  type="email" 
                  id="applicant-email" 
                  className="cv-link-input" 
                  placeholder="Nhập email liên hệ của bạn" 
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cv-link">Link Google Drive của CV:</label>
                <input 
                  type="url" 
                  id="cv-link" 
                  className="cv-link-input" 
                  placeholder="Nhập link Google Drive chứa CV của bạn" 
                  value={cvLink}
                  onChange={(e) => setCvLink(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              {submitStatus.message && (
                <div className={`submit-status ${submitStatus.type}`}>
                  {submitStatus.message}
                </div>
              )}
              
              <div className="application-buttons">
                <a 
                  href="mailto:careers@gamine.com"
                  className="apply-email-btn"
                >
                  Gửi Email Ứng Tuyển
                </a>
                <button 
                  type="submit" 
                  className="submit-cv-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Link CV'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Careers; 