import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaBolt, FaHeart } from 'react-icons/fa';
import parse from 'html-react-parser';
import './ProductDetail.css';
import { 
  fetchReviews, 
  fetchProductPromotions, 
  isPromotionActive, 
  getProductDiscountedPrice 
} from '../services/api';
import activityTracker from '../services/ActivityTracker';

function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [user, setUser] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const navigate = useNavigate();
  
  // Các state cho đánh giá
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState(0); // 0 = All, 1-5 for specific star ratings

  useEffect(() => {
    // Kiểm tra người dùng đã đăng nhập chưa
    const checkLoggedInUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Track product view when user is logged in
          activityTracker.trackProductView(productId);
        } catch (error) {
          console.error('Lỗi khi parse dữ liệu người dùng:', error);
        }
      }
    };

    checkLoggedInUser();
    document.title = "Chi Tiết Sản Phẩm - GAMINE";
    // Lấy thông tin sản phẩm từ API
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Gọi API để lấy thông tin chi tiết sản phẩm
        let productData = null;
        try {
          const response = await fetch(`http://${window.location.hostname}:8000/api/products/${productId}/`);
          if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu sản phẩm');
          }
          
          productData = await response.json();
          console.log('Dữ liệu sản phẩm từ API:', productData);
        } catch (productError) {
          console.error('Lỗi khi lấy thông tin sản phẩm:', productError);
          
          // Thử lấy từ API tất cả sản phẩm nếu không lấy được từ API chi tiết
          try {
            const allProductsResponse = await fetch(`http://${window.location.hostname}:8000/api/products/`);
            if (allProductsResponse.ok) {
              const allProducts = await allProductsResponse.json();
              productData = allProducts.find(p => p.product_id == productId); // Sử dụng == thay vì === để so sánh cả string và number
              
              if (!productData) {
                throw new Error('Không tìm thấy sản phẩm trong danh sách');
              }
              
              console.log('Đã tìm thấy sản phẩm từ danh sách:', productData);
            } else {
              throw new Error('Không thể lấy danh sách sản phẩm');
            }
          } catch (fallbackError) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', fallbackError);
            throw new Error('Không thể tìm thấy thông tin sản phẩm');
          }
        }
        
        if (!productData) {
          throw new Error('Không tìm thấy thông tin sản phẩm');
        }
        
        // Kiểm tra khuyến mãi cho sản phẩm
        let promotionData = null;
        try {
          const promotionInfo = await getProductDiscountedPrice({
            product_id: productId,
            price: productData.price
          });
          
          if (promotionInfo) {
            promotionData = {
              discounted_price: promotionInfo.discountedPrice,
              discount_percentage: promotionInfo.discountPercentage,
              has_active_promotion: true
            };
          }
        } catch (promoError) {
          console.error('Lỗi khi lấy thông tin khuyến mãi:', promoError);
        }
        
        // Lấy chi tiết sản phẩm - Sử dụng API endpoint mới
        let productDetail = null;
        try {
          const detailResponse = await fetch(`http://${window.location.hostname}:8000/api/product-details/${productId}/`);
          if (detailResponse.ok) {
            productDetail = await detailResponse.json();
            console.log('Chi tiết sản phẩm từ API mới:', productDetail);
          } else {
            console.log('Không tìm thấy chi tiết sản phẩm, sử dụng mô tả mặc định');
          }
        } catch (detailError) {
          console.error('Lỗi khi lấy chi tiết sản phẩm:', detailError);
        }
        
        // Lấy hình ảnh sản phẩm
        let imagesData = [];
        try {
          console.log(`Gửi yêu cầu lấy hình ảnh cho sản phẩm ID: ${productId}`);
          const imagesResponse = await fetch(`http://${window.location.hostname}:8000/api/productimages/?product_id=${productId}`);
          
          if (imagesResponse.ok) {
            const responseText = await imagesResponse.text();
            console.log('Phản hồi hình ảnh (raw):', responseText.substring(0, 500));
            
            try {
              imagesData = JSON.parse(responseText);
              console.log('Số lượng hình ảnh nhận được:', imagesData.length, imagesData);
            } catch (jsonError) {
              console.error('Lỗi khi parse JSON hình ảnh:', jsonError);
            }
          } else {
            console.log(`Không tìm thấy hình ảnh sản phẩm (status: ${imagesResponse.status}), sử dụng hình ảnh mặc định`);
          }
        } catch (imagesError) {
          console.error('Lỗi khi lấy hình ảnh sản phẩm:', imagesError);
        }
        
        // Nếu không có hình ảnh, thử lấy từ productData nếu có
        if (imagesData.length === 0) {
          console.log('Tìm kiếm hình ảnh từ nguồn khác...');
          
          // Kiểm tra productData.images
          if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
            console.log('Sử dụng hình ảnh từ productData.images:', productData.images);
            imagesData = productData.images;
          } 
          // Kiểm tra productData.image (chuỗi đơn)
          else if (productData.image) {
            console.log('Sử dụng hình ảnh từ productData.image:', productData.image);
            imagesData = [{ image_url: productData.image }];
          }
          // Nếu vẫn không có hình, sử dụng placeholder
          if (imagesData.length === 0) {
            console.log('Không tìm thấy hình ảnh, sử dụng placeholder');
            imagesData = [{ image_url: '../assets/products/placeholder.webp' }];
          }
        }
        
        // Lấy đánh giá sản phẩm từ API endpoint mới
        let reviewsData = [];
        let averageRating = 0; // Thay đổi giá trị mặc định
        let reviewCount = 0;
        
        try {
          const reviewsResponse = await fetch(`http://${window.location.hostname}:8000/api/reviews/product/${productId}/`);
          if (reviewsResponse.ok) {
            reviewsData = await reviewsResponse.json();
            console.log('Dữ liệu đánh giá:', reviewsData);
            
            if (reviewsData.length > 0) {
              const sum = reviewsData.reduce((total, review) => total + parseFloat(review.rating), 0);
              averageRating = Math.round((sum / reviewsData.length) * 10) / 10;
              reviewCount = reviewsData.length;
            } else {
              // Nếu không có đánh giá nào
              averageRating = 0;
              reviewCount = 0;
            }
          } else {
            console.log('Không tìm thấy đánh giá sản phẩm, sử dụng giá trị mặc định');
            averageRating = 0;
            reviewCount = 0;
          }
        } catch (reviewsError) {
          console.error('Lỗi khi lấy đánh giá sản phẩm:', reviewsError);
          averageRating = 0;
          reviewCount = 0;
        }
        
        // Định dạng dữ liệu sản phẩm
        const formattedProduct = {
          id: productData.product_id,
          name: productData.name,
          price: productData.price,
          discount: promotionData ? promotionData.discount_percentage : 0,
          discounted_price: promotionData ? promotionData.discounted_price : null,
          has_promotion: promotionData ? promotionData.has_active_promotion : false,
          stock: productData.stock_quantity,
          sold: productData.sold_quantity || 0,
          rating: averageRating,
          reviews: reviewCount,
          description: productData.description,
          longDescription: productData.description,
          images: imagesData.length > 0 
            ? imagesData.map(img => img.image_url || img)
            : ['../assets/products/placeholder.webp'],
          specs: {
            brand: 'GaMine',
            model: `GM-${productData.product_id}`,
            weight: '1.2 kg',
            dimensions: '45 x 21 x 8 cm',
            warranty: '24 months',
            features: productDetail && productDetail.specification 
              ? productDetail.specification.split('\n').filter(item => item.trim()) 
              : [
                'Sản phẩm chất lượng cao',
                'Thiết kế hiện đại',
                'Phù hợp cho game thủ chuyên nghiệp'
              ]
          },
          category: productData.category_name || 'Unknown',
          reviewsData: reviewsData
        };
        
        setProduct(formattedProduct);
        setActiveImage(0);
        
        // Lấy sản phẩm liên quan (cùng danh mục)
        try {
          const relatedResponse = await fetch(`http://${window.location.hostname}:8000/api/products/?category=${productData.category}`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            
            // Lọc ra 3 sản phẩm liên quan (không bao gồm sản phẩm hiện tại)
            const related = relatedData
              .filter(item => item.product_id != productId) // Sử dụng != thay vì !== để so sánh cả string và number
              .slice(0, 3)
              .map(item => {
                let productImage = '../assets/products/placeholder.webp';
                
                // Tìm hình ảnh từ nhiều nguồn khác nhau
                if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                  // Nếu có mảng images, ưu tiên hình chính
                  const primaryImage = item.images.find(img => img.is_primary);
                  productImage = primaryImage ? primaryImage.image_url : item.images[0].image_url;
                } else if (item.image) {
                  // Nếu có trường image đơn
                  productImage = item.image;
                }
                
                return {
                  id: item.product_id,
                  name: item.name,
                  price: item.price,
                  image: productImage
                };
              });
            
            setRelatedProducts(related);
          } else {
            console.log('Không tìm thấy sản phẩm liên quan');
            setRelatedProducts([]);
          }
        } catch (relatedError) {
          console.error('Lỗi khi lấy sản phẩm liên quan:', relatedError);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [productId]);

  const setMainImage = (index) => {
    setActiveImage(index);
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  const addToWishlist = () => {
    console.log("Đã thêm vào danh sách yêu thích");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `http://${window.location.hostname}:8000${imagePath}`;
  };

  const renderStars = (rating) => {
    console.log("Hiển thị rating:", rating); // Debug để xem giá trị rating
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star filled" style={{color: 'gold'}} />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star filled" style={{color: 'gold'}} />);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star" />);
    }
    
    return stars;
  };

  const addToCart = async () => {
    if (!user) {
      setCartMessage('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    if (!product) {
      setCartMessage('Không tìm thấy thông tin sản phẩm!');
      return;
    }

    try {
      setAddingToCart(true);
      // Dữ liệu để gửi đến API
      const cartItem = {
        product_id: product.id,
        user_id: user.user_id || user.id,
        quantity: quantity
      };

      // Gọi API để thêm vào giỏ hàng
      const response = await fetch(`http://${window.location.hostname}:8000/api/cart/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cartItem)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi thêm vào giỏ hàng!');
      }

      const result = await response.json();
      setCartMessage(result.message || 'Đã thêm sản phẩm vào giỏ hàng thành công!');
      
      // Thông báo thành công và xóa sau 3 giây
      setTimeout(() => {
        setCartMessage('');
      }, 3000);

    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      setCartMessage(`Lỗi: ${error.message}`);
      
      // Xóa thông báo lỗi sau 3 giây
      setTimeout(() => {
        setCartMessage('');
      }, 3000);
    } finally {
      setAddingToCart(false);
    }
  };
  
  const buyNow = () => {
    if (!user) {
      setCartMessage('Vui lòng đăng nhập để mua sản phẩm!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    // Thêm vào giỏ hàng trước rồi chuyển đến trang thanh toán
    addToCart();
    setTimeout(() => {
      navigate('/cart');
    }, 1000);
  };

  // Hàm gửi đánh giá
  const submitReview = async () => {
    if (!user) {
      setReviewMessage('Vui lòng đăng nhập để đánh giá sản phẩm!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    try {
      setReviewSubmitting(true);
      
      const reviewData = {
        product_id: productId,
        rating: userRating,
        comment: reviewComment,
        user_id: user.user_id || user.id
      };
      
      console.log('Gửi đánh giá:', reviewData);
      
      // Gọi API để thêm đánh giá
      const response = await fetch(`http://${window.location.hostname}:8000/api/reviews/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Lỗi khi gửi đánh giá sản phẩm');
      }
      
      // Hiển thị thông báo thành công
      setReviewMessage(result.message || 'Cảm ơn bạn đã đánh giá sản phẩm!');
      
      // Cập nhật lại danh sách đánh giá
      if (product) {
        try {
          const reviewsResponse = await fetch(`http://${window.location.hostname}:8000/api/reviews/product/${productId}/`);
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            const updatedProduct = {...product, reviewsData: reviewsData};
            setProduct(updatedProduct);
          }
        } catch (error) {
          console.error('Lỗi khi cập nhật danh sách đánh giá:', error);
        }
      }
      
      // Reset form
      setUserRating(5);
      setReviewComment('');
      
      // Xóa thông báo sau 3 giây
      setTimeout(() => {
        setReviewMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Lỗi khi gửi đánh giá:', error);
      setReviewMessage(`Lỗi: ${error.message}`);
      
      // Xóa thông báo lỗi sau 3 giây
      setTimeout(() => {
        setReviewMessage('');
      }, 3000);
    } finally {
      setReviewSubmitting(false);
    }
  };
  
  // Hàm thay đổi đánh giá sao
  const handleRatingClick = (rating) => {
    setUserRating(rating);
  };

  // Thêm hàm lọc đánh giá
  const handleFilterChange = (rating) => {
    setActiveFilter(rating);
  };
  
  // Hàm lọc đánh giá theo số sao đã chọn
  const getFilteredReviews = () => {
    if (!product || !product.reviewsData) return [];
    
    if (activeFilter === 0) {
      // Trả về tất cả đánh giá nếu chọn "Tất Cả"
      return product.reviewsData;
    } else {
      // Lọc đánh giá theo số sao đã chọn
      return product.reviewsData.filter(review => {
        const rating = Math.round(parseFloat(review.rating));
        return rating === activeFilter;
      });
    }
  };

  // Add this function to mask usernames for privacy
  const maskUsername = (username) => {
    if (!username || username.length <= 2) return username || 'Người dùng';
    
    const firstChar = username.charAt(0);
    const lastChar = username.charAt(username.length - 1);
    const maskedPart = '*'.repeat(Math.min(5, username.length - 2));
    
    return `${firstChar}${maskedPart}${lastChar}`;
  };

  if (loading) {
    return (
      <div className="page-container product-detail-loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container product-not-found">
        <h2>Không Tìm Thấy Sản Phẩm</h2>
        <p>Xin lỗi, chúng tôi không tìm thấy sản phẩm bạn đang tìm kiếm.</p>
        <Link to="/products" className="back-to-products">Quay Lại Trang Sản Phẩm</Link>
      </div>
    );
  }

  const salePrice = product.discount ? Math.round(product.price * (1 - product.discount / 100)) : product.price;

  return (
    <div className="page-container product-detail-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      <div className="product-detail-header">
        <h2>{product.name}</h2>
        <p>Chi tiết sản phẩm</p>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Trang Chủ</Link> &gt; 
        <Link to="/products">Sản Phẩm</Link> &gt; 
        <span>{product.name}</span>
      </div>

      <div className="product-content">
        {/* Product Main Info */}
        <div className="product-section product-main">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img 
                src={getImageUrl(product.images[activeImage])} 
                alt={product.name} 
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.log('Lỗi khi tải hình ảnh:', e.target.src);
                  e.target.src = '../assets/products/placeholder.webp';
                }}
              />
            </div>
            <div className="thumbnail-images">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${activeImage === index ? 'active' : ''}`} 
                  onClick={() => setMainImage(index)}
                >
                  <img 
                    src={getImageUrl(image)} 
                    alt={`${product.name} - xem ${index + 1}`} 
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.log('Lỗi khi tải thumbnail:', e.target.src);
                      e.target.src = '../assets/products/placeholder.webp';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-rating-detail">
              <div className="stars">
                {renderStars(product.rating)}
              </div>
              <span>{product.rating} ({product.reviews} đánh giá)</span>
            </div>
            
            <div className="product-price-detail">
              {product.has_promotion && product.discounted_price ? (
                <>
                  <span className="original-price">{formatPrice(product.price)}</span>
                  <span className="sale-price">{formatPrice(product.discounted_price)}</span>
                  <span className="discount-badge">-{product.discount}%</span>
                </>
              ) : (
                <span className="regular-price">{formatPrice(product.price)}</span>
              )}
            </div>
            
            <div className="product-short-desc">
              <p>{product.description}</p>
            </div>
            
            <div className="product-availability">
              <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                {product.stock > 0 ? 'Còn Hàng' : 'Hết Hàng'}
              </span>
              {product.stock > 0 && <span className="stock-qty">({product.stock} sản phẩm có sẵn)</span>}
            </div>
            
            <div className="product-quantity">
              <button onClick={decreaseQuantity} disabled={quantity <= 1}>-</button>
              <input type="number" value={quantity} readOnly />
              <button onClick={increaseQuantity} disabled={quantity >= product.stock}>+</button>
            </div>
            
            {cartMessage && <div className="cart-message">{cartMessage}</div>}
            
            <div className="product-actions-detail">
              <button 
                className={`add-to-cart-btn ${addingToCart ? 'loading' : ''}`} 
                onClick={addToCart} 
                disabled={addingToCart || product.stock <= 0}
              >
                {addingToCart ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}
              </button>
              <button 
                className="buy-now-btn" 
                onClick={buyNow}
                disabled={addingToCart || product.stock <= 0}
              >
                Mua Ngay
              </button>
              <button className="add-to-wishlist-btn" onClick={addToWishlist}>♡</button>
            </div>
            
            <div className="product-meta">
              <p><strong>Mã SP:</strong> {product.specs.model}</p>
              <p><strong>Thương hiệu:</strong> {product.specs.brand}</p>
              <p><strong>Danh mục:</strong> {product.category}</p>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="product-section product-tabs">
          <div className="tab-headers">
            <button 
              className={activeTab === 'description' ? 'active' : ''} 
              onClick={() => changeTab('description')}
            >
              Mô Tả
            </button>
            <button 
              className={activeTab === 'reviews' ? 'active' : ''} 
              onClick={() => changeTab('reviews')}
            >
              Đánh Giá ({product.reviews})
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="tab-pane fade show active" id="description">
                <div className="product-description">
                  <h2>Mô tả sản phẩm</h2>
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <p>Chưa có thông tin mô tả cho sản phẩm này.</p>
                  )}

                  {/* Hiển thị thông số kỹ thuật từ ProductDetails nếu có */}
                  {product.specs && product.specs.features && product.specs.features.length > 0 && (
                    <div className="product-specs mt-4">
                      <h3>Thông số kỹ thuật</h3>
                      <div className="specs-content">
                        {product.specs.features.map((feature, index) => (
                          <p key={index}>{feature}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <h3>Đánh Giá Từ Khách Hàng</h3>
                <div className="review-summary">
                  <div className="average-rating">
                    <div className="big-rating">{product.rating}</div>
                    <div className="rating-stars">
                      {renderStars(product.rating)}
                    </div>
                    <div className="total-reviews">trên 5</div>
                  </div>
                  
                  {(() => {
                    // Tính toán số lượng từng loại đánh giá từ dữ liệu thực
                    const reviewCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
                    
                    if (product.reviewsData && product.reviewsData.length > 0) {
                      product.reviewsData.forEach(review => {
                        const rating = Math.round(parseFloat(review.rating));
                        if (rating >= 1 && rating <= 5) {
                          reviewCounts[rating]++;
                        }
                      });
                    }
                    
                    // Hàm định dạng số lượng (thêm 'k' nếu lớn hơn 1000)
                    const formatCount = (count) => {
                      return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count;
                    };
                    
                    return (
                      <div className="rating-filters">
                        <button 
                          className={`filter-button ${activeFilter === 0 ? 'active' : ''}`}
                          onClick={() => handleFilterChange(0)}
                        >
                          Tất Cả
                        </button>
                        {[5, 4, 3, 2, 1].map(star => (
                          <button 
                            className={`filter-button ${activeFilter === star ? 'active' : ''}`}
                            key={`filter-${star}`}
                            onClick={() => handleFilterChange(star)}
                          >
                            {star} Sao ({formatCount(reviewCounts[star])})
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                
                <div className="customer-reviews">
                  {(() => {
                    const filteredReviews = getFilteredReviews();
                    
                    if (filteredReviews.length > 0) {
                      return filteredReviews.map((review, index) => {
                        // Format date to match the expected format: 2025-03-08 13:12
                        const formattedDate = new Date(review.created_at).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', '');
                        
                        return (
                          <div className="review-item" key={review.review_id || index}>
                            <div className="reviewer-avatar">
                              {review.username ? review.username.charAt(0).toUpperCase() : 'X'}
                            </div>
                            <div className="review-content-container">
                              <div className="reviewer-name">
                                {maskUsername(review.username || 'Người dùng')}
                              </div>
                              <div className="reviewer-rating">{renderStars(review.rating)}</div>
                              <div className="review-meta">
                                {formattedDate} <span className="divider">|</span> <span className="review-variant">Phân loại hàng: Chính hãng</span>
                              </div>
                              <div className="review-content">
                                <p>{review.comment || 'Đã nhận hàng đầy đủ, sản sale nên giá cũng khá mềm. Hàng đóng gói chắc chắn, có bọc chống sốc. Sử dụng đã lâu, cũng khá hiệu quả'}</p>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    } else {
                      return <div className="no-reviews">Không có đánh giá nào {activeFilter > 0 ? `với ${activeFilter} sao` : ''}</div>;
                    }
                  })()}
                </div>
                
                <div className="write-review">
                  <h4>Viết Đánh Giá</h4>
                  
                  {reviewMessage && <div className="review-message">{reviewMessage}</div>}
                  
                  {!user ? (
                    <div className="login-notice">
                      <p>Vui lòng <Link to="/login">đăng nhập</Link> để viết đánh giá</p>
                    </div>
                  ) : (
                    <>
                      <div className="rating-select">
                        <span>Đánh giá của bạn: </span>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              className={`star ${userRating >= star ? 'active' : ''}`} 
                              onClick={() => handleRatingClick(star)}
                              style={{color: userRating >= star ? 'gold' : 'rgba(255, 255, 255, 0.2)'}}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="review-form">
                        <textarea 
                          placeholder="Viết đánh giá của bạn tại đây..." 
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        ></textarea>
                        <button 
                          className={`submit-review ${reviewSubmitting ? 'loading' : ''}`} 
                          onClick={submitReview}
                          disabled={reviewSubmitting}
                        >
                          {reviewSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="product-section related-products">
          <h3>Sản Phẩm Liên Quan</h3>
          <div className="product-grid">
            {relatedProducts.map((relProduct) => (
              <div className="product-card" key={relProduct.id}>
                <div className="product-img">
                  <img src={getImageUrl(relProduct.image)} alt={relProduct.name} />
                </div>
                <div className="product-details">
                  <h4>{relProduct.name}</h4>
                  <div className="product-price">{formatPrice(relProduct.price)}</div>
                  <div className="product-actions">
                    <Link to={`/product-detail/${relProduct.id}`} className="view-details">Chi Tiết</Link>
                    <button className="add-to-cart">Giỏ Hàng</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail; 