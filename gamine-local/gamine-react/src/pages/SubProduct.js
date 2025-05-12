import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SubProduct.css';

function SubProduct() {
  const [currentCategory, setCurrentCategory] = useState('gaming');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [sliderProducts, setSliderProducts] = useState([]);
  const itemsPerPage = 4;
  const location = useLocation();

  useEffect(() => {
    // Product data for main display
    const productsData = [
      {
        name: "Gaming Screen CBP2250", 
        imgSrc: "../assets/products/screen.webp",
        price: "6,800,000 VND",
        rating: 5,
        reviews: 1
      },
      {
        name: "Gaming Screen AZNH20", 
        imgSrc: "../assets/Screen/1.webp", 
        price: "2,050,000 VND",
        rating: 5,
        reviews: 1
      },
      {
        name: "Gaming Screen NH1134", 
        imgSrc: "../assets/Screen/2.webp", 
        price: "10,000,000 VND", 
        rating: 5,
        reviews: 1
      },
      {
        name: "Gaming Screen CBP7272", 
        imgSrc: "../assets/Screen/3.webp", 
        price: "30,000,000 VND",
        rating: 5,
        reviews: 1
      },
      {
        name: "Graphic Screen CBP3000", 
        imgSrc: "../assets/Screen/7.webp", 
        price: "7,200,000 VND",
        rating: 5,
        reviews: 1
      },
      {
        name: "Graphic Screen CBP42", 
        imgSrc: "../assets/Screen/12.webp", 
        price: "9,500,000 VND",
        rating: 5,
        reviews: 1
      },
      {
        name: "Wacom Cintiq Pro", 
        imgSrc: "../assets/Screen/14.webp", 
        price: "14,000,000 VND",
        rating: 5,
        reviews: 1
      },
      {
        name: "Pro Designer Monitor", 
        imgSrc: "../assets/Screen/13.webp", 
        price: "10,000,000 VND",
        rating: 5,
        reviews: 1
      }
    ];
    
    setProducts(productsData);

    // Slider products data
    const sliderData = {
      gaming: [
        { name: "Gaming Screen CBP2250", imgSrc: "../assets/products/screen.webp", price: "6,800,000 VND" },
        { name: "Gaming Screen AZNH20", imgSrc: "../assets/Screen/1.webp", price: "2,050,000 VND" },
        { name: "Gaming Screen NH1134", imgSrc: "../assets/Screen/2.webp", price: "10,000,000 VND" },
        { name: "Gaming Screen CBP7272", imgSrc: "../assets/Screen/3.webp", price: "30,000,000 VND" },
        { name: "Gaming Screen XZ4", imgSrc: "../assets/Screen/4.webp", price: "1,500,000 VND" },
        { name: "Gaming Screen HZS880", imgSrc: "../assets/Screen/5.webp", price: "5,000,000 VND" }
      ],
      graphic: [
        { name: "Graphic Screen CBP3000", imgSrc: "../assets/Screen/7.webp", price: "7,200,000 VND" },
        { name: "Graphic Screen CBP820", imgSrc: "../assets/Screen/10.webp", price: "4,500,000 VND" },
        { name: "Graphic Screen CBP12", imgSrc: "../assets/Screen/11.webp", price: "1,200,000 VND" },
        { name: "Graphic Screen CBP42", imgSrc: "../assets/Screen/12.webp", price: "9,500,000 VND" },
        { name: "Pro Designer Monitor", imgSrc: "../assets/Screen/13.webp", price: "10,000,000 VND" },
        { name: "Wacom Cintiq Pro", imgSrc: "../assets/Screen/14.webp", price: "14,000,000 VND" }
      ]
    };
    
    setSliderProducts(sliderData);

    // Khi component được tải, kiểm tra nếu đến từ trang Products
    if (location.state && location.state.categoryId) {
      // Nếu danh mục là Monitors (ID: 4), hiển thị tất cả sản phẩm màn hình
      if (location.state.categoryId === 4) {
        setCurrentCategory('gaming');
      }
      // Có thể thêm các điều kiện khác cho các danh mục khác
    }
  }, [location]);

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setCurrentIndex(0);
  };

  const slideLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const slideRight = () => {
    const currentProducts = sliderProducts[currentCategory] || [];
    const maxIndex = currentProducts.length - itemsPerPage;
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Calculate visible slider products
  const visibleSliderProducts = (sliderProducts[currentCategory] || []).slice(
    currentIndex,
    currentIndex + itemsPerPage
  );

  return (
    <div className="main-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circuit top-right"></div>
      <div className="cyber-circuit bottom-left"></div>
      <div className="cyber-dot dot1"></div>
      <div className="cyber-dot dot2"></div>
      <div className="cyber-line line1"></div>
      <div className="cyber-line line2"></div>
      
      {/* Slider section */}
      <div className="Slider-seller">
        {/* Tab changes */}
        <div className="tab-changes">
          <button 
            className={`tab-button ${currentCategory === 'gaming' ? 'active' : ''}`} 
            onClick={() => handleCategoryChange('gaming')}
          >
            Gaming Screen
          </button>
          <button 
            className={`tab-button ${currentCategory === 'graphic' ? 'active' : ''}`} 
            onClick={() => handleCategoryChange('graphic')}
          >
            Graphic Screen
          </button>
          <div className="best-seller">Best Seller</div>
        </div>

        {/* Slider for products */}
        <div className="best-sales-slider">
          <button className="prev" onClick={slideLeft}>&#10094;</button>
          <div className="product-wrapper">
            <div 
              className="product-list" 
              style={{ transform: `translateX(-${currentIndex * 25}%)` }}
            >
              {visibleSliderProducts.map((product, index) => (
                <div className="product-box-sales" key={index}>
                  <div className="product-img-sales">
                    <img src={product.imgSrc} alt={product.name} />
                  </div>
                  <div className="product-rating-sales">
                    <span className="stars-sales">★★★★★</span> 
                    <span className="review-count-sales">1 đánh giá</span>
                  </div>
                  <div className="product-name-sales">
                    <p>{product.name}</p>
                  </div>
                  <div className="product-price-sales">
                    <p>{product.price}</p>
                  </div>
                  <div className="product-actions-sales">
                    <Link to={`/product-detail/${index + 1}`} className="btn-details-sales">Details</Link>
                    <button className="btn-cart-sales">Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="next" onClick={slideRight}>&#10095;</button>
        </div>
      </div>

      {/* Product section */}
      <div className="product-site">
        <div className="products" id="product-list">
          {products.map((product, index) => (
            <div className="product-box" key={index}>
              <div className="product-img">
                <img src={product.imgSrc} alt={product.name} />
              </div>
              <div className="product-rating">
                <span className="stars">{"★".repeat(product.rating)}{"☆".repeat(5 - product.rating)}</span>
                <span className="review-count">{product.reviews} review</span>
              </div>
              <div className="product-name">
                <p>{product.name}</p>
              </div>
              <div className="product-price">
                <p>{product.price}</p>
              </div>
              <div className="product-actions">
                <Link to={`/product-detail/${index + 1}`} className="btn-details">Details</Link>
                <button className="btn-cart">Cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubProduct; 