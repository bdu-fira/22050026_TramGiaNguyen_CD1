import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyOrders.css';
import { fetchUserOrders, cancelOrder } from '../services/api';

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [user, setUser] = useState(null);

  // Lấy thông tin người dùng và đơn hàng
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login-register');
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchOrders(parsedUser.user_id || parsedUser.id);
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
        setError('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
        navigate('/login-register');
      }
    };

    checkAuth();
  }, [navigate]);

  // Lấy danh sách đơn hàng từ API
  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      const response = await fetchUserOrders(userId);
      
      if (response.success && response.orders) {
        // Chuyển đổi dữ liệu từ API để phù hợp với cấu trúc giao diện
        const formattedOrders = response.orders.map(order => ({
          order_id: order.order_id,
          order_number: `ORD-${new Date(order.created_at).getFullYear()}${order.order_id.toString().padStart(4, '0')}`,
          status: mapOrderStatus(order.order_status),
          order_date: order.created_at,
          total_amount: order.total_amount,
          items: order.details.map(detail => ({
            product_id: detail.product,
            name: detail.product_name,
            quantity: detail.quantity,
            price: detail.price,
            image: detail.image_url ? getProductImage(detail) : getProductImage(detail)
          })),
          shipping_address: order.shipping_address,
          payment_method: order.payment_method || 'Thanh toán khi nhận hàng',
          payment_status: order.payment_status || 'Pending'
        }));
        
        setOrders(formattedOrders);
      } else {
        setOrders([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      setError('Không thể kết nối đến máy chủ để lấy thông tin đơn hàng. Có thể API chưa được triển khai hoặc đang bảo trì. Vui lòng liên hệ bộ phận hỗ trợ hoặc thử lại sau.');
      setLoading(false);
    }
  };

  // Helper function để lấy hình ảnh sản phẩm (giả định)
  const getProductImage = (detail) => {
    // Sử dụng hình ảnh từ API nếu có
    if (detail.image_url) {
      // Nếu là đường dẫn tương đối, thêm domain
      if (detail.image_url.startsWith('/')) {
        return `http://${window.location.hostname}:8000${detail.image_url}`;
      }
      return detail.image_url;
    }
    
    // Nếu không có, sử dụng ảnh placeholder
    return `/assets/images/products/product-${detail.product % 10 + 1}.jpg`;
  };

  // Helper function để chuyển đổi trạng thái đơn hàng từ tiếng Anh sang tiếng Việt
  const mapOrderStatus = (status) => {
    switch (status) {
      case 'Pending': return 'Đang xử lý';
      case 'Processing': return 'Đang xử lý';
      case 'In transit': return 'Đang vận chuyển';
      case 'Completed': return 'Đã giao hàng';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Lọc đơn hàng theo trạng thái
  const filteredOrders = () => {
    switch (activeTab) {
      case 'processing':
        return orders.filter(order => order.status === 'Đang xử lý');
      case 'shipping':
        return orders.filter(order => order.status === 'Đang vận chuyển');
      case 'delivered':
        return orders.filter(order => order.status === 'Đã giao hàng');
      case 'cancelled':
        return orders.filter(order => order.status === 'Đã hủy');
      default:
        return orders;
    }
  };

  // Hiển thị chi tiết đơn hàng
  const showOrderDetail = (order) => {
    setSelectedOrder(order);
  };

  // Đóng modal chi tiết đơn hàng
  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  // Format số tiền về định dạng VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format ngày giờ về định dạng Việt Nam
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // Hủy đơn hàng
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await cancelOrder(orderId, user.user_id || user.id);
      
      if (response.success) {
        // Cập nhật lại danh sách đơn hàng sau khi hủy thành công
        setOrders(orders.map(order => 
          order.order_id === orderId 
            ? { ...order, status: 'Đã hủy' } 
            : order
        ));
        
        // Nếu đơn hàng đang được xem chi tiết, cập nhật thông tin
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'Đã hủy' });
        }
        
        alert('Đơn hàng đã được hủy thành công!');
      } else {
        throw new Error(response.error || 'Không thể hủy đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      alert('Đã xảy ra lỗi khi hủy đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-orders-container loading">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-container error">
        <div className="error-icon">!</div>
        <h2>Đã xảy ra lỗi</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div className="orders-header">
        <div className="header-content">
          <h1>Đơn Hàng Của Tôi</h1>
          <p>Theo dõi và quản lý các đơn hàng bạn đã đặt</p>
        </div>
      </div>

      <div className="orders-content">
        <div className="order-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            Tất cả đơn hàng
          </button>
          <button 
            className={activeTab === 'processing' ? 'active' : ''}
            onClick={() => setActiveTab('processing')}
          >
            Đang xử lý
          </button>
          <button 
            className={activeTab === 'shipping' ? 'active' : ''}
            onClick={() => setActiveTab('shipping')}
          >
            Đang vận chuyển
          </button>
          <button 
            className={activeTab === 'delivered' ? 'active' : ''}
            onClick={() => setActiveTab('delivered')}
          >
            Đã giao hàng
          </button>
          <button 
            className={activeTab === 'cancelled' ? 'active' : ''}
            onClick={() => setActiveTab('cancelled')}
          >
            Đã hủy
          </button>
        </div>

        <div className="orders-list">
          {filteredOrders().length > 0 ? (
            filteredOrders().map(order => (
              <div className="order-card" key={order.order_id}>
                <div className="order-header">
                  <div className="order-info">
                    <h3>Đơn hàng #{order.order_number}</h3>
                    <span className="order-date">Đặt ngày: {formatDate(order.order_date)}</span>
                  </div>
                  <div className={`order-status status-${getStatusClass(order.status)}`}>
                    {order.status}
                  </div>
                </div>
                
                <div className="order-preview">
                  <div className="product-previews">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div className="product-preview-item" key={index}>
                        <img src={item.image} alt={item.name} />
                        {order.items.length > 3 && index === 2 && (
                          <div className="more-items">+{order.items.length - 3}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="order-summary">
                    <div className="order-total">{formatCurrency(order.total_amount)}</div>
                    <div className="order-items-count">{order.items.length} sản phẩm</div>
                    <button 
                      className="view-detail-btn"
                      onClick={() => showOrderDetail(order)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-orders">
              <div className="empty-icon">
                <i className="fas fa-shopping-bag"></i>
              </div>
              <h3>Không có đơn hàng nào</h3>
              <p>Bạn chưa có đơn hàng nào trong danh mục này</p>
              <button onClick={() => navigate('/products')} className="shop-now-btn">
                Mua sắm ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="order-detail-modal">
          <div className="modal-overlay" onClick={closeOrderDetail}></div>
          <div className="modal-content">
            <button className="close-modal" onClick={closeOrderDetail}>&times;</button>
            
            <div className="modal-header">
              <h2>Chi Tiết Đơn Hàng #{selectedOrder.order_number}</h2>
              <div className={`order-status status-${getStatusClass(selectedOrder.status)}`}>
                {selectedOrder.status}
              </div>
            </div>

            <div className="order-progress">
              <div className={`progress-step ${progressStepActive(selectedOrder.status, 1)}`}>
                <div className="step-icon"><i className="fas fa-clipboard-check"></i></div>
                <div className="step-label">Đã đặt hàng</div>
                <div className="step-date">{formatDate(selectedOrder.order_date)}</div>
              </div>
              <div className={`progress-step ${progressStepActive(selectedOrder.status, 2)}`}>
                <div className="step-icon"><i className="fas fa-box"></i></div>
                <div className="step-label">Đang xử lý</div>
              </div>
              <div className={`progress-step ${progressStepActive(selectedOrder.status, 3)}`}>
                <div className="step-icon"><i className="fas fa-shipping-fast"></i></div>
                <div className="step-label">Đang vận chuyển</div>
                {selectedOrder.status === 'Đang vận chuyển' && selectedOrder.tracking_number && (
                  <div className="step-date">Mã vận đơn: {selectedOrder.tracking_number}</div>
                )}
              </div>
              <div className={`progress-step ${progressStepActive(selectedOrder.status, 4)}`}>
                <div className="step-icon"><i className="fas fa-check-circle"></i></div>
                <div className="step-label">Đã giao hàng</div>
                {selectedOrder.status === 'Đã giao hàng' && selectedOrder.delivery_date && (
                  <div className="step-date">{formatDate(selectedOrder.delivery_date)}</div>
                )}
              </div>
            </div>

            <div className="order-detail-sections">
              <div className="detail-section">
                <h3>Sản phẩm</h3>
                <div className="order-products">
                  {selectedOrder.items.map((item, index) => (
                    <div className="product-item" key={index}>
                      <div className="product-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="product-details">
                        <div className="product-name">{item.name}</div>
                        <div className="product-quantity">x{item.quantity}</div>
                      </div>
                      <div className="product-price">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="details-columns">
                <div className="detail-section">
                  <h3>Thông tin giao hàng</h3>
                  <div className="detail-info">
                    <p><strong>Địa chỉ:</strong> {selectedOrder.shipping_address}</p>
                    {selectedOrder.tracking_number && (
                      <p><strong>Mã vận đơn:</strong> {selectedOrder.tracking_number}</p>
                    )}
                    {selectedOrder.status === 'Đang vận chuyển' && selectedOrder.estimated_delivery && (
                      <p><strong>Dự kiến giao:</strong> {formatDate(selectedOrder.estimated_delivery)}</p>
                    )}
                    {selectedOrder.status === 'Đã giao hàng' && selectedOrder.delivery_date && (
                      <p><strong>Thời gian giao:</strong> {formatDate(selectedOrder.delivery_date)}</p>
                    )}
                    {selectedOrder.status === 'Đã hủy' && (
                      <>
                        <p><strong>Thời gian hủy:</strong> {formatDate(selectedOrder.cancel_date || selectedOrder.order_date)}</p>
                        <p><strong>Lý do hủy:</strong> {selectedOrder.cancel_reason || 'Không có thông tin'}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Thông tin thanh toán</h3>
                  <div className="detail-info">
                    <p><strong>Phương thức:</strong> {selectedOrder.payment_method}</p>
                    <p><strong>Tình trạng:</strong> {mapPaymentStatus(selectedOrder.payment_status)}</p>
                    <div className="payment-summary">
                      <div className="summary-row">
                        <span>Tạm tính:</span>
                        <span>{formatCurrency(calculateSubtotal(selectedOrder.items))}</span>
                      </div>
                      <div className="summary-row">
                        <span>Phí vận chuyển:</span>
                        <span>{formatCurrency(30000)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Giảm giá:</span>
                        <span>-{formatCurrency(calculateDiscount(selectedOrder))}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Tổng cộng:</span>
                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-actions">
                {selectedOrder.status === 'Đang xử lý' && (
                  <button className="cancel-order-btn" onClick={() => handleCancelOrder(selectedOrder.order_id)}>Hủy đơn hàng</button>
                )}
                <button className="reorder-btn">Đặt lại</button>
                <button className="contact-support-btn">Liên hệ hỗ trợ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusClass(status) {
  switch (status) {
    case 'Đang xử lý': return 'processing';
    case 'Đang vận chuyển': return 'shipping';
    case 'Đã giao hàng': return 'delivered';
    case 'Đã hủy': return 'cancelled';
    default: return 'default';
  }
}

function progressStepActive(status, step) {
  if (status === 'Đã hủy' && step > 1) return '';
  
  switch (status) {
    case 'Đang xử lý': return step <= 2 ? 'active' : '';
    case 'Đang vận chuyển': return step <= 3 ? 'active' : '';
    case 'Đã giao hàng': return 'active';
    default: return step === 1 ? 'active' : '';
  }
}

function calculateSubtotal(items) {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function calculateDiscount(order) {
  // Tính toán giảm giá (tạm tính + phí ship - tổng tiền cuối cùng)
  const subtotal = calculateSubtotal(order.items);
  const shippingFee = 30000;
  return Math.max(0, subtotal + shippingFee - order.total_amount);
}

function mapPaymentStatus(status) {
  switch (status) {
    case 'Pending': return 'Chờ thanh toán';
    case 'Completed': return 'Đã thanh toán';
    case 'Failed': return 'Thanh toán thất bại';
    default: return status;
  }
}

export default MyOrders; 