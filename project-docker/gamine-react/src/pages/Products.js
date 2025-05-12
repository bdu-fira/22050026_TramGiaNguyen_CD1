import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Products.css';
import { 
  fetchCategories, fetchProducts, fetchProductsByCategory, 
  fetchProductsBySearchQuery, fetchReviews, fetchPromotions, 
  addToCart, fetchProductPromotions, isPromotionActive,
  getProductDiscountedPrice, fetchReviewsByProductId, 
  fetchProductsByPromotion
} from '../services/api';
import activityTracker from '../services/ActivityTracker';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for promotions slider
  const [promotions, setPromotions] = useState([]);
  const [currentPromotion, setCurrentPromotion] = useState(0);

  // Add a state for product reviews
  const [productReviews, setProductReviews] = useState({});

  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);

  // Calculate the indices for slicing the products array
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  // Add a state for selected promotion
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  // Kết hợp useEffect xử lý URL và xử lý lấy sản phẩm thành một
  useEffect(() => {
    // Xử lý URL parameters
    const handleUrlParams = () => {
      const queryParams = new URLSearchParams(location.search);
      const categoryFromUrl = queryParams.get('category');
      const searchFromUrl = queryParams.get('search');
      const promotionFromUrl = queryParams.get('promotion');
      
      // Thiết lập promotion từ URL
      let promotionId = null;
      if (promotionFromUrl) {
        promotionId = parseInt(promotionFromUrl);
        setSelectedPromotion(promotionId);
        
        // Track promotion view if user is logged in
        const userDataStr = localStorage.getItem('user');
        const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
        if (userInfo && userInfo.user_id) {
          activityTracker.trackPromotionView(promotionId);
        }
      } else {
        setSelectedPromotion(null);
      }
      
      // Thiết lập category từ URL
      let categoryId = null;
      if (categoryFromUrl) {
        categoryId = parseInt(categoryFromUrl);
        setSelectedCategory(categoryId);
        
        // Track category view if user is logged in
        const userDataStr = localStorage.getItem('user');
        const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
        if (userInfo && userInfo.user_id) {
          activityTracker.trackCategoryView(categoryId);
        }
      } else if (location.pathname.includes('/products/category/')) {
        // Hỗ trợ cả định dạng URL cũ /products/category/:id
        const pathParts = location.pathname.split('/');
        const catIdFromPath = pathParts[pathParts.length - 1];
        if (catIdFromPath && !isNaN(catIdFromPath)) {
          categoryId = parseInt(catIdFromPath);
          setSelectedCategory(categoryId);
          
          // Track category view if user is logged in
          const userDataStr = localStorage.getItem('user');
          const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
          if (userInfo && userInfo.user_id) {
            activityTracker.trackCategoryView(categoryId);
          }
        }
      } else {
        setSelectedCategory(null);
      }
      
      // Thiết lập search query từ URL
      let search = '';
      if (searchFromUrl) {
        console.log(`[Products] Nhận được từ khóa tìm kiếm từ URL: "${searchFromUrl}"`);
        search = searchFromUrl;
        setSearchQuery(search);
        
        // Track search activity if user is logged in
        const userDataStr = localStorage.getItem('user');
        const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
        if (userInfo && userInfo.user_id) {
          activityTracker.trackSearch(search);
        }
      } else {
        setSearchQuery('');
      }
      
      return { promotionId, categoryId, search };
    };

    // Lấy sản phẩm dựa trên các thông số đã xử lý từ URL
    const fetchFilteredProducts = async () => {
      try {
        setLoadingProducts(true);
        
        // Xử lý URL params trước
        const { promotionId, categoryId, search } = handleUrlParams();
        
        let filteredData = [];
        
        // Handle promotion filter first
        if (promotionId) {
          console.log(`[Products] Fetching products for promotion ID: ${promotionId}`);
          filteredData = await fetchProductsByPromotion(promotionId);
          
          // Apply category filter if both promotion and category are selected
          if (categoryId) {
            console.log(`[Products] Further filtering promotion results by category ID: ${categoryId}`);
            filteredData = filteredData.filter(product => {
              const productCategoryId = parseInt(product.category_id);
              return productCategoryId === categoryId;
            });
          }
          
          // Apply search if both promotion and search are specified
          if (search) {
            console.log(`[Products] Further filtering promotion results by search query: "${search}"`);
            const searchResults = await fetchProductsBySearchQuery(search);
            const searchProductIds = searchResults.map(p => p.product_id);
            filteredData = filteredData.filter(product => 
              searchProductIds.includes(product.product_id)
            );
          }
        }
        // If no promotion filter, handle search and category as before
        else if (search) {
          console.log(`[Products] Đang tìm kiếm sản phẩm với từ khóa: "${search}"`);
          filteredData = await fetchProductsBySearchQuery(search);
          console.log(`[Products] Kết quả tìm kiếm: Tìm thấy ${filteredData.length} sản phẩm`);
          
          // Nếu có cả danh mục, lọc kết quả tìm kiếm theo danh mục
          if (categoryId) {
            console.log(`[Products] Lọc kết quả tìm kiếm "${search}" theo danh mục ID: ${categoryId}`);
            const beforeFilter = filteredData.length;
            filteredData = filteredData.filter(product => {
              const productCategoryId = parseInt(product.category_id);
              return productCategoryId === categoryId;
            });
            console.log(`[Products] Sau khi lọc theo danh mục: ${filteredData.length}/${beforeFilter} sản phẩm`);
          }
        } else if (categoryId) {
          // Nếu chỉ có danh mục, lấy sản phẩm theo danh mục
          console.log(`[Products] Đang lấy sản phẩm theo danh mục ID: ${categoryId}`);
          filteredData = await fetchProductsByCategory(categoryId);
        } else {
          // Không có category được chọn và không có từ khóa, lấy tất cả sản phẩm
          filteredData = await fetchProducts();
          console.log(`[Products] Không có lọc, hiển thị tất cả ${filteredData.length} sản phẩm`);
        }
        
        console.log(`[Products] Đã lọc: ${filteredData.length} sản phẩm theo tiêu chí`);
        
        // Khởi tạo chỉ mục hình ảnh hiện tại cho mỗi sản phẩm
        const imageIndexes = {};
        filteredData.forEach(product => {
          imageIndexes[product.product_id] = 0;
        });
        setCurrentImageIndexes(imageIndexes);
        
        // Lấy thông tin khuyến mãi và giá đã giảm cho mỗi sản phẩm
        const productsWithPromotions = await Promise.all(
          filteredData.map(async (product) => {
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
        
        // Set sản phẩm đã lọc và có thông tin khuyến mãi vào state
        setProducts(productsWithPromotions);
        console.log(`[Products] THÀNH CÔNG: Đã thiết lập ${productsWithPromotions.length} sản phẩm đã lọc`);
      } catch (error) {
        console.error('[Products] Lỗi khi lấy dữ liệu sản phẩm:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    // Gọi hàm để lấy sản phẩm
    fetchFilteredProducts();
    
    // Quan sát location để phát hiện khi URL thay đổi
  }, [location]);

  // Fetch categories from backend API
  useEffect(() => {
    const getCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Không thể tải danh mục sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };

    getCategories();
  }, []);

  // Fetch promotions from API
  useEffect(() => {
    const getPromotions = async () => {
      try {
        const data = await fetchPromotions();
        
        // Process promotions data to ensure image paths are correct
        const processedData = data.map(promotion => {
          const updatedPromotion = {...promotion};
          
          if (updatedPromotion.img_banner) {
            if (updatedPromotion.img_banner.startsWith('https://res.cloudinary.com/')) {
              updatedPromotion.img_banner = updatedPromotion.img_banner.trim().replace(/ /g, '%20');
            } else if (updatedPromotion.img_banner === '') {
              updatedPromotion.img_banner = '/assets/images/Headsets.png';
            } else if (!updatedPromotion.img_banner.startsWith('/') && !updatedPromotion.img_banner.startsWith('http')) {
              updatedPromotion.img_banner = '/' + updatedPromotion.img_banner;
            }
          } else {
            updatedPromotion.img_banner = '/assets/images/Headsets.png';
          }
          
          return updatedPromotion;
        });
        
        setPromotions(processedData);
      } catch (error) {
        console.error('Không thể tải dữ liệu khuyến mãi:', error);
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

    getPromotions();
  }, []);

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

  // Fetch reviews from backend API
  useEffect(() => {
    const getReviews = async () => {
      try {
        console.log('Fetching reviews from API');
        // Use the same endpoint as ProductDetail.js for consistency
        const reviewsByProduct = {}; // Change to object structure
        
        // First fetch products to get their IDs
        const productsData = await fetchProducts();
        
        // Then fetch reviews for each product
        for (const product of productsData) {
          try {
            const productId = product.product_id;
            const response = await fetch(`http://${window.location.hostname}:8000/api/reviews/product/${productId}/`);
            
            if (response.ok) {
              const productReviews = await response.json();
              console.log(`Product ${productId} has ${productReviews.length} reviews`);
              
              // Calculate average rating for this product
              const averageRating = productReviews.length > 0 
                ? productReviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / productReviews.length
                : 0;
              
              // Store data in the right format
              reviewsByProduct[productId] = {
                count: productReviews.length,
                averageRating: averageRating,
                reviews: productReviews
              };
            }
          } catch (error) {
            console.error('Error fetching reviews for product:', error);
          }
        }
        
        setProductReviews(reviewsByProduct);
        console.log('Review data by product:', reviewsByProduct);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    getReviews();
  }, []);
  
  // Product image navigation
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

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    console.log(`[Products] Chọn danh mục: ${categoryId}`);
    
    // Track category view if user is logged in
    const userDataStr = localStorage.getItem('user');
    const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
    if (userInfo && userInfo.user_id) {
      activityTracker.trackCategoryView(categoryId);
    }
    
    if (categoryId === selectedCategory) {
      // Nếu đã chọn danh mục rồi, bỏ chọn
      setSelectedCategory(null);
      
      // Cập nhật URL để loại bỏ tham số category nhưng giữ lại tham số khác nếu có
      const queryParams = new URLSearchParams(location.search);
      queryParams.delete('category');
      
      const newUrl = queryParams.toString() ? 
        `/products?${queryParams.toString()}` : '/products';
      
      navigate(newUrl, { replace: true });
    } else {
      // Chọn danh mục mới
      setSelectedCategory(categoryId);
      
      // Cập nhật URL giữ nguyên các tham số khác (promotion và search nếu có)
      const queryParams = new URLSearchParams(location.search);
      queryParams.set('category', categoryId);
      
      navigate(`/products?${queryParams.toString()}`, { replace: true });
    }
    
    // Reset to page 1 when changing category
    setCurrentPage(1);
  };

  // Format price to VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      maximumFractionDigits: 0,
      useGrouping: true
    }).format(price) + ' VNĐ';
  };

  // Tính giá đã giảm nếu sản phẩm có khuyến mãi
  const getDiscountedPrice = (product) => {
    if (product.has_promotion && product.discounted_price) {
      return product.discounted_price;
    }
    return null;
  };

  // Tính điểm đánh giá trung bình từ các đánh giá
  const getAverageRating = (productId) => {
    if (!productReviews || Object.keys(productReviews).length === 0) return 0;
    
    // Fix variable shadowing issue - rename to reviewData
    const reviewData = productReviews[productId] || { count: 0, averageRating: 0 };
    const averageRating = reviewData.averageRating;
    
    // Fix: Return the raw value without additional rounding
    return averageRating;
  };
  
  // Update getReviewCount function to ensure it works properly with integer comparison
  const getReviewCount = (productId) => {
    if (!productReviews || Object.keys(productReviews).length === 0) return 0;
    
    // Fix how we get the count from the productReviews structure
    const reviewData = productReviews[productId];
    return reviewData ? reviewData.count : 0;
  };
  
  // Xử lý URL hình ảnh
  const getProxyImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
      console.warn("Invalid image URL provided:", url);
      return '/assets/images/Cyberpunk Aesthetics.png';
    }
    
    // Trim and normalize URL
    const trimmedUrl = url.trim();
    
    if (trimmedUrl === '') {
      return '/assets/images/Cyberpunk Aesthetics.png';
    }
    
    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }
    
    try {
      // Handle Cloudinary URLs
      if (trimmedUrl.includes('cloudinary.com')) {
        try {
          const urlObj = new URL(trimmedUrl);
          const cleanUrl = urlObj.href.replace(/\s/g, '%20');
          return cleanUrl;
        } catch (e) {
          console.error("Failed to parse Cloudinary URL:", e);
          return '/assets/images/Cyberpunk Aesthetics.png';
        }
      }
      
      // For other URLs, validate and return
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      } else {
        // Try to add https:// if missing
        const withProtocol = `https://${trimmedUrl}`;
        try {
          new URL(withProtocol);
          return withProtocol;
        } catch (e) {
          console.error("Failed to parse URL even with protocol:", e);
          return '/assets/images/Cyberpunk Aesthetics.png';
        }
      }
    } catch (e) {
      console.error("Error processing image URL:", e);
      return '/assets/images/Cyberpunk Aesthetics.png';
    }
  };

  // Handle adding product to cart
  const handleAddToCart = async (product) => {
    try {
      // Lấy thông tin người dùng đăng nhập từ localStorage (sửa từ userInfo thành user)
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.user_id) {
        // Nếu chưa đăng nhập, hiển thị thông báo lỗi
        setCartMessage({type: 'error', text: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'});
        setTimeout(() => setCartMessage(null), 3000);
        
        // Option: Có thể chuyển hướng người dùng đến trang đăng nhập 
        // navigate('/login', { state: { from: location } });
        return;
      }
      
      setCartLoading(true);
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
    }
  };

  // Add this function to render product name with glitch effect
  const GlitchProductName = ({ name }) => {
    // Ensure name is a valid string
    const displayName = name && typeof name === 'string' ? name : 'Sản phẩm';
    
    return (
      <h4 className="product-name">
        <span className="glitch-wrapper">
          <span className="glitch-text" data-text={displayName}>{displayName}</span>
          <span className="glitch-overlay"></span>
        </span>
      </h4>
    );
  };

  // Add a function to fetch reviews for a specific product
  const fetchProductReviews = async (productId) => {
    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/reviews/product/${productId}/`);
      if (response.ok) {
        const reviews = await response.json();
        console.log(`Product ${productId} has ${reviews.length} reviews`);
        return reviews;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      return [];
    }
  };

  // Fetch reviews when products load
  useEffect(() => {
    const fetchAllProductReviews = async () => {
      if (products.length === 0) return;
      
      console.log(`Fetching reviews for ${products.length} products`);
      const reviewsMap = {};
      let needsUpdate = false;
      
      for (const product of products) {
        const productId = product.product_id;
        if (!productReviews[productId]) {
          needsUpdate = true;
          const reviews = await fetchProductReviews(productId);
          console.log(`Product ${productId} (${product.name}): ${reviews.length} reviews`);
          reviewsMap[productId] = {
            count: reviews.length,
            averageRating: reviews.length > 0 
              ? reviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / reviews.length
              : 0,
            reviews: reviews // Store the actual reviews
          };
        }
      }
      
      if (needsUpdate) {
        console.log('Updating productReviews state with new data');
        setProductReviews(prev => {
          const newState = {...prev, ...reviewsMap};
          console.log('New productReviews state:', newState);
          return newState;
        });
      } else {
        console.log('No review updates needed');
      }
    };
    
    fetchAllProductReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // Modify the renderProducts function to handle pagination
  const renderProducts = () => {
    if (loadingProducts) {
      return <div className="loading-products">Đang tải sản phẩm...</div>;
    }
    
    if (products.length === 0) {
      return (
        <div className="no-products">
          <span className="sad-emoji">😞</span>
          {searchQuery ? (
            <p>Không tìm thấy sản phẩm nào phù hợp với từ khóa "{searchQuery}"</p>
          ) : selectedCategory ? (
            <p>Không có sản phẩm nào trong danh mục này</p>
          ) : (
            <p>Không có sản phẩm nào</p>
          )}
        </div>
      );
    }
    
    // Get current page products
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    
    return currentProducts.map((product) => {
      // Add defensive checks for product data
      if (!product || typeof product !== 'object') {
        console.error('Invalid product data:', product);
        return null;
      }
      
      // Ensure product has essential properties
      const safeProduct = {
        product_id: product.product_id || 0,
        name: product.name || 'Sản phẩm không có tên',
        price: product.price || 0,
        images: Array.isArray(product.images) ? product.images : [],
        category_id: product.category_id || 0,
        has_promotion: !!product.has_promotion,
        discount_percentage: product.discount_percentage || 0,
        discounted_price: product.discounted_price || null,
        ...product // Maintain any other properties
      };
      
      const discountedPrice = getDiscountedPrice(safeProduct);
      // Get reviews data for this product
      const productId = parseInt(safeProduct.product_id);
      
      // Use the utility functions we fixed above
      const averageRating = getAverageRating(productId);
      const reviewsCount = getReviewCount(productId);
      
      console.log(`Displaying product ${productId} (${safeProduct.name}) with ${reviewsCount} reviews and ${averageRating} rating`);
      
      const hasImages = safeProduct.images && safeProduct.images.length > 0;
      const imagesCount = hasImages ? safeProduct.images.length : 0;
      const currentImageIndex = currentImageIndexes[safeProduct.product_id] || 0;
      
      // Ensure image URL is valid or use placeholder
      let currentImage = "../assets/products/placeholder.webp";
      if (hasImages && safeProduct.images[currentImageIndex] && safeProduct.images[currentImageIndex].image_url) {
        currentImage = safeProduct.images[currentImageIndex].image_url;
      }
      
      // Lấy tên danh mục
      const categoryName = safeProduct.category_name || 
                          categories.find(cat => parseInt(cat.category_id) === parseInt(safeProduct.category_id))?.name || 
                          "Chưa phân loại";
      
      return (
        <div className="product-box" key={safeProduct.product_id}>
          <div className="cyber-scanline"></div>
          <div className="product-img">
            <button 
              className="product-img-prev" 
              onClick={prevImage(safeProduct.product_id, Math.max(imagesCount, 1))}
              aria-label="Ảnh trước"
            >
              &#10094;
            </button>
            <img 
              src={currentImage} 
              alt={safeProduct.name} 
              onError={(e) => {
                console.error("Error loading image:", currentImage);
                e.target.onerror = null;
                e.target.src = "../assets/products/placeholder.webp";
              }}
            />
            <button 
              className="product-img-next" 
              onClick={nextImage(safeProduct.product_id, Math.max(imagesCount, 1))}
              aria-label="Ảnh tiếp theo"
            >
              &#10095;
            </button>
            {imagesCount > 0 && (
              <div className="product-img-dots">
                {safeProduct.images.map((_, index) => (
                  <span 
                    key={index} 
                    className={`product-img-dot ${index === currentImageIndex ? 'active' : ''}`}
                  ></span>
                ))}
              </div>
            )}
            <div className="category-tag">
              <span className="cyber-ico">&gt;</span>
              {categoryName}
            </div>
            {safeProduct.has_promotion && (
              <div className="promotion-badge">
                <div className="badge-content">
                  <span className="discount-value">-{safeProduct.discount_percentage}%</span>
                  <div className="badge-glow"></div>
                </div>
                <div className="badge-corner top-right"></div>
                <div className="badge-corner bottom-left"></div>
              </div>
            )}
          </div>
          <div className="product-info">
            <GlitchProductName name={safeProduct.name} />
            <div className="product-rating">
              <span className="stars">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</span>
              <span className="review-count">{reviewsCount} đánh giá</span>
            </div>
            <div className="product-price-container">
              <div className="price-content">
                {safeProduct.has_promotion && discountedPrice ? (
                  <>
                    <span className="original-price">{formatPrice(safeProduct.price)}</span>
                    <span className="discounted-price">{formatPrice(discountedPrice)}</span>
                    <span className="discount-percentage">-{safeProduct.discount_percentage}%</span>
                  </>
                ) : (
                  <span className="discounted-price">{formatPrice(safeProduct.price)}</span>
                )}
              </div>
            </div>
            <div className="product-actions">
              <Link to={`/product-detail/${safeProduct.product_id}`} className="btn-details">
                <span>Chi tiết</span>
                <span className="cyber-btn-glow"></span>
              </Link>
              <button 
                className={`btn-cart ${cartLoading ? 'loading' : ''}`}
                onClick={() => handleAddToCart(safeProduct)}
                disabled={cartLoading}
              >
                <span>{cartLoading ? '...' : 'Thêm vào giỏ'}</span>
                <span className="cyber-btn-glow"></span>
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  // Add pagination navigation component
  const Pagination = () => {
    const totalPages = Math.ceil(products.length / productsPerPage);
    if (totalPages <= 1) return null;
    
    // Calculate which products are being shown
    const start = indexOfFirstProduct + 1;
    const end = Math.min(indexOfLastProduct, products.length);
    const total = products.length;
    
    const pageNumbers = [];
    // Show a maximum of 5 page buttons, more than that use ellipsis
    if (totalPages <= 7) {
      // If total pages are 7 or less, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first and last page
      pageNumbers.push(1);
      
      // Add ellipsis and nearby pages
      if (currentPage <= 3) {
        // Near the start
        pageNumbers.push(2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push('...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {start}-{end} của {total} sản phẩm
        </div>
        
        <div className="pagination">
          <button 
            className="pagination-arrow" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          
          {pageNumbers.map((number, index) => (
            number === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={`pagination-button ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            )
          ))}
          
          <button 
            className="pagination-arrow" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

  // Add effect to reset pagination when filters change
  useEffect(() => {
    // Reset to first page when category or search changes
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Update the promotion slides to use the new click handler
  const handlePromotionClick = (promotionId) => {
    console.log(`[Products] Clicked on promotion: ${promotionId}`);
    setSelectedPromotion(promotionId);
    navigate(`/products?promotion=${promotionId}`);
    
    // Track the promotion click
    const userDataStr = localStorage.getItem('user');
    const userInfo = userDataStr ? JSON.parse(userDataStr) : null;
    if (userInfo && userInfo.user_id) {
      activityTracker.trackPromotionView(promotionId);
    }
  };

  return (
    <div className="page-container products-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      {/* Thông báo cart */}
      {cartMessage && (
        <div className={`cart-message ${cartMessage.type}`}>
          {cartMessage.text}
        </div>
      )}
      
      <div className="products-header">
        <h2>Sản Phẩm Của Chúng Tôi</h2>
        <p>Khám phá các thiết bị Gaming cao cấp cho hiệu suất chơi game tuyệt vời</p>
      </div>

      <div className="products-content">
        {/* Promotions Slider Section */}
        <div className="products-section promotions-section">
          <div className="promotions-slider">
            <div className="promotion-slides">
              {promotions.length > 0 ? promotions.map((promotion, index) => (
                <div 
                  key={promotion.promotion_id}
                  className={`promotion-slide ${index === currentPromotion ? 'active' : ''}`}
                >
                  <Link to={`/products?promotion=${promotion.promotion_id}`} onClick={() => handlePromotionClick(promotion.promotion_id)}>
                    <div className="promotion-image">
                      <img 
                        src={getProxyImageUrl(promotion.img_banner)} 
                        alt={promotion.title}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="promotion-img"
                      />
                      <div className="promotion-overlay"></div>
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
              )) : (
                <div className="promotion-slide active">
                  <div className="promotion-image">
                    <img 
                      src="/assets/images/Cyberpunk Aesthetics.png" 
                      alt="Default Promotion" 
                      className="promotion-img"
                    />
                    <div className="promotion-overlay"></div>
                    <div className="promotion-content">
                      <h3>Khuyến mãi tai nghe</h3>
                      <p>Mua tai nghe gaming với giá ưu đãi cực lớn</p>
                      <span className="discount-badge">HOT</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="promotion-dots">
              {promotions.length > 0 ? promotions.map((_, index) => (
                <span 
                  key={index} 
                  className={`dot ${index === currentPromotion ? 'active' : ''}`}
                  onClick={() => setCurrentPromotion(index)}
                ></span>
              )) : (
                <span className="dot active"></span>
              )}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="products-section categories-section">
          <h3>Danh Mục Sản Phẩm</h3>
          <div className="categories-container">
            {loading ? (
              <div className="loading-box">Đang tải danh mục...</div>
            ) : (
              categories.map(category => (
                <div 
                  key={category.category_id} 
                  className={`category-box ${selectedCategory === category.category_id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.category_id)}
                >
                  {category.name}
                  {selectedCategory === category.category_id && <span className="filter-active">✓</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section product-listing-section">
          <h3>Sản Phẩm</h3>
          {selectedCategory && (
            <div className="filter-indicator">
              <span>
                Đang hiển thị sản phẩm thuộc danh mục: 
                <span className="filter-indicator-category">
                  {categories.find(cat => parseInt(cat.category_id) === parseInt(selectedCategory))?.name || "Chưa phân loại"}
                </span>
                <span className="filter-count">
                  (Tìm thấy {products.length} sản phẩm)
                </span>
              </span>
              <button 
                className="filter-clear-btn" 
                onClick={() => handleCategoryClick(selectedCategory)}
              >
                Xóa bộ lọc ×
              </button>
            </div>
          )}
          
          {/* Add promotion filter indicator if active */}
          {selectedPromotion && (
            <div className="filter-indicator promotion-filter">
              <span>
                Đang hiển thị sản phẩm thuộc khuyến mãi: 
                <span className="filter-indicator-promotion">
                  {promotions.find(promo => parseInt(promo.promotion_id) === parseInt(selectedPromotion))?.title || "Khuyến mãi"}
                </span>
                <span className="filter-count">
                  (Tìm thấy {products.length} sản phẩm)
                </span>
              </span>
              <button 
                className="filter-clear-btn" 
                onClick={() => {
                  setSelectedPromotion(null);
                  navigate(selectedCategory 
                    ? `/products?category=${selectedCategory}` 
                    : searchQuery 
                      ? `/products?search=${encodeURIComponent(searchQuery)}` 
                      : '/products',
                    { replace: true }
                  );
                }}
              >
                Xóa bộ lọc khuyến mãi ×
              </button>
            </div>
          )}
          
          <div className="products-grid">
            {renderProducts()}
          </div>
          <Pagination />
        </div>

        {/* Reviews Section - only displaying existing reviews */}
        <div className="products-section reviews-section">
          <h3>Đánh Giá Sản Phẩm</h3>
          <div className="reviews-container">
            <div className="review-list">
              {loading ? (
                <div className="loading-reviews">Đang tải đánh giá...</div>
              ) : Object.values(productReviews).reduce((total, item) => total + item.count, 0) === 0 ? (
                <div className="no-reviews">Chưa có đánh giá nào</div>
              ) : (
                // Flatten all reviews from productReviews
                Object.entries(productReviews)
                  .flatMap(([productId, data]) => {
                    if (!data.reviews) return [];
                    return data.reviews.map(review => ({
                      ...review,
                      productId: parseInt(productId)
                    }));
                  })
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 10)
                  .map((review) => {
                    // Find the product name for this review
                    const product = products.find(p => parseInt(p.product_id) === review.productId);
                    const productName = product ? product.name : `Sản phẩm ID: ${review.productId}`;
                    
                    return (
                      <div className="review-item" key={review.review_id}>
                        <div className="review-rating">
                          <span className="stars">{"★".repeat(Math.round(review.rating))}</span>
                          <Link to={`/product-detail/${review.productId}`} className="review-product-link">
                            {productName}
                          </Link>
                        </div>
                        <div className="review-content">
                          <p className="review-text">{review.comment}</p>
                          <p className="review-date">
                            Đăng vào: {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thêm thông tin tìm kiếm hiện tại nếu có */}
      {searchQuery && (
        <div className="search-info">
          <h2>Kết quả tìm kiếm cho: "{searchQuery}"</h2>
          <span className="result-count">{products.length} sản phẩm</span>
          {selectedCategory && (
            <span className="filter-note">
              (Đã lọc theo danh mục: {categories.find(c => parseInt(c.category_id) === parseInt(selectedCategory))?.name || 'Chưa phân loại'})
            </span>
          )}
          <button 
            className="clear-search-btn" 
            onClick={() => navigate(selectedCategory ? `/products?category=${selectedCategory}` : '/products')}
          >
            <i className="fas fa-times"></i> Xóa từ khóa tìm kiếm
          </button>
        </div>
      )}
    </div>
  );
}

export default Products; 