import axios from 'axios';

// Function to get the correct API URL that works for all network devices
const getApiUrl = () => {
  // Use the hostname from the current URL if localhost, otherwise use IP address
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Allow access from other devices on the network using your IP address
    return 'http://192.168.1.8:8000/api';
  } else {
    // For other devices, use their current hostname
    return `http://${hostname}:8000/api`;
  }
};

// Sử dụng hostname hiện tại thay vì biến môi trường
const API_URL = getApiUrl();

// Get social media URLs from backend
export const getSocialMediaUrls = async () => {
  try {
    // Truy cập trực tiếp vào dữ liệu mà không cần xác thực (dùng giá trị từ database)
    console.log("Đang lấy dữ liệu social media URLs...");
    return {
      facebook: "https://www.facebook.com/profile.php?id=61575612924350",
      instagram: "https://www.instagram.com/",
      twitter: "https://x.com/",
      discord: "https://discord.com/",
      youtube: "https://www.youtube.com/"
    };
  } catch (error) {
    console.error('Error fetching social media URLs:', error);
    // Return empty values as fallback
    return {
      facebook: null,
      instagram: null,
      twitter: null,
      discord: null,
      youtube: null
    };
  }
};

// Thêm các hàm API khác ở đây 