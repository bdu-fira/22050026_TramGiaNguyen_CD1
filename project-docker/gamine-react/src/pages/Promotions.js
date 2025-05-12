import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Promotions.css';
import { promotionsService } from '../services/promotionsService';
import { subscribeToNewsletter } from '../services/api';

// Import images as fallbacks in case server images are unavailable
import cyberpunkCityImg from '../assets/images/cyberpunk-city.jpg';
import mouseImg from '../assets/images/mouse.png';
import keyboardImg from '../assets/images/keyboard.png';
import controllerImg from '../assets/images/controller.png';
import headsetImg from '../assets/images/Headsets.png';
import unMatchedImg from '../assets/images/Unmatched Performance.png';
import newGearImg from '../assets/images/New Gear Drop.png';
import techUpdatesImg from '../assets/images/Tech Updates.png';

// Default fallback images array for loading states
const defaultImages = [
  mouseImg, keyboardImg, controllerImg, headsetImg, 
  unMatchedImg, newGearImg, techUpdatesImg
];

function Promotions() {
  const [activeTab, setActiveTab] = useState('current');
  const [promotionsData, setPromotionsData] = useState({
    featured: {},
    promotions: {
      current: [],
      upcoming: [],
      expired: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add state for newsletter
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState(null);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  useEffect(() => {
    // Fetch promotions data from the backend
    const fetchPromotions = async (retryCount = 0) => {
      try {
        setLoading(true);
        const data = await promotionsService.getPromotions();
        
        // Check if we got valid data
        if (!data || !data.promotions) {
          throw new Error('Invalid data structure returned from API');
        }
        
        setPromotionsData(data);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching promotions:', err);
        
        // Retry up to 2 times with increasing delay
        if (retryCount < 2) {
          console.log(`Retrying fetch promotions (attempt ${retryCount + 1})...`);
          setTimeout(() => {
            fetchPromotions(retryCount + 1);
          }, 1000 * (retryCount + 1)); // 1s, then 2s delay
          return;
        }
        
        setError('Không thể tải khuyến mãi. Vui lòng thử lại sau.');
        
        // Fall back to demo data if API fails
        setPromotionsData({
          featured: {
            title: "Bộ Sưu Tập Cyberpunk",
            description: "Giới thiệu dòng sản phẩm mới nhất lấy cảm hứng từ phong cách tương lai cyberpunk. Đặt hàng ngay để nhận miễn phí bàn di chuột phiên bản giới hạn với bất kỳ sản phẩm nào từ bộ sưu tập.",
            code: "CYBER2023",
            image: cyberpunkCityImg
          },
          promotions: {
            current: [
              {
                id: 1,
                title: "Lễ Hội Gaming Mùa Hè",
                description: "Giảm đến 30% cho màn hình gaming và phụ kiện được chọn. Ngoài ra, miễn phí vận chuyển cho đơn hàng trên 5.000.000 VNĐ.",
                code: "SUMMER30",
                expires: "31/07/2023",
                image: mouseImg
              },
              {
                id: 2,
                title: "Ưu Đãi Dành Cho Người Dùng Mới",
                description: "Khách hàng lần đầu nhận được giảm giá 10% cho lần mua hàng đầu tiên. Đăng ký ngay để nhận ưu đãi!",
                code: "NEWUSER10",
                expires: "Không giới hạn",
                image: keyboardImg
              },
              {
                id: 3,
                title: "Ưu Đãi Bộ Cyberpunk",
                description: "Mua Chuột Neon và Bàn Phím Cyber cùng nhau để được giảm 15% giá thường.",
                code: "CYBER15",
                expires: "15/08/2023",
                image: controllerImg
              }
            ],
            upcoming: [
              {
                id: 4,
                title: "Ưu Đãi Mùa Tựu Trường",
                description: "Học sinh, sinh viên được giảm 20% với thẻ học sinh, sinh viên hợp lệ. Thời điểm hoàn hảo để nâng cấp thiết bị trước học kỳ mới!",
                code: "Coming soon",
                expires: "Bắt đầu từ 01/08/2023",
                image: headsetImg
              },
              {
                id: 5,
                title: "Giải Vô Địch Gaming Mùa Thu",
                description: "Chuẩn bị cho giải đấu trực tuyến của chúng tôi với ưu đãi đặc biệt cho các thiết bị ngoại vi cấp độ chuyên nghiệp.",
                code: "Coming soon",
                expires: "Bắt đầu từ 15/09/2023",
                image: unMatchedImg
              }
            ],
            expired: [
              {
                id: 6,
                title: "Flash Sale Mùa Xuân",
                description: "Khuyến mãi flash 48 giờ với giảm giá lên đến 40% cho các sản phẩm mùa trước.",
                code: "FLASH40",
                expires: "Đã hết hạn 15/05/2023",
                image: newGearImg
              },
              {
                id: 7,
                title: "Dịp Cuối Tuần",
                description: "Ưu đãi đặc biệt trên tất cả các sản phẩm cộng với điểm thưởng gấp đôi.",
                code: "MEMORIAL23",
                expires: "Đã hết hạn 29/05/2023",
                image: techUpdatesImg
              }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  // Get the featured promotion or a fallback
  const featuredPromotion = promotionsData.featured || {
    title: "Đang tải khuyến mãi nổi bật...",
    description: "Vui lòng đợi trong khi chúng tôi tải các khuyến mãi mới nhất.",
    code: "...",
    image: cyberpunkCityImg
  };

  // Get the active promotions based on tab
  const activePromotions = 
    promotionsData.promotions?.[activeTab] || [];

  // Handle image error
  const handleImageError = (e) => {
    // Set a random fallback image
    const randomIndex = Math.floor(Math.random() * defaultImages.length);
    e.target.src = defaultImages[randomIndex];
  };

  // Handle newsletter form submission
  const handleNewsletterSignup = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      setSubscribeMessage('Vui lòng nhập địa chỉ email hợp lệ');
      setSubscribeSuccess(false);
      return;
    }
    
    setSubscribing(true);
    setSubscribeMessage(null);
    
    try {
      const result = await subscribeToNewsletter(email);
      
      if (result.success) {
        setSubscribeSuccess(true);
        setSubscribeMessage(result.message);
        setEmail(''); // Clear input on success
      } else {
        setSubscribeSuccess(false);
        setSubscribeMessage(result.message);
      }
    } catch (err) {
      setSubscribeSuccess(false);
      setSubscribeMessage('Không thể đăng ký. Vui lòng thử lại sau.');
      console.error('Newsletter subscription error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="page-container promotions-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      <div className="promotions-header">
        <h2>Ưu Đãi & Khuyến Mãi Đặc Biệt</h2>
        <p>Các ưu đãi độc quyền cho thiết bị gaming cao cấp của chúng tôi</p>
      </div>

      <div className="about-content">
        {loading ? (
          <div className="loading-indicator">Đang tải khuyến mãi...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="featured-promotion">
              <div className="featured-content">
                <h3>Ưu Đãi Nổi Bật</h3>
                <h4>{featuredPromotion.title}</h4>
                <p>{featuredPromotion.description}</p>
                <Link to={`/products?promotion=${featuredPromotion.id || featuredPromotion.promotion_id || 'featured'}`} className="shop-now-btn">Mua Ngay</Link>
              </div>
              <div className="featured-image">
                <img 
                  src={featuredPromotion.image} 
                  alt={featuredPromotion.title} 
                  onError={handleImageError}
                />
              </div>
            </div>

            <div className="about-section">
              <div className="promotions-tabs">
                <button 
                  className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
                  onClick={() => setActiveTab('current')}
                >
                  Ưu Đãi Hiện Tại
                </button>
                <button 
                  className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Ưu Đãi Sắp Tới
                </button>
              </div>

              <div className="promotions-grid">
                {activePromotions.length === 0 ? (
                  <div className="no-promotions-message">
                    Không có ưu đãi {activeTab === 'current' ? 'hiện tại' : activeTab === 'upcoming' ? 'sắp tới' : 'đã hết hạn'} vào thời điểm này.
                  </div>
                ) : (
                  activePromotions.map((promo) => (
                    <div className="promo-card" key={promo.id}>
                      <div className="promo-image">
                        <img 
                          src={promo.image} 
                          alt={promo.title} 
                          onError={handleImageError} 
                        />
                      </div>
                      <div className="promo-content">
                        <h4>{promo.title}</h4>
                        <p>{promo.description}</p>
                        <div className="promo-details">
                          <div className="promo-expiry">
                            <span>Hết hạn:</span>
                            <strong>{promo.expires}</strong>
                          </div>
                        </div>
                        {activeTab !== 'expired' && (
                          <Link to={`/products?promotion=${promo.id}`} className="use-promo-btn">Mua Ngay</Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div className="about-section">
          <div className="newsletter-signup">
            <h3>Không Bỏ Lỡ Ưu Đãi Nào</h3>
            <p>Đăng ký nhận bản tin của chúng tôi để nhận các khuyến mãi độc quyền và cập nhật về sản phẩm mới nhất, ưu đãi đặc biệt và sự kiện gaming.</p>
            
            {subscribeMessage && (
              <div className={`newsletter-message ${subscribeSuccess ? 'success' : 'error'}`}>
                {subscribeMessage}
              </div>
            )}
            
            <form className="newsletter-form" onSubmit={handleNewsletterSignup}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email của bạn" 
                disabled={subscribing}
              />
              <button type="submit" disabled={subscribing}>
                {subscribing ? 'Đang đăng ký...' : 'Đăng Ký'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Promotions; 