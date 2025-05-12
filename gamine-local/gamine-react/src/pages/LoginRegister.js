import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './LoginRegister.css';
import { registerUser } from '../services/api';
import { useAuth } from '../services/AuthContext';

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  // Check for expired session message
  useEffect(() => {
    const sessionExpired = sessionStorage.getItem('sessionExpired');
    if (sessionExpired === 'true') {
      setErrorMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      sessionStorage.removeItem('sessionExpired');
    }
  }, []);
  
  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to previous page or home
      const { state } = location;
      const redirectTo = state?.from || '/';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, location]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    loginIdentifier: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
    // Clear any error messages when user starts typing
    setErrorMessage('');
  };

  const toggleForm = () => {
    // Clear error and success messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // When switching to login after registration, keep the username in the login field
    if (!isLogin) {
      // Switching to login form
      if (formData.username) {
        setFormData(prev => ({
          ...prev,
          loginIdentifier: formData.username // Use username as login identifier
        }));
      }
    }
    
    setIsLogin(!isLogin);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.loginIdentifier) return 'Tên đăng nhập hoặc Email là bắt buộc';
      if (!formData.password) return 'Mật khẩu là bắt buộc';
    } else {
      if (!formData.username) return 'Tên đăng nhập là bắt buộc';
      if (!formData.email) return 'Email là bắt buộc';
      if (!formData.password) return 'Mật khẩu là bắt buộc';
      if (formData.password !== formData.confirmPassword) 
        return 'Mật khẩu không khớp';
      
      // Basic password validation
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        return 'Mật khẩu phải có ít nhất 8 ký tự với ít nhất một chữ hoa, một số và một ký tự đặc biệt';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      if (isLogin) {
        // Sử dụng AuthContext login
        await login(formData.loginIdentifier, formData.password);
        setSuccessMessage('Đăng nhập thành công! Chào mừng trở lại.');
        
        // Redirect to homepage after short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Handle Registration
        const userData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || '',
          address: formData.address || ''
        };
        
        const result = await registerUser(userData);
        console.log('Registration successful:', result);
        setSuccessMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        
        // Clear form and switch to login
        setFormData({
          ...formData,
          password: '',
          confirmPassword: '',
          loginIdentifier: formData.username || formData.email // Use username or email as login identifier
        });
        
        // Switch to login view after short delay
        setTimeout(() => {
          setIsLogin(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-register-container">
      {/* Cyberpunk decorative elements */}
      <div className="cyber-circuit left"></div>
      <div className="cyber-circuit right"></div>
      <div className="cyber-line line1"></div>
      <div className="cyber-line line2"></div>
      <div className="cyber-dot dot1"></div>
      <div className="cyber-dot dot2"></div>
      <div className="cyber-dot dot3"></div>
      <div className="cyber-dot dot4"></div>
      
      <div className="form-container">
        <div className="form-tabs">
          <div 
            className={`tab ${isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(true)}
          >
            Đăng nhập
          </div>
          <div 
            className={`tab ${!isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(false)}
          >
            Đăng ký
          </div>
        </div>
        
        {/* Error and Success Messages */}
        {errorMessage && (
          <div className="message error-message">
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="message success-message">
            <span>{successMessage}</span>
          </div>
        )}
        
        {isLogin ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Chào mừng trở lại</h2>
            <p>Đăng nhập để truy cập tài khoản của bạn</p>
            
            <div className="form-group">
              <label htmlFor="loginIdentifier">Tên đăng nhập hoặc Email</label>
              <input 
                type="text" 
                id="loginIdentifier" 
                placeholder="Nhập tên đăng nhập hoặc email" 
                value={formData.loginIdentifier}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group password-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input-container">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="Nhập mật khẩu của bạn" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <img 
                  src={`../assets/icons/eye-${showPassword ? 'open' : 'closed'}.png`} 
                  alt="Hiển thị/Ẩn mật khẩu" 
                  className="toggle-password" 
                  onClick={togglePasswordVisibility} 
                />
              </div>
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Ghi nhớ đăng nhập</label>
              </div>
              <Link to="#" className="forgot-password">Quên mật khẩu?</Link>
            </div>
            
            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            
            <div className="form-footer">
              <p>Chưa có tài khoản? <span className="switch-form" onClick={toggleForm}>Đăng ký</span></p>
            </div>
          </form>
        ) : (
          <form className="register-form" onSubmit={handleSubmit}>
            <h2>Tạo tài khoản</h2>
            <p>Tham gia cộng đồng game của chúng tôi</p>
            
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input 
                type="text" 
                id="username" 
                placeholder="Nhập tên đăng nhập của bạn" 
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Địa chỉ Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="Nhập email của bạn" 
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input 
                type="tel" 
                id="phone" 
                placeholder="Nhập số điện thoại của bạn" 
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <textarea 
                id="address" 
                placeholder="Nhập địa chỉ của bạn" 
                rows="3"
                value={formData.address}
                onChange={handleInputChange}
                disabled={isLoading}
              ></textarea>
            </div>
            
            <div className="form-group password-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input-container">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="Tạo mật khẩu" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <img 
                  src={`../assets/icons/eye-${showPassword ? 'open' : 'closed'}.png`} 
                  alt="Hiển thị/Ẩn mật khẩu" 
                  className="toggle-password" 
                  onClick={togglePasswordVisibility} 
                />
              </div>
              <div className="password-requirements">
                <p>Mật khẩu phải chứa:</p>
                <ul>
                  <li>Ít nhất 8 ký tự</li>
                  <li>Ít nhất một chữ hoa</li>
                  <li>Ít nhất một chữ số</li>
                  <li>Ít nhất một ký tự đặc biệt</li>
                </ul>
              </div>
            </div>
            
            <div className="form-group password-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="password-input-container">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirmPassword" 
                  placeholder="Xác nhận mật khẩu của bạn" 
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <img 
                  src={`../assets/icons/eye-${showConfirmPassword ? 'open' : 'closed'}.png`} 
                  alt="Hiển thị/Ẩn mật khẩu" 
                  className="toggle-password" 
                  onClick={toggleConfirmPasswordVisibility} 
                />
              </div>
            </div>
            
            <div className="form-group terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">Tôi đồng ý với <Link to="/terms-conditions">Điều khoản và Điều kiện</Link> và <Link to="/privacy-policy">Chính sách Bảo mật</Link></label>
            </div>
            
            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
            
            <div className="form-footer">
              <p>Đã có tài khoản? <span className="switch-form" onClick={toggleForm}>Đăng nhập</span></p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginRegister; 