import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { 
  fetchCategories, 
  fetchPromotions, 
  fetchProducts, 
  getProductDiscountedPrice, 
  addToCart, 
  subscribeToNewsletter,
  fetchFaqs,
  fetchSocialMediaUrls 
} from '../services/api';
// Import các icon cho Why Choose Us section
import precisionIcon from '../assets/images/Precision Engineering.png';
import performanceIcon from '../assets/images/Unmatched Performance.png';
import aestheticsIcon from '../assets/images/Cyberpunk Aesthetics.png';

function Home() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const featuredRef = useRef(null);
  const whyChooseUsRef = useRef(null);
  const newsRef = useRef(null);
  const newsletterRef = useRef(null);
  const bannerRef = useRef(null);
  const promotionSliderRef = useRef(null);

  // State for products, categories, promotions and blogs from database
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [currentPromotion, setCurrentPromotion] = useState(0);

  // State for cart functionality
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);

  // Promo banner state
  const [showPromo, setShowPromo] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Mouse move effect for hero section
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e) => {
    if (heroRef.current) {
      const { clientX, clientY } = e;
      const { width, height } = heroRef.current.getBoundingClientRect();
      const x = (clientX / width - 0.5) * 20;
      const y = (clientY / height - 0.5) * 20;
      setMousePosition({ x, y });
    }
  };

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Fetch data from databases 
  useEffect(() => {
    // Fetch real promotions data from API
    const getPromotions = async () => {
      try {
        const data = await fetchPromotions();
        console.log("Promotions data from API:", data);
        
        // Kiểm tra và đảm bảo rằng đường dẫn hình ảnh hoàn chỉnh
        const processedData = data.map(promotion => {
          // Sao chép đối tượng promotion để tránh thay đổi trực tiếp dữ liệu API
          const updatedPromotion = {...promotion};
          
          // Thêm fallback image để đảm bảo luôn có hình ảnh
          if (!updatedPromotion.img_banner || updatedPromotion.img_banner === '') {
            updatedPromotion.img_banner = '/assets/images/keyboard.png';
          }
          
          console.log(`Promotion ${updatedPromotion.promotion_id}: ${updatedPromotion.img_banner}`);
          return updatedPromotion;
        });
        
        console.log("Processed promotions data:", processedData);
        setPromotions(processedData);
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
        // Fallback to static data if API fails
        const promotionsData = [
          {
            promotion_id: 1,
            title: "Giảm giá Tháng 6",
            description: "Giảm giá 20% cho tất cả bàn phím",
            discount_percentage: 20,
            start_date: "2023-06-01T00:00:00Z",
            end_date: "2023-06-30T23:59:59Z",
            img_banner: "/assets/images/keyboard.png"
          },
          {
            promotion_id: 2,
            title: "Miễn phí vận chuyển",
            description: "Miễn phí vận chuyển cho đơn hàng trên 500K",
            discount_percentage: null,
            start_date: "2023-06-15T00:00:00Z",
            end_date: "2023-07-15T23:59:59Z",
            img_banner: "/assets/images/mouse.png"
          },
          {
            promotion_id: 3,
            title: "Tai nghe GaMine X9",
            description: "Sản phẩm mới: Tai nghe GaMine X9 - Giảm 30%",
            discount_percentage: 30,
            start_date: "2023-07-01T00:00:00Z",
            end_date: "2023-07-31T23:59:59Z",
            img_banner: "/assets/images/Headsets.png"
          }
        ];
        setPromotions(promotionsData);
      }
    };

    // Fetch categories data from API
    const getCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }
    };

    // Fetch featured products (4 sản phẩm mới nhất)
    const getFeaturedProducts = async () => {
      try {
        const allProducts = await fetchProducts();
        
        // Sắp xếp sản phẩm theo thời gian tạo, mới nhất đầu tiên
        const sortedProducts = [...allProducts].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // Lấy 4 sản phẩm mới nhất
        const newestProducts = sortedProducts.slice(0, 4);
        
        // Khởi tạo các chỉ mục hình ảnh cho các sản phẩm
        const imageIndexes = {};
        newestProducts.forEach(product => {
          imageIndexes[product.product_id] = 0;
        });
        setCurrentImageIndexes(imageIndexes);
        
        // Lấy thông tin khuyến mãi và giá đã giảm cho mỗi sản phẩm
        const productsWithPromotions = await Promise.all(
          newestProducts.map(async (product) => {
            try {
              const promotionInfo = await getProductDiscountedPrice(product);
              if (promotionInfo) {
                return {
                  ...product,
                  has_promotion: true,
                  discounted_price: promotionInfo.discountedPrice,
                  discount_percentage: promotionInfo.discountPercentage
                };
              }
              return { ...product, has_promotion: false };
            } catch (err) {
              console.error(`Error getting promotions for product ${product.product_id}:`, err);
              return { ...product, has_promotion: false };
            }
          })
        );
        
        setFeaturedProducts(productsWithPromotions);
        console.log('Đã lấy 4 sản phẩm mới nhất:', productsWithPromotions);
      } catch (error) {
        console.error('Không thể tải sản phẩm nổi bật:', error);
        // Fallback to static data if API fails
        setFeaturedProducts([
          {
            product_id: 1,
            name: "Bàn phím Quantum",
            description: "Bàn phím cơ chơi game RGB với công tắc tùy chỉnh",
            price: 3500000,
            stock_quantity: 20,
            sold_quantity: 8,
            category_id: 1,
            created_at: "2023-05-15T10:00:00Z",
            images: [
              { image_id: 1, image_url: "/assets/images/keyboard.png", is_primary: true }
            ],
            isNew: true,
            rating: 5
          },
          // ... other fallback products ...
        ]);
      }
    };

    // Fetch blog posts from API
    const fetchBlogs = async () => {
      try {
        // Use the api service instead of direct axios call
        const response = await fetch(`${getApiUrl()}/blogs/`);
        const blogsData = await response.json() || [];
        
        if (blogsData.length > 0) {
          // Chuyển đổi dữ liệu từ định dạng DB sang định dạng frontend
          const formattedBlogs = blogsData.map(blog => {
            // Xử lý nội dung để loại bỏ các thẻ HTML trong phần tóm tắt
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = blog.content;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            const cleanSummary = plainText.substring(0, 150) + '...';
            
            return {
              blog_id: blog.blog_id,
              title: blog.title,
              content: cleanSummary,
              created_at: blog.created_at,
              // Lấy ảnh đầu tiên hoặc ảnh được đánh dấu là primary
              images: blog.images && blog.images.length > 0 
                ? blog.images
                : [{ image_url: '../assets/images/New Gear Drop.png' }],
              author: blog.author || 'Admin', // Lấy author từ API nếu có
            };
          });
          
          // Sắp xếp bài viết theo thời gian, mới nhất đầu tiên
          const sortedBlogs = [...formattedBlogs].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
          
          // Lấy 3 bài viết mới nhất
          const latestBlogs = sortedBlogs.slice(0, 3);
          setBlogs(latestBlogs);
          console.log('Đã lấy 3 bài viết mới nhất:', latestBlogs);
        } else {
          throw new Error('Không có bài viết nào trong cơ sở dữ liệu');
        }
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
        // Fallback to static data if API fails
        const blogsData = [
          {
            blog_id: 1,
            title: "GaMine Tài Trợ Giải Vô Địch Game Thế Giới",
            content: "Chúng tôi vui mừng thông báo việc tài trợ cho Giải Vô Địch Game Thế Giới năm nay với thiết bị độc quyền cho tất cả người tham gia.",
            created_at: "2023-06-15T10:00:00Z",
            images: [
              { image_id: 1, blog_id: 1, image_url: "/assets/images/New Gear Drop.png", is_primary: true }
            ],
            author: 'Admin'
          },
          {
            blog_id: 2,
            title: "Giới Thiệu Dòng Sản Phẩm Quantum Mới",
            content: "Dòng sản phẩm Quantum mới của chúng tôi có công nghệ phản hồi xúc giác cách mạng và đèn RGB nâng cao để trải nghiệm chơi game đắm chìm.",
            created_at: "2023-06-03T10:00:00Z",
            images: [
              { image_id: 2, blog_id: 2, image_url: "/assets/images/Tech Updates.png", is_primary: true }
            ],
            author: 'Admin'
          },
          {
            blog_id: 3,
            title: "GaMine Control Center 2.0 Đã Ra Mắt",
            content: "Phần mềm cập nhật của chúng tôi giờ đây bao gồm tối ưu hóa hiệu suất bằng AI và các tùy chọn tùy chỉnh nâng cao.",
            created_at: "2023-05-28T10:00:00Z",
            images: [
              { image_id: 3, blog_id: 3, image_url: "/assets/images/Event Recap.png", is_primary: true }
            ],
            author: 'Admin'
          }
        ];
        setBlogs(blogsData);
      }
    };

    console.log("Home component mounted");
    console.log("Hero ref:", heroRef.current);

    // Parallax and scroll effects
    const handleScroll = () => {
      const value = window.scrollY;
      setScrollY(value);
      
      // Parallax effect for hero section
      if (heroRef.current) {
        heroRef.current.style.backgroundPositionY = `${value * 0.5}px`;
      }
      
      // Parallax effect for banner section
      if (bannerRef.current) {
        bannerRef.current.style.backgroundPositionY = `${-value * 0.1 + 200}px`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Intersection Observer for fade-in animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = [
      featuredRef.current,
      whyChooseUsRef.current,
      newsRef.current,
      newsletterRef.current,
      bannerRef.current,
      promotionSliderRef.current
    ];

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    getFeaturedProducts();
    getPromotions();
    getCategories();
    fetchBlogs();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  // Helper function to get API URL (imported from api.js)
  const getApiUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000/api`;
  };

  // Text typing effect for hero subtitle
  const [typedText, setTypedText] = useState('');
  const fullText = "Khám phá các thiết bị ngoại vi chơi game tiên tiến được thiết kế để có hiệu suất tối ưu với thiết kế độc quyền lấy cảm hứng từ phong cách cyberpunk.";
  
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(prev => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
  }, []);

  // Calculate hero transform based on mouse position
  const heroContentTransform = {
    transform: `perspective(1000px) rotateX(${-mousePosition.y / 2}deg) rotateY(${mousePosition.x / 2}deg) translateZ(10px)`
  };
  
  // Get current time for header clock
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format price to VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Auto slider for promotions
  useEffect(() => {
    if (promotions.length > 0) {
      const autoSlideInterval = setInterval(() => {
        setCurrentPromotion((prev) => (prev + 1) % promotions.length);
      }, 5000);
      
      return () => {
        clearInterval(autoSlideInterval);
      };
    }
  }, [promotions.length]);

  // Log the component rendering state
  console.log("Home component rendering");

  // Adjust hero-content margin when promo is shown
  const heroContentStyle = {
    ...heroContentTransform,
    marginTop: showPromo ? '60px' : '0'
  };

  // Product image navigation (thêm hàm để chuyển đổi hình ảnh sản phẩm)
  const prevImage = (productId, imagesCount) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] - 1 + imagesCount) % imagesCount
    }));
  };

  const nextImage = (productId, imagesCount) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] + 1) % imagesCount
    }));
  };

  // Tính giá khuyến mãi nếu có
  const getDiscountedPrice = (product) => {
    if (product.has_promotion && product.discounted_price !== undefined && product.discounted_price !== product.price) {
      return product.discounted_price;
    }
    return null;
  };

  // Handle adding product to cart
  const handleAddToCart = async (product) => {
    try {
      // Lấy thông tin người dùng đăng nhập từ localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.user_id) {
        // Nếu chưa đăng nhập, hiển thị thông báo lỗi
        setCartMessage({type: 'error', text: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'});
        setTimeout(() => setCartMessage(null), 3000);
        return;
      }
      
      setCartLoading(true);
      setActiveProductId(product.product_id);
      setCartMessage(null);
      
      // Gọi API thêm vào giỏ hàng với user_id đúng
      const response = await addToCart(product.product_id, user.user_id, 1);
      
      // Hiển thị thông báo thành công
      setCartMessage({
        type: 'success',
        text: response.message || 'Đã thêm sản phẩm vào giỏ hàng'
      });
      
      // Ẩn thông báo sau 3 giây
      setTimeout(() => setCartMessage(null), 3000);
      
      // Phát sự kiện thông báo cập nhật giỏ hàng
      const event = new CustomEvent('cartUpdate', {
        detail: { type: 'CART_UPDATED', timestamp: new Date().getTime() }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      // Hiển thị thông báo lỗi
      setCartMessage({
        type: 'error',
        text: error.response?.data?.error || 'Không thể thêm sản phẩm vào giỏ hàng'
      });
      
      // Ẩn thông báo sau 3 giây
      setTimeout(() => setCartMessage(null), 3000);
      
    } finally {
      setCartLoading(false);
      setActiveProductId(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', options);
  };

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterMessage({
        type: 'error',
        text: 'Vui lòng nhập địa chỉ email hợp lệ'
      });
      setTimeout(() => setNewsletterMessage(null), 3000);
      return;
    }
    
    setIsSubscribing(true);
    
    try {
      const response = await subscribeToNewsletter(newsletterEmail);
      
      if (response.success) {
        setNewsletterMessage({
          type: 'success',
          text: response.message
        });
        setNewsletterEmail(''); // Clear email input on success
      } else {
        setNewsletterMessage({
          type: 'error',
          text: response.message
        });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setNewsletterMessage(null), 3000);
    } catch (error) {
      setNewsletterMessage({
        type: 'error',
        text: 'Không thể đăng ký. Vui lòng thử lại sau.'
      });
      setTimeout(() => setNewsletterMessage(null), 3000);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="home-page" style={{ overflow: 'hidden' }}>
      {/* Thông báo giỏ hàng */}
      {cartMessage && (
        <div className={`cart-message ${cartMessage.type}`}>
          {cartMessage.text}
        </div>
      )}
      
      {/* Newsletter message notification */}
      {newsletterMessage && (
        <div className={`newsletter-message ${newsletterMessage.type}`}>
          {newsletterMessage.text}
        </div>
      )}

      {/* Promotions Slider Section - Replaces Categories */}
      <section className="promotions-slider-section" ref={promotionSliderRef}>
        <div className="section-header">
          <h3>Khuyến Mãi Nổi Bật</h3>
          <div className="section-line"></div>
        </div>
        
        <div className="promotions-slider">
          <div className="promotion-slides">
            {promotions.map((promotion, index) => (
              <div 
                key={promotion.promotion_id}
                className={`promotion-slide ${index === currentPromotion ? 'active' : ''}`}
              >
                <Link to={`/products?promotion=${promotion.promotion_id}`}>
                  <div className="promotion-image">
                    <img 
                      src={promotion.img_banner || '/assets/images/keyboard.png'} 
                      alt={promotion.title}
                      style={{width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#0f1014'}}
                      onError={(e) => {
                        console.error("Image failed to load:", promotion.img_banner);
                        e.target.onerror = null;
                        e.target.src = '/assets/images/keyboard.png';
                      }}
                    />
                    <div className="promotion-content">
                      <h3>{promotion.title}</h3>
                      <p>{promotion.description}</p>
                      {promotion.discount_percentage && (
                        <span className="discount-badge">Giảm {promotion.discount_percentage}%</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="promotion-dots">
            {promotions.map((_, index) => (
              <span 
                key={index} 
                className={`dot ${index === currentPromotion ? 'active' : ''}`}
                onClick={() => setCurrentPromotion(index)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products section */}
      <section className="featured-products" ref={featuredRef}>
        <div className="section-header">
          <h3>Sản Phẩm Mới Nhất</h3>
          <div className="section-line"></div>
        </div>
        <div className="products-grid">
          {featuredProducts.map(product => {
            const discountedPrice = getDiscountedPrice(product);
            
            // Xử lý hình ảnh sản phẩm
            const hasImages = product.images && product.images.length > 0;
            const imagesCount = hasImages ? product.images.length : 0;
            const currentImageIndex = currentImageIndexes[product.product_id] || 0;
            const currentImage = hasImages 
              ? product.images[currentImageIndex]?.image_url 
              : "../assets/products/placeholder.webp";
              
            // Lấy tên danh mục
            const categoryName = product.category_name || categories.find(cat => parseInt(cat.category_id) === parseInt(product.category_id))?.name || "Chưa phân loại";
            
            // Kiểm tra nếu sản phẩm đang được thêm vào giỏ
            const isLoading = cartLoading && activeProductId === product.product_id;
              
            return (
              <div className="product-box" key={product.product_id}>
                <div className="product-img">
                  {imagesCount > 0 && (
                    <>
                      <button 
                        className="product-img-prev" 
                        onClick={prevImage(product.product_id, imagesCount)}
                        aria-label="Ảnh trước"
                      >
                        &#10094;
                      </button>
                      <img src={currentImage} alt={product.name} />
                      <button 
                        className="product-img-next" 
                        onClick={nextImage(product.product_id, imagesCount)}
                        aria-label="Ảnh tiếp theo"
                      >
                        &#10095;
                      </button>
                      {imagesCount > 1 && (
                        <div className="product-img-dots">
                          {product.images.map((_, index) => (
                            <span 
                              key={index} 
                              className={`product-img-dot ${index === currentImageIndex ? 'active' : ''}`}
                            ></span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="category-tag">
                    {categoryName}
                  </div>
                </div>
                <div className="product-info">
                  <h4 className="product-name">{product.name}</h4>
                  <div className="product-price-container">
                    <div className="product-price">
                      {discountedPrice ? (
                        <>
                          <span className="original-price">{formatPrice(product.price)}</span>
                          <span className="discounted-price">{formatPrice(discountedPrice)}</span>
                        </>
                      ) : (
                        <span className="discounted-price">{formatPrice(product.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="product-actions">
                    <Link to={`/product-detail/${product.product_id}`} className="btn-details">Chi tiết</Link>
                    <button 
                      className={`btn-cart ${isLoading ? 'loading' : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : 'Thêm giỏ'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="view-all-container">
          <Link to="/products" className="cta-button btn-outline">Xem Tất Cả Sản Phẩm</Link>
        </div>
      </section>

      {/* Featured banner based on Promotions table */}
      <section className="featured-banner" ref={bannerRef}>
        <div className="banner-content">
          <h3>BỘ SƯU TẬP MỚI</h3>
          <h2>Project Neon: Phiên Bản Giới Hạn</h2>
          <p>Trải nghiệm các thiết bị ngoại vi độc quyền theo chủ đề cyberpunk với công nghệ đèn RGB tiên tiến</p>
          <Link to="/products/category/limited" className="cta-button">Mua Sắm Bộ Sưu Tập</Link>
        </div>
      </section>

      <section className="why-choose-us" ref={whyChooseUsRef}>
        <div className="section-header">
          <h3>Tại Sao Chọn Chúng Tôi</h3>
          <div className="section-line"></div>
        </div>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon precision">
              <img src={precisionIcon} alt="Kỹ Thuật Chính Xác" />
            </div>
            <h4>Kỹ Thuật Chính Xác</h4>
            <p>Sản phẩm của chúng tôi được chế tạo với vật liệu chất lượng cao nhất và được thiết kế để có hiệu suất đỉnh cao với thời gian phản hồi 1ms và độ chính xác 99,9%.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon performance">
              <img src={performanceIcon} alt="Hiệu Suất Vượt Trội" />
            </div>
            <h4>Hiệu Suất Vượt Trội</h4>
            <p>Tạo lợi thế cạnh tranh với các thiết bị ngoại vi được tối ưu hóa cho chơi game chuyên nghiệp, với cảm biến tiên tiến và linh kiện bền bỉ.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon design">
              <img src={aestheticsIcon} alt="Thẩm Mỹ Cyberpunk" />
            </div>
            <h4>Thẩm Mỹ Cyberpunk</h4>
            <p>Nổi bật với thiết kế độc đáo lấy cảm hứng từ cyberpunk, với đèn RGB có thể tùy chỉnh và thẩm mỹ tương lai.</p>
          </div>
        </div>
      </section>

      {/* Latest news section based on Blog table */}
      <section className="latest-news" ref={newsRef}>
        <div className="section-header">
          <h3>Tin Tức Mới Nhất</h3>
          <div className="section-line"></div>
        </div>
        <div className="news-grid">
          {blogs.map(blog => {
            const blogDate = new Date(blog.created_at);
            const day = blogDate.getDate();
            const month = blogDate.toLocaleString('default', { month: 'short' }).toUpperCase();
            
            // Lấy ảnh đầu tiên hoặc ảnh được đánh dấu là primary
            const blogImage = blog.images && blog.images.length > 0 
              ? (blog.images.find(img => img.is_primary)?.image_url || blog.images[0].image_url)
              : '/assets/images/New Gear Drop.png';
            
            return (
              <div className="news-card" key={blog.blog_id}>
                <div className="news-image">
                  <img 
                    src={blogImage} 
                    alt={blog.title}
                    onError={(e) => {
                      console.error("Blog image failed to load:", blogImage);
                      e.target.onerror = null;
                      e.target.src = '/assets/images/New Gear Drop.png';
                    }}
                  />
                  <div className="news-date">
                    <span className="day">{day}</span>
                    <span className="month">{month}</span>
                  </div>
                </div>
                <div className="news-content">
                  <h4>{blog.title}</h4>
                  <p>{blog.content}</p>
                  <Link to={`/news/${blog.blog_id}`} className="news-link">Đọc Thêm</Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="view-all-container">
          <Link to="/news" className="cta-button btn-outline">Xem Tất Cả Tin Tức</Link>
        </div>
      </section>

      {/* Newsletter section - would connect to a mailing list database */}
      <section className="newsletter" ref={newsletterRef}>
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h3>Cập Nhật Thông Tin</h3>
            <p>Đăng ký nhận bản tin của chúng tôi để nhận ưu đãi độc quyền, cập nhật sản phẩm và mẹo chơi game.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Địa chỉ email của bạn" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required 
              />
              <button 
                type="submit"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Đang đăng ký...' : 'Đăng Ký'}
              </button>
            </form>
          </div>
        </div>
      </section>
      
      {/* Floating "Back to Top" button that appears after scrolling */}
      {scrollY > 500 && (
        <button 
          className="back-to-top" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default Home;