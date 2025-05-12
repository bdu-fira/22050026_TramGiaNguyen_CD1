import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser, checkAuthStatus, getUserProfile } from './api';
import sessionManager from './SessionManager';

// Tạo context
const AuthContext = createContext(null);

// Custom hook để sử dụng AuthContext
export const useAuth = () => useContext(AuthContext);

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Khởi tạo và kiểm tra trạng thái xác thực khi component mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // SessionManager đã bị vô hiệu hóa, không cần kiểm tra session timeout nữa
      
      try {
        // Kiểm tra trạng thái xác thực
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('userToken');
        
        if (userData && token) {
          console.log('Auth token found, setting user data');
          setUser(userData);
          setIsAuthenticated(true);
          
          // Đã vô hiệu hóa sessionManager.init()
          
          // Thử lấy thông tin user mới nhất từ server
          try {
            const profile = await getUserProfile();
            if (profile) {
              console.log('Updated user profile data received');
              setUser(prevUser => ({
                ...prevUser,
                ...profile
              }));
            }
          } catch (profileError) {
            console.error('Không thể lấy thông tin profile:', profileError);
            // Check if error is due to authentication
            if (profileError.response && profileError.response.status === 401) {
              console.log('Authentication error detected, clearing credentials');
              // Xóa dữ liệu nếu lỗi xác thực
              localStorage.removeItem('userToken');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
              navigate('/login-register');
            }
          }
        } else {
          console.log('No stored auth credentials found');
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo xác thực:', error);
        // Xóa dữ liệu nếu có lỗi
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Xử lý sự kiện visibilitychange để phát hiện khi tab đóng
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Đặt dấu hiệu và thời gian ẩn
        sessionStorage.setItem('tabHiddenAt', Date.now());
        
        // Kiểm tra lại sau khoảng thời gian ngắn
        // Nếu tab thực sự bị đóng, code này sẽ không bao giờ chạy
        setTimeout(() => {
          sessionStorage.removeItem('tabHiddenAt');
        }, 100);
      } else if (document.visibilityState === "visible") {
        // Tab đã trở lại hiển thị, xóa dấu hiệu
        sessionStorage.removeItem('tabHiddenAt');
      }
    };
    
    // Khi trang được tải lại, kiểm tra xem có phải tab trước đó đã bị đóng không
    const handleLoad = () => {
      const tabHiddenAt = sessionStorage.getItem('tabHiddenAt');
      if (tabHiddenAt && isAuthenticated) {
        // Tab trước đó đã bị đóng - thực hiện đăng xuất
        // Sử dụng tham số useBeacon=true
        logout(true);
        sessionStorage.removeItem('tabHiddenAt');
      }
    };
    
    // Đăng ký các sự kiện
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener('load', handleLoad);
    
    // Cleanup khi component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener('load', handleLoad);
    };
  }, [navigate, isAuthenticated]);

  // Hàm đăng nhập
  const login = async (loginIdentifier, password) => {
    try {
      // Gọi API đăng nhập
      const result = await loginUser(loginIdentifier, password);
      console.log('Login successful', result);
      
      // Lưu thông tin user vào state
      setUser({
        user_id: result.user_id,
        username: result.username,
        email: result.email
      });
      
      setIsAuthenticated(true);
      
      // Đã vô hiệu hóa sessionManager.init()
      
      return { success: true };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw error;
    }
  };

  // Hàm đăng xuất
  const logout = async (useBeacon = false) => {
    try {
      console.log('Logout requested');
      // Dùng sessionManager.logout() thay vì cleanup()
      
      // Gọi API đăng xuất
      await logoutUser(useBeacon);
      
      // Xóa thông tin user
      setUser(null);
      setIsAuthenticated(false);
      
      // Xóa dữ liệu trong localStorage
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      
      // Chuyển hướng đến trang login
      navigate('/login-register');
      
      console.log('Logout completed');
      return { success: true };
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      // Vẫn thử logout ở client nếu API fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      navigate('/login-register');
      throw error;
    }
  };

  // Cung cấp context value
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 