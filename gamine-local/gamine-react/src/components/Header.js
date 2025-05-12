import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { fetchCategories, getUserCart } from '../services/api';
import { useAuth } from '../services/AuthContext';
import activityTracker from '../services/ActivityTracker';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const userDropdownRef = useRef(null);
  const accountBtnRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra xem có danh mục đang được chọn từ URL hay không
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryFromUrl = queryParams.get('category');
    
    if (categoryFromUrl) {
      setActiveCategoryId(parseInt(categoryFromUrl));
    } else {
      // Hỗ trợ cả định dạng URL cũ /products/category/:id
      if (location.pathname.includes('/products/category/')) {
        const pathParts = location.pathname.split('/');
        const categoryId = pathParts[pathParts.length - 1];
        if (categoryId && !isNaN(categoryId)) {
          setActiveCategoryId(parseInt(categoryId));
        } else {
          setActiveCategoryId(null);
        }
      } else {
        setActiveCategoryId(null);
      }
    }
  }, [location]);

  // Fetch cart items from API 
  const fetchCartItems = async (userId) => {
    if (!userId) return;
    
    try {
      const response = await getUserCart(userId);
      console.log('Dữ liệu giỏ hàng từ Header:', response);
      
      // Cập nhật logic đếm: chỉ đếm số loại sản phẩm, không phải tổng số lượng
      if (response && response.cart_items) {
        // Đếm số lượng sản phẩm khác nhau trong giỏ hàng
        const productCount = response.cart_items.length;
        
        // Kiểm tra xem số lượng có thay đổi không
        if (productCount !== cartCount) {
          // Nếu có thay đổi, thêm hiệu ứng nhấp nháy cho icon giỏ hàng
          const cartButton = document.querySelector('.cart-btn');
          if (cartButton) {
            cartButton.classList.add('cart-updated');
            setTimeout(() => {
              cartButton.classList.remove('cart-updated');
            }, 1000);
          }
        }
        
        setCartCount(productCount);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin giỏ hàng:', error);
      setCartCount(0);
    }
  };

  // Add scroll event listener to detect when user scrolls down
  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    try {
      const userDataStr = localStorage.getItem('user');
      const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
      const isUserLoggedIn = !!userInfo && !!userInfo.user_id;
      
      setIsLoggedIn(isUserLoggedIn);
      setUserData(userInfo);
      
      console.log('Trạng thái đăng nhập:', isUserLoggedIn, userInfo);

      // Nếu đã đăng nhập, lấy thông tin giỏ hàng từ API
      if (isUserLoggedIn) {
        fetchCartItems(userInfo.user_id);
      } else {
        // Nếu chưa đăng nhập, giỏ hàng trống
        setCartCount(0);
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
      setIsLoggedIn(false);
      setCartCount(0);
    }

    // Scroll handler
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  // Đăng ký lắng nghe sự kiện cập nhật giỏ hàng từ các trang khác
  useEffect(() => {
    // Định nghĩa hàm xử lý sự kiện cập nhật giỏ hàng
    const handleCartUpdate = (event) => {
      if (event.detail && event.detail.type === 'CART_UPDATED') {
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (userInfo && userInfo.user_id) {
          fetchCartItems(userInfo.user_id);
        }
      }
    };

    // Đăng ký lắng nghe sự kiện cập nhật giỏ hàng
    window.addEventListener('cartUpdate', handleCartUpdate);

    // Xóa lắng nghe khi component unmount
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, []);

  // Cập nhật giỏ hàng khi thay đổi trang (nếu cần)
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user'));
    if (userInfo && userInfo.user_id) {
      fetchCartItems(userInfo.user_id);
    }
  }, [location.pathname]);

  // Fetch danh mục sản phẩm từ API
  useEffect(() => {
    const getCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    getCategories();
  }, []);

  // Thêm useEffect mới để lấy thông tin người dùng từ localStorage
  useEffect(() => {
    if (isLoggedIn) {
      try {
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
          const parsedUserData = JSON.parse(userDataStr);
          setUserData(parsedUserData);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [isLoggedIn]);

  // Thêm useEffect để đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if dropdown is open first to avoid unnecessary processing
      if (!isUserDropdownOpen) return;
      
      console.log('Click detected, checking if outside dropdown...');
      
      // Check specifically if click is on the account button to avoid conflict
      if (accountBtnRef.current && accountBtnRef.current.contains(event.target)) {
        console.log('Click trên nút account, giữ nguyên dropdown');
        return; // Don't do anything if clicking the account button
      }
      
      // Check if the click is outside the dropdown
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        console.log('Click outside detected, closing dropdown');
        setIsUserDropdownOpen(false);
      } else {
        console.log('Click inside dropdown, giữ nguyên dropdown');
      }
    };

    // Sử dụng mousedown thay vì click để bắt sự kiện sớm hơn
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close search when menu is toggled
    if (isSearchOpen) {
      setIsSearchOpen(false);
    }
  };

  // Toggle search form
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    // Close menu when search is toggled
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  // Add function to toggle mobile dropdown
  const toggleMobileDropdown = (e) => {
    // Check if on mobile view
    if (window.innerWidth <= 768) {
      e.preventDefault();
      const parentLi = e.currentTarget.parentNode;
      
      // Toggle active class on the dropdown
      if (parentLi.classList.contains('dropdown')) {
        parentLi.classList.toggle('active');
      }
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    // Đảm bảo ngăn chặn sự kiện mặc định
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("[Header] Form submit event triggered");
    if (searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim();
      console.log(`[Header] Thực hiện tìm kiếm với từ khóa: "${trimmedQuery}"`);
      
      // Track search activity if user is logged in
      const userDataStr = localStorage.getItem('user');
      const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
      if (userInfo && userInfo.user_id) {
        activityTracker.trackSearch(trimmedQuery);
      }
      
      const searchPath = `/products?search=${encodeURIComponent(trimmedQuery)}`;
      console.log(`[Header] Chuyển hướng đến: ${searchPath}`);
      navigate(searchPath);
      setSearchQuery('');
      setIsSearchOpen(false);
    } else {
      console.log('[Header] Từ khóa tìm kiếm trống, không thực hiện tìm kiếm');
      // Focus vào input để user có thể nhập ngay
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  // Đảm bảo dropdown hiển thị đúng bằng cách xử lý cả hai sự kiện
  const handleAccountButtonClick = (e) => {
    // Ngăn chặn mọi hành vi mặc định triệt để
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Account button clicked, current state:', isUserDropdownOpen);
    
    // Đảm bảo nút là button type="button" để tránh hành vi submit
    // Toggle dropdown state
    setIsUserDropdownOpen((prevState) => !prevState);
    
    // Ngăn chặn bubbling để không lan tới elements khác
    return false;
  };

  // Toggle user dropdown
  const toggleUserDropdown = (e) => {
    // QUAN TRỌNG: Đảm bảo ngăn chặn sự kiện mặc định và lan truyền
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Toggle user dropdown, current state:', isUserDropdownOpen);
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Handle category selection - Hàm mới để xử lý việc chọn danh mục và lọc sản phẩm
  const handleCategorySelect = (categoryId, e) => {
    e.preventDefault();
    console.log(`Chọn danh mục: ${categoryId}`);
    // Cập nhật trạng thái active
    setActiveCategoryId(categoryId);
    // Chuyển hướng đến trang sản phẩm với tham số danh mục
    navigate(`/products?category=${categoryId}`);
    // Đóng dropdown sau khi chọn
    if (isMenuOpen) setIsMenuOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false);
    setCartCount(0); // Reset số lượng giỏ hàng khi đăng xuất
    navigate('/');
    
    // Add a small delay before refreshing to ensure navigation completes
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Scroll to footer contact section and highlight social icons
  const scrollToContactSection = (e) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact-section');
    const socialIcons = document.getElementById('social-icons');

    if (contactSection) {
      // Scroll to contact section
      contactSection.scrollIntoView({ behavior: 'smooth' });
      
      // Đợi cuộn hoàn tất (khoảng 700ms) trước khi tạo hiệu ứng sóng
      setTimeout(() => {
        // Create wave container if it doesn't exist
        let waveContainer = document.getElementById('wave-container');
        if (!waveContainer) {
          waveContainer = document.createElement('div');
          waveContainer.id = 'wave-container';
          waveContainer.className = 'wave-container';
          
          // Add a grid background
          const waveGrid = document.createElement('div');
          waveGrid.className = 'wave-grid';
          waveContainer.appendChild(waveGrid);
          
          // Add a pulse effect
          const wavePulse = document.createElement('div');
          wavePulse.className = 'wave-pulse';
          waveContainer.appendChild(wavePulse);
          
          document.body.appendChild(waveContainer);
        }
        
        // Simply add glow effect to the social icons
        if (socialIcons) {
          // Lấy lại vị trí của socialIcons sau khi cuộn (quan trọng!)
          const iconsBounds = socialIcons.getBoundingClientRect();
          const centerX = iconsBounds.left + iconsBounds.width / 2;
          const centerY = iconsBounds.top + iconsBounds.height / 2;
          
          // Create ripple elements
          for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'wave-ripple';
            ripple.style.left = `${centerX}px`;
            ripple.style.top = `${centerY}px`;
            ripple.style.animationDelay = `${i * 2}s`;
            waveContainer.appendChild(ripple);
          }
          
          // Show wave container
          waveContainer.classList.add('active');
          
          // Highlight original icons with glow effect
          socialIcons.classList.add('glow-effect');
          
          // Create simple audio feedback (if supported)
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const audioCtx = new AudioContext();
              
              // Create oscillator for feedback sound
              const oscillator = audioCtx.createOscillator();
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
              
              // Create gain node for volume control
              const gainNode = audioCtx.createGain();
              gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
              gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
              
              // Connect nodes
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
              // Start and stop
              oscillator.start();
              oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.5);
              setTimeout(() => oscillator.stop(), 1000);
            }
          } catch (e) {
            console.log('Web Audio API not supported');
          }
          
          // Remove effects after 15 seconds
          setTimeout(() => {
            waveContainer.classList.remove('active');
            socialIcons.classList.remove('glow-effect');
            
            // Clean up ripples after transition
            setTimeout(() => {
              if (waveContainer) {
                const ripples = waveContainer.querySelectorAll('.wave-ripple');
                ripples.forEach(ripple => ripple.remove());
              }
            }, 500);
          }, 15000);
        }
      }, 700); // Thêm độ trễ để đảm bảo cuộn xuống hoàn tất
    }
  };

  // Thêm useEffect mới để lắng nghe sự kiện đăng nhập thành công
  useEffect(() => {
    // Hàm để kiểm tra login status dựa trên localStorage
    const checkLoginStatus = () => {
      try {
        const userToken = localStorage.getItem('userToken');
        const userDataStr = localStorage.getItem('user');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const isUserLoggedIn = !!userToken && !!userData && !!userData.user_id;
        
        console.log('Header-kiểm tra trạng thái đăng nhập:', isUserLoggedIn, userData);
        
        setIsLoggedIn(isUserLoggedIn);
        if (isUserLoggedIn && userData) {
          setUserData(userData);
          fetchCartItems(userData.user_id);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra login status:', error);
      }
    };
    
    // Lắng nghe sự kiện storage để phát hiện thay đổi trong localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'userToken' || e.key === 'user') {
        console.log('localStorage thay đổi, cập nhật trạng thái đăng nhập');
        checkLoginStatus();
      }
    };
    
    // Kiểm tra trạng thái đăng nhập ban đầu
    checkLoginStatus();
    
    // Lắng nghe sự kiện storage
    window.addEventListener('storage', handleStorageChange);
    
    // Tạo custom event listener cho login/logout
    const handleLoginStatusChange = () => {
      console.log('Phát hiện login status change, cập nhật lại trạng thái');
      checkLoginStatus();
    };
    
    window.addEventListener('loginStatusChange', handleLoginStatusChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStatusChange', handleLoginStatusChange);
    };
  }, []);

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Animated header elements */}
        <div className="header-neon-line"></div>
        <div className="header-neon-line"></div>
        <div className="cyber-circuit"></div>
        
        {/* Logo */}
        <div className="logo">
          <Link to="/">
            <h1>GaMine<span className="logo-dot">.</span></h1>
          </Link>
        </div>
        
        {/* Main Navigation */}
        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul>
            <li><Link to="/">Trang Chủ</Link></li>
            <li className="dropdown">
              <Link to="/products" onClick={(e) => {
                // For desktop: navigate to products page
                if (window.innerWidth > 768) {
                  // Allow normal navigation
                } else {
                  // For mobile: toggle dropdown instead of navigating
                  e.preventDefault();
                  toggleMobileDropdown(e);
                }
              }}>Sản Phẩm</Link>
              <div className="dropdown-content">
                <div className="dropdown-grid">
                  {loading ? (
                    <div>Đang tải danh mục...</div>
                  ) : (
                    categories.map((category) => (
                      <a 
                        href="#" 
                        className={`dropdown-item ${activeCategoryId === category.category_id ? 'active' : ''}`}
                        key={category.category_id}
                        onClick={(e) => handleCategorySelect(category.category_id, e)}
                      >
                        <div className="item-image">
                          <img src={category.img_url} alt={category.name} style={{ width: '40px', height: '40px' }} />
                        </div>
                        <p>{category.name}</p>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </li>
            <li><Link to="/promotions">Khuyến Mãi</Link></li>
            <li><Link to="/news">Tin Tức</Link></li>
            <li><Link to="/about">Giới Thiệu</Link></li>
            <li><a href="#contact-section" onClick={scrollToContactSection}>Liên Hệ</a></li>
          </ul>
        </nav>

        {/* Header Right Section */}
        <div className="header-right">
          {/* Search Form */}
          <form 
            className={`search-form ${isSearchOpen ? 'open' : ''}`} 
            onSubmit={handleSearchSubmit} 
            role="search"
            action="/products"
            method="get"
          >
            <input 
              ref={searchInputRef}
              type="text" 
              name="search"
              placeholder="Tìm kiếm sản phẩm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('[Header] Enter key pressed in search input');
                  handleSearchSubmit(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="search-btn" 
              aria-label="Tìm kiếm"
            >
              <i className="fas fa-search btn-icon"></i>
              <span className="btn-text">Tìm Kiếm</span>
            </button>
          </form>
          
          {/* Header Actions */}
          <div className="header-actions">
            {isLoggedIn ? (
              <div className="user-dropdown-container">
                <button 
                  ref={accountBtnRef}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleAccountButtonClick(e);
                  }} 
                  className="action-btn account-btn"
                  aria-label="User menu"
                  aria-expanded={isUserDropdownOpen}
                >
                  <i className="fas fa-user btn-icon"></i>
                </button>
                {isUserDropdownOpen && (
                  <div className="user-dropdown" ref={userDropdownRef}>
                    <div className="user-info">
                      <i className="fas fa-user-circle user-icon"></i>
                      <div className="user-details">
                        <span className="user-name">{userData?.username || 'Người dùng'}</span>
                        <span className="user-email">{userData?.email || ''}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <i className="fas fa-id-card"></i>
                      <span>Thông tin tài khoản</span>
                    </Link>
                    <Link to="/orders" className="user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <i className="fas fa-shopping-bag"></i>
                      <span>Đơn hàng của tôi</span>
                    </Link>
                    <Link to="/wishlist" className="user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <i className="fas fa-heart"></i>
                      <span>Danh sách yêu thích</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="user-dropdown-item logout-item">
                      <i className="fas fa-sign-out-alt"></i>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login-register" className="action-btn account-btn">
                <i className="fas fa-user btn-icon"></i>
              </Link>
            )}
            <Link to="/cart" className="action-btn cart-btn">
              <i className="fas fa-shopping-cart btn-icon"></i>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
          </div>
          
          {/* Mobile Buttons */}
          <div className="mobile-buttons">
            <button 
              className={`menu-toggle-btn ${isMenuOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span className="menu-bar"></span>
              <span className="menu-bar"></span>
              <span className="menu-bar"></span>
            </button>
            <button 
              className="search-toggle-btn" 
              onClick={toggleSearch}
              aria-label="Toggle search"
            >
              <i className="fas fa-search search-icon"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header; 