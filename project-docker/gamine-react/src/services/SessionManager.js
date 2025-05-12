import { checkUserSession, updateUserActivity, logoutUser } from './api';

// Thời gian timeout cho session - Đã vô hiệu hóa bằng cách đặt giá trị cực lớn (100 năm)
export const SESSION_TIMEOUT = 365 * 100 * 24 * 60 * 60 * 1000; // ~100 năm

// Thời gian timeout cho các API calls liên quan đến session
export const API_TIMEOUT = 5000;

// Các sự kiện để theo dõi hoạt động của người dùng
const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
];

class SessionManager {
  constructor() {
    this.timer = null;
    this.lastActivity = Date.now();
    this.isActive = false;
    this.warningShown = false;
    this.forceLogoutTimer = null;
    this.pendingRequest = null;
    this.requestTimeout = null;
  }

  // Khởi tạo theo dõi session - Đã vô hiệu hóa chức năng timeout
  init() {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    console.log('Session manager initialized (timeout disabled)');
    return;
  }

  // Dừng theo dõi session
  cleanup() {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    console.log('Session manager cleaned up (timeout disabled)');
    return;
  }

  // Cập nhật thời gian hoạt động - Đã vô hiệu hóa chức năng timeout
  updateActivity = async (forceUpdate = false) => {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  };

  // Kiểm tra xem session đã hết hạn chưa khi điều hướng - Đã vô hiệu hóa
  checkSessionOnNavigation = () => {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  };

  // Khởi động timer để kiểm tra session - Đã vô hiệu hóa
  startTimer() {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  }
  
  // Kiểm tra timeout dựa trên thời gian lưu trong localStorage - Đã vô hiệu hóa
  checkLocalTimeout() {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  }

  // Kiểm tra trạng thái session - Đã vô hiệu hóa
  async checkSessionStatus() {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  }

  // Hiển thị cảnh báo hết phiên - Đã vô hiệu hóa
  showWarning(timeRemaining) {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  }

  // Xử lý khi session timeout - Đã vô hiệu hóa
  handleTimeout() {
    // Không làm gì, chức năng đã bị vô hiệu hóa
    return;
  }

  // Đăng xuất thủ công
  logout() {
    // Hàm này vẫn được giữ nguyên vì có thể được sử dụng cho đăng xuất thủ công
    return logoutUser();
  }
}

// Singleton instance
const sessionManager = new SessionManager();
export default sessionManager; 