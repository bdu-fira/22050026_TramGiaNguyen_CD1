import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaDiscord } from 'react-icons/fa';
import { BsFacebook, BsTwitter, BsYoutube, BsDiscord, BsInstagram } from 'react-icons/bs';
import './Footer.css';
import { fetchSocialMediaUrls, subscribeToNewsletter } from '../services/api';
import axios from 'axios';

function Footer() {
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socialMediaUrls, setSocialMediaUrls] = useState(null);
  const [socialMediaError, setSocialMediaError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add state for newsletter subscription
  const [newsletterMessage, setNewsletterMessage] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  // Add state for mobile collapsible sections
  const [activeSections, setActiveSections] = useState({
    products: false,
    company: false,
    support: false,
    legal: false
  });
  
  // API URL động dựa vào hostname hiện tại
  const API_URL = `http://${window.location.hostname}:8000/api`;
  
  // Function to toggle section visibility on mobile
  const toggleSection = (section) => {
    if (window.innerWidth <= 768) {
      setActiveSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh mục sản phẩm
        console.log('Đang lấy danh mục sản phẩm...');
        try {
          const response = await axios.get(`${API_URL}/categories/`);
          setCategories(response.data);
        } catch (err) {
          console.log('Không lấy được categories, dùng dữ liệu mặc định');
          setCategories([
            { category_id: 1, name: 'Bàn Phím' },
            { category_id: 2, name: 'Chuột' },
            { category_id: 3, name: 'Màn Hình' },
            { category_id: 4, name: 'Tai Nghe' },
            { category_id: 5, name: 'Phụ Kiện' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }

      try {
        // Lấy liên kết mạng xã hội
        console.log('Đang lấy liên kết mạng xã hội...');
        const socialData = await fetchSocialMediaUrls();
        console.log('Dữ liệu mạng xã hội:', socialData);
        
        if (socialData) {
          setSocialMediaUrls(socialData);
        } else {
          // Fallback to empty values if no data is returned
          setSocialMediaUrls({
            facebook: '',
            twitter: '',
            youtube: '',
            discord: '',
            instagram: ''
          });
        }
      } catch (error) {
        console.error('Error fetching footer data:', error);
        // Set default empty values on error
        setSocialMediaUrls({
          facebook: '',
          twitter: '',
          youtube: '',
          discord: '',
          instagram: ''
        });
      }
    };

    fetchData();
  }, [API_URL]);

  const handleCategorySelect = (categoryName) => {
    // Tìm category dựa trên tên
    const category = categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    if (category) {
      // Nếu tìm thấy category, chuyển hướng đến trang sản phẩm với filter
      navigate(`/products?category=${category.category_id}`);
    } else {
      // Nếu không tìm thấy, chuyển hướng đến trang sản phẩm không có filter
      navigate('/products');
    }
  };
  
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !email.includes('@')) {
      setNewsletterMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ email hợp lệ' });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }
    
    // Disable button while processing
    setIsSubscribing(true);
    
    try {
      const response = await subscribeToNewsletter(email);
      console.log('Newsletter subscription response:', response);
      
      if (response && response.success) {
        // Success
        setNewsletterMessage({ type: 'success', text: response.message || 'Đăng ký nhận bản tin thành công!' });
        setEmail(''); // Clear the input field
      } else {
        // Error from API that returned a proper response
        setNewsletterMessage({ 
          type: 'error', 
          text: (response && response.message) ? response.message : 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      // Attempt to extract error message
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      if (error.response && error.response.data) {
        if (error.response.data.error === 'Email already registered') {
          errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác.';
        } else {
          errorMessage = error.response.data.error || error.response.data.message || errorMessage;
        }
      }
      
      setNewsletterMessage({ type: 'error', text: errorMessage });
    } finally {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      setIsSubscribing(false);
    }
  };

  // Cắt bớt danh sách categories để hiển thị chỉ 5 mục
  const displayedCategories = categories.slice(0, 5);

  // Function to determine if any social media links are available
  const hasSocialMedia = () => {
    if (socialMediaError || !socialMediaUrls) return false;
    
    return (
      socialMediaUrls.facebook || 
      socialMediaUrls.twitter || 
      socialMediaUrls.youtube || 
      socialMediaUrls.discord || 
      socialMediaUrls.instagram
    );
  };

  // Function to get social media icon class
  const getSocialClass = () => {
    if (socialMediaError) return "social-links error";
    if (!socialMediaUrls) return "social-links loading";
    return "social-links";
  };

  return (
    <footer id="contact-section">
      {/* Cyberpunk elements */}
      <div className="cyber-line"></div>
      <div className="cyber-glow"></div>
      <div className="cyber-glow"></div>
      
      {/* Newsletter message notification */}
      {newsletterMessage && (
        <div className={`newsletter-message ${newsletterMessage.type}`}>
          {newsletterMessage.text}
        </div>
      )}
      
      <div className="footer-container">
        <div className="footer-top">
        <div className="footer-links">
          <div className={`link-group ${activeSections.products ? 'active' : ''}`}>
              <h4 onClick={() => toggleSection('products')}>Sản Phẩm</h4>
            <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect('bàn phím'); }}>Bàn Phím</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect('chuột'); }}>Chuột</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect('màn hình'); }}>Màn Hình</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect('tai nghe'); }}>Tai Nghe</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect('phụ kiện'); }}>Phụ Kiện</a></li>
            </ul>
          </div>
            
          <div className={`link-group ${activeSections.company ? 'active' : ''}`}>
            <h4 onClick={() => toggleSection('company')}>Công Ty</h4>
            <ul>
              <li><Link to="/about">Về Chúng Tôi</Link></li>
              <li><Link to="/careers">Tuyển Dụng</Link></li>
              <li><Link to="/news">Tin Tức</Link></li>
                <li><Link to="/promotions">Khuyến Mãi</Link></li>
                <li><Link to="/contact">Liên Hệ</Link></li>
            </ul>
          </div>
            
          <div className={`link-group ${activeSections.support ? 'active' : ''}`}>
              <h4 onClick={() => toggleSection('support')}>Hỗ Trợ</h4>
            <ul>
                <li><Link to="/customer-support">Trung Tâm Trợ Giúp</Link></li>
                <li><Link to="/customer-support">FAQ</Link></li>
                <li><Link to="/contact">Liên Hệ</Link></li>
                <li><Link to="/orders">Theo Dõi Đơn Hàng</Link></li>
            </ul>
          </div>
          
          <div className={`link-group ${activeSections.legal ? 'active' : ''}`}>
              <h4 onClick={() => toggleSection('legal')}>Pháp Lý</h4>
              <ul>
                <li><Link to="/terms-conditions">Điều Khoản Sử Dụng</Link></li>
                <li><Link to="/privacy-policy">Chính Sách Bảo Mật</Link></li>
                <li><Link to="/terms-conditions">Chính Sách Bảo Hành</Link></li>
                <li><Link to="/terms-conditions">Quy Định Vận Chuyển</Link></li>
              </ul>
          </div>
        </div>
          
        <div className="newsletter-signup">
          <h4>Đăng Ký Nhận Tin</h4>
          <p>Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt trực tiếp vào hộp thư của bạn!</p>
          
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Email của bạn" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={isSubscribing}
            >
              {isSubscribing ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>
          
          {/* Newsletter subscription message */}
          {showMessage && newsletterMessage && (
            <div className={`newsletter-message ${newsletterMessage.type}`}>
              {newsletterMessage.text}
            </div>
          )}
        </div>
        </div>
        
        <div className="footer-bottom">
        <div className={getSocialClass()} id="social-icons">
            {socialMediaError ? (
              <p className="social-error">Không có liên kết mạng xã hội</p>
            ) : !socialMediaUrls ? (
              <p>Đang tải...</p>
            ) : hasSocialMedia() ? (
              <>
                {socialMediaUrls.facebook && (
                  <a href={socialMediaUrls.facebook} target="_blank" rel="noopener noreferrer">
                    <BsFacebook />
                  </a>
                )}
                {socialMediaUrls.twitter && (
                  <a href={socialMediaUrls.twitter} target="_blank" rel="noopener noreferrer">
                    <BsTwitter />
                  </a>
                )}
                {socialMediaUrls.youtube && (
                  <a href={socialMediaUrls.youtube} target="_blank" rel="noopener noreferrer">
                    <BsYoutube />
                  </a>
                )}
                {socialMediaUrls.discord && (
                  <a href={socialMediaUrls.discord} target="_blank" rel="noopener noreferrer">
                    <BsDiscord />
                  </a>
                )}
                {socialMediaUrls.instagram && (
                  <a href={socialMediaUrls.instagram} target="_blank" rel="noopener noreferrer">
                    <BsInstagram />
                  </a>
                )}
              </>
            ) : (
              <p className="social-error">Không có liên kết mạng xã hội</p>
            )}
        </div>
          
        <div className="copyright">
            <p>© {new Date().getFullYear()} GaMine. Tất cả quyền được bảo lưu. <Link to="/privacy-policy">Chính Sách Bảo Mật</Link> | <Link to="/terms-conditions">Điều Khoản & Điều Kiện</Link></p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 