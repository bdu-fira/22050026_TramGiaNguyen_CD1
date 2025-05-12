import axios from 'axios';

// Session timeout value in milliseconds (5 minutes)
export const SESSION_TIMEOUT = Number.MAX_SAFE_INTEGER;

// URLs for session management
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : `http://${window.location.hostname}:8000/api`;
const SESSION_CHECK_URL = `${API_URL}/admin-session/check/`;
const SESSION_UPDATE_URL = `${API_URL}/admin-session/update/`;

// Events that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
];

// Class to manage admin session and activity tracking
export class SessionManager {
  private timer: NodeJS.Timeout | null = null;
  private checkTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private logoutCallback: () => void;
  private isListening: boolean = false;
  private sessionTimedOut: boolean = false;
  private updateTimer: NodeJS.Timeout | null = null;
  private queuedUpdate: boolean = false;

  constructor(logoutCallback: () => void) {
    this.logoutCallback = logoutCallback;
    
    // Block browser history to prevent back navigation after logout
    window.addEventListener('popstate', this.handlePopState);
  }

  // Handle browser history navigation
  private handlePopState = (event: PopStateEvent) => {
    if (this.sessionTimedOut) {
      // If session has timed out, prevent navigation and redirect to login
      window.history.pushState(null, '', window.location.href);
      this.logoutCallback();
    }
  };

  // Initialize the session manager and start tracking activity
  public init() {
    if (this.isListening) return;
    
    // Reset timeout flag when initializing
    this.sessionTimedOut = false;
    
    // Không theo dõi hoạt động của người dùng
    this.isListening = true;
    
    // Không khởi tạo bất kỳ timer nào
  }

  // Clean up event listeners and timer
  public cleanup() {
    if (!this.isListening) return;
    
    // Không cần xóa các timer vì chúng không được khởi tạo
    
    // Không cần xóa các event listener vì chúng không được đăng ký
    
    this.isListening = false;
  }

  // Handle user activity by updating last activity time and sending to server
  private handleUserActivity = () => {
    // If session already timed out, don't allow activity updates
    if (this.sessionTimedOut) {
      this.logoutCallback();
      return;
    }
    
    this.lastActivity = Date.now();
    
    // Queue an update if one isn't already queued
    if (!this.queuedUpdate) {
      this.queuedUpdate = true;
      
      // Debounce - wait for 200ms of inactivity before sending update
      setTimeout(() => {
        this.updateServerActivity();
        this.queuedUpdate = false;
      }, 200);
    }
  };

  // Start the timer for periodic session checks
  private startTimer() {
    // Phương thức bị vô hiệu hóa - không làm gì cả
    return;
  }

  // Update activity timestamp on the server
  private updateServerActivity() {
    // Phương thức bị vô hiệu hóa - không làm gì
    return;
  }

  // Force update server activity regardless of throttling
  private forceUpdateServerActivity() {
    // Phương thức bị vô hiệu hóa - không làm gì
    return;
  }

  // Check if the session is still active with the server
  private checkSessionStatus() {
    // Phương thức bị vô hiệu hóa - không làm gì
    return;
  }
}

// Create and export a singleton instance of the SessionManager
let sessionManagerInstance: SessionManager | null = null;

export const initSessionManager = (logoutCallback: () => void): SessionManager => {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(logoutCallback);
  }
  return sessionManagerInstance;
}; 