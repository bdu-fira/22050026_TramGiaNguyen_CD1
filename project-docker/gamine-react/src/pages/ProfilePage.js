import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { updateUserProfile, changePassword } from '../services/api';
import { useAuth } from '../services/AuthContext';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data states
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    street_address: '',
    ward: '',
    district: '',
    city: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);
  
  // Set user data when it's available
  useEffect(() => {
    if (user) {
      console.log('User data loaded:', user);
      
      // Parse address components from address string
      const addressComponents = parseAddress(user.address || '');
      
      // Set user data with parsed address components
      setUserData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        // Include both the original address and the parsed components
        address: user.address || '',
        street_address: addressComponents.street_address,
        ward: addressComponents.ward,
        district: addressComponents.district,
        city: addressComponents.city
      });
    }
  }, [user]);
  
  // Thêm effect để kiểm tra dữ liệu từ localStorage
  useEffect(() => {
    // Try to get user data from localStorage as a backup
    try {
      const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data from localStorage:', localStorageUser);
      
      if (localStorageUser && localStorageUser.address) {
        console.log('Found address in localStorage:', localStorageUser.address);
        
        // Parse address from localStorage
        const addressComponents = parseAddress(localStorageUser.address);
        
        // Update userData with address components if not already set
        setUserData(current => {
          // Only update if current address fields are empty
          if (!current.street_address && !current.ward && 
              !current.district && !current.city) {
            return {
              ...current,
              street_address: addressComponents.street_address,
              ward: addressComponents.ward,
              district: addressComponents.district,
              city: addressComponents.city
            };
          }
          return current;
        });
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }, []);
  
  // Hàm phân tích địa chỉ từ chuỗi
  const parseAddress = (addressString) => {
    console.log('Parsing address string:', addressString);
    
    if (!addressString || typeof addressString !== 'string') {
      console.log('Address is empty or invalid, returning default empty values');
      return {
        street_address: '',
        ward: '',
        district: '',
        city: '',
      };
    }

    try {
      // Thử tách chuỗi địa chỉ thành các phần
      // Format: [Số nhà, đường], [Phường/Xã], [Quận/Huyện], [Tỉnh/Thành phố]
      const parts = addressString.split(', ');
      console.log('Address parts after splitting:', parts);
      
      const result = {
        street_address: parts[0] || '',
        ward: parts[1] || '',
        district: parts[2] || '',
        city: parts[3] || '',
      };
      
      console.log('Parsed address components:', result);
      return result;
    } catch (error) {
      console.error('Error parsing address:', error);
      return {
        street_address: '',
        ward: '',
        district: '',
        city: '',
      };
    }
  };

  // Hàm kết hợp các phần địa chỉ thành một chuỗi
  const combineAddress = () => {
    const { street_address, ward, district, city } = userData;
    
    // Chỉ bao gồm các phần không trống
    const parts = [];
    if (street_address) parts.push(street_address);
    if (ward) parts.push(ward);
    if (district) parts.push(district);
    if (city) parts.push(city);
    
    return parts.join(', ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateProfileForm = () => {
    const errors = {};
    
    // Check if street_address exists before checking trim
    if (!userData.street_address || !userData.street_address.trim()) {
      errors.street_address = 'Vui lòng nhập số nhà, đường';
    }
    
    // Check if ward exists before checking trim
    if (!userData.ward || !userData.ward.trim()) {
      errors.ward = 'Vui lòng nhập phường/xã';
    }
    
    // Check if district exists before checking trim
    if (!userData.district || !userData.district.trim()) {
      errors.district = 'Vui lòng nhập quận/huyện';
    }
    
    // Check if city exists before checking trim
    if (!userData.city || !userData.city.trim()) {
      errors.city = 'Vui lòng nhập tỉnh/thành phố';
    }
    
    // Check if phone exists before checking trim
    if (!userData.phone || !userData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(userData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
    }
    
    console.log('Validation errors:', errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    // Debug the current form data
    console.log('Current user data state:', userData);
    
    // Kiểm tra form trước khi gửi
    if (!validateProfileForm()) {
      setMessage({
        type: 'error',
        text: 'Vui lòng điền đầy đủ thông tin.'
      });
      return;
    }

    try {
      // Kết hợp các trường địa chỉ thành một chuỗi
      const combinedAddress = combineAddress();
      console.log('Combined address to save:', combinedAddress);
      
      // Chuẩn bị dữ liệu để gửi đi
      const dataToSubmit = {
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        address: combinedAddress,
        user_id: user?.user_id // Ensure user_id is included
      };
      
      console.log('Data to submit:', dataToSubmit);
      
      const updatedUser = await updateUserProfile(dataToSubmit);
      console.log('Update response from server:', updatedUser);
      
      // Update userData state with new data and parsed address
      const newUserData = {
        ...userData,
        ...updatedUser,
        address: combinedAddress
      };
      
      setUserData(newUserData);
      setMessage({
        type: 'success',
        text: 'Thông tin tài khoản đã được cập nhật thành công!'
      });
      
      // Update user info in localStorage
      const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedLocalUser = {
        ...localStorageUser,
        ...dataToSubmit,
        // Keep other fields that might be in localStorage but not in our form
      };
      
      console.log('Updating localStorage with:', updatedLocalUser);
      localStorage.setItem('user', JSON.stringify(updatedLocalUser));
      
      // Notify header component about the update if needed
      const event = new CustomEvent('userUpdate', {
        detail: { type: 'USER_UPDATED', user: updatedLocalUser }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.'
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
      });
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setMessage({
        type: 'error',
        text: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ số và ký tự đặc biệt.'
      });
      return;
    }

    try {
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      setMessage({
        type: 'success',
        text: 'Mật khẩu đã được cập nhật thành công!'
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.'
      });
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error logging out. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-container loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Thông Tin Tài Khoản</h1>
        <div className="user-avatar">
          <i className="fas fa-user-circle"></i>
          <span className="username">{userData?.username || 'Người dùng'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Thông tin cá nhân
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <i className="fas fa-lock"></i> Bảo mật
        </button>
      </div>

      {/* Notification */}
      {message && <div className={`notification ${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</div>}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                name="username"
                value={userData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
                disabled
              />
              <small>Email không thể thay đổi</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại <span className="required-mark">*</span></label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="address-section">
              <h3>Địa chỉ giao hàng</h3>
              
              <div className="form-group">
                <label htmlFor="street_address">Số nhà, tên đường <span className="required-mark">*</span></label>
                <input
                  type="text"
                  id="street_address"
                  name="street_address"
                  value={userData.street_address}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 123 Đường Lê Lợi"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ward">Phường/Xã <span className="required-mark">*</span></label>
                <input
                  type="text"
                  id="ward"
                  name="ward"
                  value={userData.ward}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Phường Bến Nghé"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="district">Quận/Huyện <span className="required-mark">*</span></label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={userData.district}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Quận 1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">Tỉnh/Thành phố <span className="required-mark">*</span></label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={userData.city}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                  required
                />
              </div>
            </div>
            
            <div className="form-summary">
              <h4>Địa chỉ đầy đủ:</h4>
              <p className="full-address-preview">{combineAddress() || 'Chưa có thông tin'}</p>
            </div>
            
            <button type="submit" className="save-btn">
              <i className="fas fa-save"></i> Lưu thay đổi
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="password-requirements">
              <p>Mật khẩu phải đáp ứng các yêu cầu sau:</p>
              <ul>
                <li>Ít nhất 8 ký tự</li>
                <li>Ít nhất 1 chữ hoa</li>
                <li>Ít nhất 1 chữ số</li>
                <li>Ít nhất 1 ký tự đặc biệt</li>
              </ul>
            </div>
            
            <button type="submit" className="save-btn">
              <i className="fas fa-key"></i> Đổi mật khẩu
            </button>
          </form>
        )}
      </div>

      <button onClick={handleLogout} className="logout-btn">
        <i className="fas fa-sign-out-alt"></i> Đăng xuất
      </button>
    </div>
  );
}

export default ProfilePage; 