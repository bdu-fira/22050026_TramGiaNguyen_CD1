import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';
import { getUserCart, updateCartItem, removeCartItem, checkout, getUserProfile } from '../services/api';

// Hàm tiện ích để thông báo cập nhật giỏ hàng
const notifyCartUpdated = () => {
  // Phát một sự kiện tùy chỉnh để thông báo các component khác về sự thay đổi giỏ hàng
  const event = new CustomEvent('cartUpdate', {
    detail: { type: 'CART_UPDATED', timestamp: new Date().getTime() }
  });
  window.dispatchEvent(event);
};

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [shippingCost, setShippingCost] = useState(30000); // 30,000 VND shipping fee
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderStatus, setOrderStatus] = useState('idle'); // idle, loading, success, error
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfileLoading, setUserProfileLoading] = useState(true);
  const navigate = useNavigate();

  // Lấy thông tin người dùng từ localStorage và API
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('user'));
        
        if (!userInfo || !userInfo.user_id) {
          setError('Vui lòng đăng nhập để xem giỏ hàng');
          setLoading(false);
          setUserProfileLoading(false);
          return;
        }
        
        setUser(userInfo);
        
        // Lấy thông tin giỏ hàng
        await fetchCartItems(userInfo.user_id);
        
        // Lấy thông tin chi tiết của người dùng từ API
        await fetchUserProfile();
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        setError('Không thể lấy thông tin người dùng');
        setLoading(false);
        setUserProfileLoading(false);
      }
    };
    
    loadUserInfo();
  }, []);

  // Lấy thông tin chi tiết người dùng từ API
  const fetchUserProfile = async () => {
    try {
      setUserProfileLoading(true);
      const userProfile = await getUserProfile();
      console.log('Thông tin người dùng:', userProfile);
      
      // Cập nhật state với thông tin chi tiết
      setUser(prevUser => ({
        ...prevUser,
        ...userProfile
      }));
      
      setUserProfileLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chi tiết người dùng:', error);
      setUserProfileLoading(false);
    }
  };

  // Fetch cart items từ API
  const fetchCartItems = async (userId) => {
    try {
      setLoading(true);
      
      const response = await getUserCart(userId);
      console.log('Dữ liệu giỏ hàng:', response);
      
      setCartItems(response.cart_items || []);
      setTotalPrice(response.cart_summary?.total_price || 0);
      setDiscountAmount(response.cart_summary?.total_price - response.cart_summary?.discounted_total || 0);
      setShippingCost(response.cart_summary?.shipping_cost || 30000);
      
      setLoading(false);
      
      // Thông báo cập nhật giỏ hàng sau khi lấy dữ liệu thành công
      notifyCartUpdated();
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
      setError('Không thể lấy thông tin giỏ hàng');
      setLoading(false);
    }
  };

  // Handle quantity changes
  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const response = await updateCartItem(cartId, newQuantity);
      console.log('Cập nhật giỏ hàng:', response);
      
      // Cập nhật state sau khi API thành công
      if (response.success) {
        // Tải lại giỏ hàng
        await fetchCartItems(user.user_id);
        
        // Thông báo cập nhật giỏ hàng
        notifyCartUpdated();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
      alert(error.response?.data?.error || 'Không thể cập nhật số lượng');
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (cartId) => {
    try {
      const response = await removeCartItem(cartId);
      console.log('Xóa sản phẩm khỏi giỏ hàng:', response);
      
      // Cập nhật state sau khi API thành công
      if (response.success) {
        // Tải lại giỏ hàng
        await fetchCartItems(user.user_id);
        
        // Thông báo cập nhật giỏ hàng
        notifyCartUpdated();
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      alert(error.response?.data?.error || 'Không thể xóa sản phẩm');
    }
  };

  // Format price to VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Calculate final price
  const finalPrice = totalPrice - discountAmount + shippingCost;

  // Handle checkout process
  const handleCheckout = async () => {
    try {
      if (!user || !user.user_id) {
        alert('Vui lòng đăng nhập để đặt hàng');
        navigate('/login');
        return;
      }
      
      if (!user.address) {
        alert('Vui lòng cập nhật địa chỉ giao hàng trước khi đặt hàng');
        navigate('/profile');
        return;
      }
      
      setOrderStatus('loading');
      
      const orderData = {
        user_id: user.user_id,
        shipping_address: user.address,
        payment_method: paymentMethod
      };
      
      const response = await checkout(
        orderData.user_id,
        orderData.shipping_address,
        orderData.payment_method
      );
      
      console.log('Đặt hàng thành công:', response);
      
      if (response.success) {
        setOrderStatus('success');
        
        // Clear cart after successful order
        setTimeout(() => {
          setCartItems([]);
          setTotalPrice(0);
          setDiscountAmount(0);
          
          // Thông báo cập nhật giỏ hàng sau khi đặt hàng thành công
          notifyCartUpdated();
        }, 2000);
      } else {
        throw new Error(response.error || 'Không thể đặt hàng');
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      setOrderStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="page-container cart-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container cart-container">
        <div className="cart-error">
          <h3>{error}</h3>
          <Link to="/login" className="action-button">Đăng Nhập Ngay</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container cart-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circle top-right"></div>
      <div className="cyber-circle bottom-left"></div>
      <div className="cyber-line left"></div>
      <div className="cyber-line right"></div>
      
      <div className="cart-header">
        <h2>Giỏ Hàng</h2>
        <p>Xem và quản lý sản phẩm bạn đã chọn mua</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-section empty-cart-section">
          <img src="/assets/icons/empty-cart.png" alt="Giỏ hàng trống" />
          <h3>Giỏ hàng của bạn đang trống</h3>
          <p>Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link to="/products" className="action-button">Tiếp Tục Mua Sắm</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-section cart-items-section">
            <h3>Sản Phẩm Đã Chọn</h3>
            <div className="cart-items-container">
              <div className="cart-header-row">
                <div className="cart-product">Sản Phẩm</div>
                <div className="cart-price">Đơn Giá</div>
                <div className="cart-quantity">Số Lượng</div>
                <div className="cart-total">Thành Tiền</div>
                <div className="cart-actions">Thao Tác</div>
              </div>
              
              {cartItems.map((item) => (
                <div className="cart-item-card" key={item.cart_id}>
                  <div className="cart-product">
                    <img 
                      src={item.product_detail.image_url || '/assets/products/placeholder.webp'} 
                      alt={item.product_detail.name} 
                    />
                    <div className="product-info">
                      <h4>{item.product_detail.name}</h4>
                      <p>{item.product_detail.description?.substring(0, 60)}...</p>
                    </div>
                  </div>
                  <div className="cart-price">{formatPrice(item.product_detail.price)}</div>
                  <div className="cart-quantity">
                    <button 
                      onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1)}
                      disabled={item.quantity >= item.product_detail.stock_quantity}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-total">
                    {item.discounted_price !== item.total_price ? (
                      <>
                        <span className="original-price">{formatPrice(item.total_price)}</span>
                        <span className="discounted-price">{formatPrice(item.discounted_price)}</span>
                      </>
                    ) : (
                      <span className="price">{formatPrice(item.total_price)}</span>
                    )}
                  </div>
                  <div className="cart-actions">
                    <button 
                      className="remove-button"
                      onClick={() => handleRemoveItem(item.cart_id)}
                      title="Xóa sản phẩm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="cart-section cart-summary-section">
            <h3>Tổng Thanh Toán</h3>
            
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="summary-row discount">
                <span>Giảm giá:</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            
            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span>{formatPrice(finalPrice)}</span>
            </div>
            
            <div className="payment-methods">
              <h4>Phương Thức Thanh Toán</h4>
              <div className="payment-options">
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <span>Thanh toán khi nhận hàng</span>
                </label>
                
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                  />
                  <span>Chuyển khoản ngân hàng</span>
                </label>
              </div>
            </div>
            
            <div className="shipping-address">
              <h4>Địa Chỉ Giao Hàng</h4>
              {userProfileLoading ? (
                <div className="loading-address">Đang tải thông tin...</div>
              ) : (
                <>
                  <p><strong>Người nhận:</strong> {user?.username || 'Chưa có thông tin'}</p>
                  <p><strong>Điện thoại:</strong> {user?.phone || 'Chưa có số điện thoại'}</p>
                  <p><strong>Địa chỉ:</strong> {user?.address || 'Chưa có địa chỉ'}</p>
                  {!user?.address && (
                    <div className="address-warning">
                      Vui lòng cập nhật địa chỉ giao hàng trước khi đặt hàng
                    </div>
                  )}
                </>
              )}
              <button 
                className="edit-address" 
                onClick={() => navigate('/profile')}
              >
                {user?.address ? 'Sửa Địa Chỉ' : 'Thêm Địa Chỉ'}
              </button>
            </div>
            
            <button 
              className={`action-button checkout-button ${orderStatus === 'loading' ? 'loading' : ''}`}
              onClick={handleCheckout}
              disabled={orderStatus === 'loading' || orderStatus === 'success' || !user?.address}
            >
              {orderStatus === 'loading' ? 'Đang xử lý...' : 
               orderStatus === 'success' ? 'Đặt hàng thành công!' : 'Đặt Hàng'}
            </button>
            
            {orderStatus === 'error' && (
              <div className="error-message">
                Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại.
              </div>
            )}
            
            <Link to="/products" className="continue-shopping">
              Tiếp Tục Mua Sắm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;