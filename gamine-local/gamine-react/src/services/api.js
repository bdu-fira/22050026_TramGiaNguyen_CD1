// API service cho việc kết nối với Django backend

import axios from 'axios';

// Function to get the correct API URL that works for all network devices
const getApiUrl = () => {
  // Use the hostname from the current URL if localhost, otherwise use IP address
  const hostname = window.location.hostname;
    return `http://${hostname}:8000/api`;
};

// Tạo instance axios với base URL và sử dụng IP máy host thay vì localhost
const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Function to track user activities
export const trackUserActivity = async (activityData) => {
  try {
    // Get user ID from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    if (!userData || !userData.user_id) {
      // Don't track if user is not logged in
      return;
    }

    const payload = {
      user_id: userData.user_id,
      ...activityData
    };

    // Send request to track activity
    await api.post('/user-activity/track/', payload);
    return true;
  } catch (error) {
    console.error('Error tracking user activity:', error);
    // Silently fail - don't interrupt user experience for tracking errors
    return false;
  }
};

// API cho Terms and Conditions
export const fetchTermsAndConditions = async () => {
  try {
    const response = await api.get('/client/terms-conditions/');
    return response.data;
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories/`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products/`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    
    // Đảm bảo mỗi sản phẩm đều có category_name
    const products = data.map(product => {
      // Nếu sản phẩm đã có category_name từ API, giữ nguyên
      if (product.category_name) {
        return product;
      }
      
      // Trường hợp cần tự xử lý
      // Lấy dữ liệu category từ API
      return fetchCategoryNameById(product)
        .then(categoryName => {
          return { ...product, category_name: categoryName };
        })
        .catch(() => {
          return product; // Trả về sản phẩm gốc nếu không lấy được tên danh mục
        });
    });
    
    // Vì map với promises sẽ tạo ra mảng promises, cần chờ tất cả hoàn thành
    return Promise.all(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Hàm phụ trợ để lấy tên danh mục từ ID
const fetchCategoryNameById = async (product) => {
  try {
    if (!product.category && !product.category_id) {
      return "";
    }
    
    const categoryId = product.category_id || product.category;
    const response = await fetch(`${API_URL}/categories/${categoryId}/`);
    
    if (response.ok) {
      const category = await response.json();
      return category.name;
    }
    
    return "";
  } catch (error) {
    console.error(`Không thể lấy tên danh mục cho sản phẩm ID ${product.product_id}:`, error);
    return "";
  }
};

export const fetchProductsByCategory = async (categoryId) => {
  try {
    console.log(`Đang gửi yêu cầu tới API để lấy sản phẩm theo category_id: ${categoryId}`);
    
    // Thử nhiều cách gọi API khác nhau
    const urls = [
      `${API_URL}/products/?category_id=${categoryId}`,
      `${API_URL}/products/?category=${categoryId}`,
      `${API_URL}/products/category/${categoryId}/`
    ];
    
    let data = [];
    let responseOk = false;
    
    // Thử từng URL cho đến khi thành công
    for (const url of urls) {
      try {
        console.log(`Thử gửi request đến: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          console.log(`Request thành công với URL: ${url}`);
          const responseText = await response.text();
          console.log(`API Response text:`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
          
          try {
            const parsedData = JSON.parse(responseText);
            
            // Kiểm tra nếu phản hồi là mảng hoặc có trường results
            if (Array.isArray(parsedData)) {
              data = parsedData;
            } else if (parsedData && Array.isArray(parsedData.results)) {
              data = parsedData.results;
            } else {
              console.log('Phản hồi không phải là mảng hoặc không có trường results:', parsedData);
              continue;  // Thử URL tiếp theo
            }
            
            responseOk = true;
            break;  // Thoát vòng lặp nếu đã có dữ liệu
          } catch (jsonError) {
            console.error('Lỗi khi parse JSON từ URL', url, ':', jsonError);
          }
        } else {
          console.log(`Request không thành công với URL ${url}, status: ${response.status}`);
        }
      } catch (fetchError) {
        console.error(`Lỗi khi gửi request đến ${url}:`, fetchError);
      }
    }
    
    if (!responseOk) {
      console.log('Tất cả các request đều thất bại, thử lấy tất cả sản phẩm và lọc ở client');
      // Nếu không có API endpoint nào hoạt động, lấy tất cả sản phẩm và lọc ở client
      const allProducts = await fetchProducts();
      data = allProducts;
    }
    
    // Lọc client-side để đảm bảo
    const filteredData = data.filter(product => {
      // Kiểm tra cả trường category_id và category
      const productCategoryId = product.category_id !== undefined ? parseInt(product.category_id) : parseInt(product.category);
      const selectedCategoryId = parseInt(categoryId);
      const matches = productCategoryId === selectedCategoryId;
      
      console.log(`Client filter - Sản phẩm ${product.product_id} (${product.name}) có category_id=${product.category_id}, category=${product.category}, cần tìm=${selectedCategoryId}, kết quả: ${matches ? 'MATCH' : 'NO MATCH'}`);
      
      return matches;
    });
    
    console.log(`Sau khi lọc client: ${filteredData.length}/${data.length} sản phẩm phù hợp với category ${categoryId}`);
    
    // Lấy tên danh mục nếu chưa có
    try {
      const categoryResponse = await fetch(`${API_URL}/categories/${categoryId}/`);
      let categoryName = "";
      
      if (categoryResponse.ok) {
        const category = await categoryResponse.json();
        categoryName = category.name;
      }
      
      // Thêm category_name vào mỗi sản phẩm nếu chưa có
      const enhancedData = filteredData.map(product => {
        if (product.category_name) {
          return product;
        }
        return {
          ...product,
          category_name: categoryName
        };
      });
      
      return enhancedData;
    } catch (error) {
      console.error('Lỗi khi lấy tên danh mục:', error);
      return filteredData;
    }
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
};

export const fetchProductsBySearchQuery = async (searchQuery) => {
  try {
    console.log(`Đang tìm kiếm sản phẩm với từ khóa: "${searchQuery}"`);
    
    // Đảm bảo searchQuery không phải undefined hoặc null
    const query = searchQuery || '';
    
    // Encode URL đúng cách để đảm bảo các ký tự đặc biệt được xử lý
    const encodedQuery = encodeURIComponent(query.trim());
    
    // Thử gọi API với tham số tìm kiếm
    const url = `${API_URL}/products/?search=${encodedQuery}`;
    
    console.log(`Gửi request đến: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`Request tìm kiếm không thành công, status: ${response.status}`);
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Tìm thấy ${data.length} sản phẩm phù hợp với từ khóa "${searchQuery}"`);
    
    // Xử lý dữ liệu trả về (kiểm tra định dạng array hoặc object có field results)
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data && Array.isArray(data.results)) {
      products = data.results;
    }
    
    // Đảm bảo tất cả sản phẩm tìm kiếm đều có category_name
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        if (product.category_name) {
          return product;
        }
        
        // Lấy thông tin danh mục nếu chưa có
        try {
          const categoryId = product.category_id || product.category;
          const categoryResponse = await fetch(`${API_URL}/categories/${categoryId}/`);
          
          if (categoryResponse.ok) {
            const category = await categoryResponse.json();
            return { ...product, category_name: category.name };
          }
        } catch (error) {
          console.error(`Không thể lấy tên danh mục cho sản phẩm ID ${product.product_id}:`, error);
        }
        
        return product;
      })
    );
    
    return enhancedProducts;
    
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    
    // Nếu API search không hoạt động, lấy tất cả sản phẩm và lọc ở client
    console.log('Thử lấy tất cả sản phẩm và lọc tại client');
    const allProducts = await fetchProducts();
    
    // Phân tách từ khóa tìm kiếm thành các từ riêng biệt
    const searchTerms = (searchQuery || '').toLowerCase().split(/\s+/).filter(term => term.length > 0);
    console.log(`Đã phân tách từ khóa "${searchQuery}" thành các từ:`, searchTerms);

    // Lọc sản phẩm theo từ khóa
    const filteredProducts = allProducts.filter(product => {
      if (!product.name) return false;
      
      // Phân tách tên sản phẩm thành các từ riêng biệt
      const productNameTerms = product.name.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      // Tính điểm tương đồng bằng cách đếm số từ khóa xuất hiện trong tên sản phẩm
      const matchCount = searchTerms.reduce((count, term) => {
        // Kiểm tra xem có từ nào trong tên sản phẩm chứa từ khóa này không
        const hasMatchingTerm = productNameTerms.some(productTerm => 
          productTerm.includes(term) || term.includes(productTerm)
        );
        return hasMatchingTerm ? count + 1 : count;
      }, 0);
      
      // Tính tỷ lệ tương đồng (0-1)
      const matchRatio = searchTerms.length > 0 ? matchCount / searchTerms.length : 0;
      
      // Nếu có ít nhất 1 từ khóa khớp hoặc tên sản phẩm chứa toàn bộ chuỗi tìm kiếm
      const directMatch = product.name.toLowerCase().includes((searchQuery || '').toLowerCase());
      const hasAnyMatch = matchCount > 0;
      
      // Kiểm tra mô tả và thông số kỹ thuật
      const descriptionMatch = product.description && product.description.toLowerCase().includes((searchQuery || '').toLowerCase());
      const specsMatch = product.specification && product.specification.toLowerCase().includes((searchQuery || '').toLowerCase());
      
      return directMatch || hasAnyMatch || descriptionMatch || specsMatch;
    });
    
    // Sắp xếp kết quả theo mức độ tương đồng (từ cao đến thấp)
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      const aNameLower = a.name?.toLowerCase() || '';
      const bNameLower = b.name?.toLowerCase() || '';
      const searchQueryLower = (searchQuery || '').toLowerCase();
      
      // Ưu tiên sản phẩm có tên chứa chính xác cụm từ tìm kiếm
      const aExactMatch = aNameLower.includes(searchQueryLower);
      const bExactMatch = bNameLower.includes(searchQueryLower);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Sau đó ưu tiên theo vị trí xuất hiện của từ khóa trong tên sản phẩm
      const aIndex = aNameLower.indexOf(searchQueryLower);
      const bIndex = bNameLower.indexOf(searchQueryLower);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // Nếu không có cách nào để so sánh, giữ nguyên thứ tự
      return 0;
    });
    
    console.log(`Tìm thấy ${sortedProducts.length} sản phẩm phù hợp với từ khóa "${searchQuery}" (lọc client)`);
    return sortedProducts;
  }
};

export const fetchReviews = async () => {
  try {
    console.log('Đang tải đánh giá sản phẩm từ API');
    const response = await fetch(`${API_URL}/reviews/`);
    
    if (!response.ok) {
      console.error(`API /reviews/ trả về lỗi ${response.status}`);
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the raw data for debugging
    console.log(`Raw reviews data:`, data);
    
    // Process the data to ensure consistency
    const processedData = data.map(review => ({
      ...review,
      product_id: parseInt(review.product_id),
      user_id: parseInt(review.user_id),
      rating: parseInt(review.rating)
    }));
    
    console.log(`Đã tải ${processedData.length} đánh giá sản phẩm`);
    return processedData;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    
    // Fallback to sample data
    console.log('Sử dụng dữ liệu mẫu cho đánh giá');
    return [
      {
        review_id: 1,
        product_id: 1,
        user_id: 1,
        rating: 5,
        comment: "Sản phẩm tuyệt vời, chất lượng hơn mong đợi!",
        created_at: "2023-06-10T15:23:51Z"
      },
      {
        review_id: 2,
        product_id: 1,
        user_id: 2,
        rating: 4,
        comment: "Sản phẩm tốt, giao hàng nhanh.",
        created_at: "2023-06-08T12:13:24Z"
      },
      {
        review_id: 3,
        product_id: 2,
        user_id: 3,
        rating: 5,
        comment: "Chất lượng tuyệt vời, đáng giá từng đồng!",
        created_at: "2023-06-05T09:45:12Z"
      }
    ];
  }
};

// Lấy đánh giá sản phẩm theo product_id
export const fetchReviewsByProductId = async (productId) => {
  try {
    console.log(`Đang tải đánh giá cho sản phẩm ID: ${productId}`);
    const response = await fetch(`${API_URL}/reviews/?product_id=${productId}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Đã tải ${data.length} đánh giá cho sản phẩm ID: ${productId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error);
    
    // Lấy tất cả đánh giá và lọc theo product_id
    try {
      const allReviews = await fetchReviews();
      const filteredReviews = allReviews.filter(review => 
        parseInt(review.product_id) === parseInt(productId)
      );
      console.log(`Đã lọc ${filteredReviews.length} đánh giá cho sản phẩm ID: ${productId}`);
      return filteredReviews;
    } catch (fallbackError) {
      console.error('Cả hai cách lấy đánh giá đều thất bại:', fallbackError);
      return [];
    }
  }
};

export const loginUser = async (loginIdentifier, password) => {
  try {
    console.log("Đang gửi yêu cầu đăng nhập:", loginIdentifier);
    
    // Sử dụng endpoint đăng nhập mới
    const response = await fetch(`${API_URL}/customer/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: loginIdentifier, // Gửi username hoặc email
        password: password 
      }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log("Lỗi đăng nhập, status:", response.status);
      const errorText = await response.text();
      console.log("Response text:", errorText);
      
      let errorMessage = `Lỗi đăng nhập: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || `Lỗi đăng nhập: ${response.status}`;
      } catch (e) {
        console.log("Không thể parse lỗi thành JSON");
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Đăng nhập thành công:", data);
    
    // Lưu token
    if (data.token) {
      localStorage.setItem('userToken', data.token);
    }
    
    // Lưu thông tin người dùng
    localStorage.setItem('user', JSON.stringify({
      user_id: data.user_id,
      username: data.username,
      email: data.email
    }));
    
    // Kích hoạt sự kiện để thông báo đăng nhập thành công
    const loginEvent = new CustomEvent('loginStatusChange', {
      detail: { type: 'LOGIN_SUCCESS', userId: data.user_id }
    });
    window.dispatchEvent(loginEvent);
    
    return data;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    console.log("Đang gửi yêu cầu đăng ký:", userData);
    
    // Sử dụng endpoint đăng ký mới
    const response = await fetch(`${API_URL}/customer/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      console.log("Lỗi đăng ký, status:", response.status);
      const errorText = await response.text();
      console.log("Response text:", errorText);
      
      let errorMessage = `Lỗi đăng ký: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || `Lỗi đăng ký: ${response.status}`;
      } catch (e) {
        console.log("Không thể parse lỗi thành JSON");
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Đăng ký thành công:", data);
    return data;
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    throw error;
  }
};

export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      return { isAuthenticated: false };
    }
    
    // Thử endpoint users/me/
    const response = await fetch(`${API_URL}/users/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      return { isAuthenticated: false };
    }
    
    const data = await response.json();
    return { isAuthenticated: true, user: data };
  } catch (error) {
    console.error('Lỗi kiểm tra xác thực:', error);
    return { isAuthenticated: false };
  }
};

export const logoutUser = async (useBeacon = false) => {
  try {
    const token = localStorage.getItem('userToken');
    
    if (token) {
      // Sử dụng sendBeacon cho trường hợp đóng tab
      if (useBeacon && navigator.sendBeacon) {
        const logoutEndpoint = `${API_URL}/logout/`;
        const data = JSON.stringify({ token });
        const blob = new Blob([data], { type: 'application/json' });
        const success = navigator.sendBeacon(logoutEndpoint, blob);
        
        if (success) {
          console.log('Đã gửi yêu cầu đăng xuất bằng sendBeacon');
        } else {
          console.error('Không thể gửi yêu cầu đăng xuất bằng sendBeacon');
        }
      } else {
        // Phương thức đăng xuất thông thường
        const response = await fetch(`${API_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Lỗi đăng xuất: ${response.status}`);
        }
      }
    }
    
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    
    // Kích hoạt sự kiện để thông báo đăng xuất
    if (!useBeacon) {  // Không kích hoạt sự kiện nếu đang sử dụng sendBeacon (đóng tab)
      const logoutEvent = new CustomEvent('loginStatusChange', {
        detail: { type: 'LOGOUT' }
      });
      window.dispatchEvent(logoutEvent);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    
    // Vẫn kích hoạt sự kiện dù có lỗi
    if (!useBeacon) {
      const logoutEvent = new CustomEvent('loginStatusChange', {
        detail: { type: 'LOGOUT' }
      });
      window.dispatchEvent(logoutEvent);
    }
    
    throw error;
  }
};

// Lấy thông tin chi tiết người dùng
export const getUserProfile = async () => {
  try {
    // Lấy userInfo từ localStorage để có user_id
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!userInfo || !userInfo.user_id) {
      throw new Error('Chưa đăng nhập');
    }

    // Gọi API để lấy thông tin chi tiết người dùng
    const response = await axios.get(`${API_URL}/users/${userInfo.user_id}/`);
    
    if (response.status !== 200) {
      throw new Error(`Lỗi ${response.status}: Không thể lấy thông tin người dùng`);
    }

    // Cập nhật localStorage với thông tin mới nhất
    const userData = response.data;
    localStorage.setItem('user', JSON.stringify({
      ...userInfo,
      username: userData.username,
      email: userData.email,
      phone: userData.phone || '',
      address: userData.address || ''
    }));

    return userData;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    // Thử dùng thông tin từ localStorage khi có lỗi
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.user_id) {
      return user;
    }
    throw error;
  }
};

// Cập nhật thông tin người dùng
export const updateUserProfile = async (userData) => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    // Sử dụng endpoint mới
    const response = await fetch(`${API_URL}/customer/profile/update/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || `Lỗi ${response.status}: Không thể cập nhật thông tin`);
      } catch (e) {
        if (e.message.includes('Unexpected token')) {
          throw new Error(`Lỗi ${response.status}: Máy chủ trả về dữ liệu không hợp lệ`);
        }
        throw e;
      }
    }

    const data = await response.json();
    
    // Cập nhật thông tin trong localStorage
    if (data) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return data;
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin người dùng:', error);
    throw error;
  }
};

// Thay đổi mật khẩu
export const changePassword = async (passwordData) => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    // Sử dụng API endpoint mới
    const response = await fetch(`${API_URL}/customer/change-password/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || `Lỗi ${response.status}: Không thể thay đổi mật khẩu`);
      } catch (e) {
        if (e.message.includes('Unexpected token')) {
          throw new Error(`Lỗi ${response.status}: Máy chủ trả về dữ liệu không hợp lệ`);
        }
        throw e;
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi thay đổi mật khẩu:', error);
    throw error;
  }
};

export const fetchPromotions = async () => {
  try {
    // Get the base URL dynamically to work across different environments
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}/active-promotions/`);
    
    if (!response.ok) {
      console.error(`Error fetching promotions: ${response.status} - ${response.statusText}`);
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log data for debugging
    console.log("Promotions data fetched successfully, count:", data.length);
    
    // Process the data before returning
    const processedData = data.map(item => {
      // Ensure image URLs are properly handled
      if (item.img_banner && typeof item.img_banner === 'string') {
        // Clean up URL to prevent issues
        item.img_banner = item.img_banner.trim();
        
        // Replace spaces in URL if present
        if (item.img_banner.includes(' ')) {
          item.img_banner = item.img_banner.replace(/ /g, '%20');
        }
        
        // Add domain to relative URLs if needed
        if (!item.img_banner.startsWith('http') && !item.img_banner.startsWith('/')) {
          item.img_banner = '/' + item.img_banner;
        }
      } else {
        // Set a default image if none exists
        item.img_banner = '/assets/images/Cyberpunk Aesthetics.png';
      }
      
      return item;
    });
    
    return processedData;
  } catch (error) {
    console.error('Error fetching promotions:', error);
    // Return empty array instead of throwing, to prevent UI breakage
    return [];
  }
};

// Tạo một utility function để lấy baseURL động dựa vào hostname hiện tại
const getBaseUrl = () => {
  return `http://${window.location.hostname}:8000/api`;
};

// Thêm hàm addToCart
export const addToCart = async (productId, userId, quantity = 1) => {
  try {
    const response = await axios.post(`${getBaseUrl()}/cart/add/`, {
      product_id: productId,
      user_id: userId,
      quantity: quantity
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error.response?.data || error.message);
    throw error;
  }
};

// Thêm các API functions cho giỏ hàng
export const getUserCart = async (userId) => {
  try {
    const response = await axios.get(`${getBaseUrl()}/cart/user/${userId}/`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin giỏ hàng:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCartItem = async (cartId, quantity) => {
  try {
    const response = await axios.post(`${getBaseUrl()}/cart/update/${cartId}/`, {
      quantity: quantity
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật giỏ hàng:', error.response?.data || error.message);
    throw error;
  }
};

export const removeCartItem = async (cartId) => {
  try {
    const response = await axios.delete(`${getBaseUrl()}/cart/remove/${cartId}/`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error.response?.data || error.message);
    throw error;
  }
};

export const checkout = async (userId, shippingAddress, paymentMethod) => {
  try {
    const response = await axios.post(`${getBaseUrl()}/cart/checkout/`, {
      user_id: userId,
      shipping_address: shippingAddress,
      payment_method: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery'
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thanh toán giỏ hàng:', error.response?.data || error.message);
    throw error;
  }
};

// Lấy thông tin đơn hàng của người dùng
export const fetchUserOrders = async (userId) => {
  try {
    const response = await axios.get(`${getBaseUrl()}/orders/user/${userId}/`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error.response?.data || error.message);
    throw error;
  }
};

// Hủy đơn hàng đang ở trạng thái "Đang xử lý"
export const cancelOrder = async (orderId, userId) => {
  try {
    const response = await axios.post(`${getBaseUrl()}/orders/cancel/${orderId}/`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi hủy đơn hàng:', error.response?.data || error.message);
    throw error;
  }
};

// Check if a promotion is currently active
export const isPromotionActive = (promotion) => {
  if (!promotion || !promotion.start_date || !promotion.end_date) {
    return false;
  }
  
  const now = new Date();
  const startDate = new Date(promotion.start_date);
  const endDate = new Date(promotion.end_date);
  
  return now >= startDate && now <= endDate;
};

// Fetch promotions for a specific product
export const fetchProductPromotions = async (productId) => {
  try {
    // Try both potential endpoints
    const endpoints = [
      `${API_URL}/product-promotions/${productId}/`,
      `${API_URL}/products/${productId}/promotions/`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const promotions = await response.json();
          return promotions;
        }
      } catch (err) {
        console.log(`Failed to fetch from ${endpoint}:`, err);
      }
    }
    
    // If both endpoints fail, return empty array
    console.log(`No promotions found for product ${productId}`);
    return [];
  } catch (error) {
    console.error('Error fetching product promotions:', error);
    return [];
  }
};

// Calculate discounted price based on promotions
export const getProductDiscountedPrice = async (product) => {
  if (!product || !product.product_id) {
    return null;
  }
  
  try {
    // Get promotions for this product
    const promotions = await fetchProductPromotions(product.product_id);
    
    // Filter active promotions
    const activePromotions = promotions.filter(isPromotionActive);
    
    if (activePromotions.length > 0) {
      // Find the highest discount
      const maxDiscount = Math.max(...activePromotions.map(promo => promo.discount_percentage || 0));
      
      if (maxDiscount > 0) {
        // Calculate discounted price
        const discountAmount = (product.price * maxDiscount) / 100;
        const discountedPrice = product.price - discountAmount;
        
        return {
          originalPrice: product.price,
          discountedPrice: discountedPrice,
          discountPercentage: maxDiscount
        };
      }
    }
    
    // No active promotions or zero discount
    return null;
  } catch (error) {
    console.error('Error calculating discounted price:', error);
    return null;
  }
};

// Lấy thông tin mạng xã hội
export const fetchSocialMediaUrls = async () => {
  try {
    const response = await axios.get(`${API_URL}/social-media/`);
    if (response.status === 200) {
      return response.data;
    } else {
      console.error('Error fetching social media URLs:', response.status);
      // Return default empty object on error
      return {
        facebook: '',
        twitter: '',
        instagram: '',
        discord: '',
        youtube: ''
      };
    }
  } catch (error) {
    console.error('Error fetching social media URLs:', error);
    // Return default empty object on error
    return {
      facebook: '',
      twitter: '',
      instagram: '',
      discord: '',
      youtube: ''
    };
  }
};

// Hàm lấy dữ liệu FAQ từ API
export const fetchFaqs = async () => {
  try {
    const response = await fetch(`${API_URL}/frontend/faqs/`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched FAQs:', data);
    return data;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
};

// Function to fetch privacy policies from the backend
export const fetchPrivacyPolicies = async () => {
  try {
    const response = await fetch(`${API_URL}/privacy/`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched Privacy Policies:', data);
    return data;
  } catch (error) {
    console.error('Error fetching privacy policies:', error);
    return [];
  }
};

// Session management APIs
export const checkUserSession = async () => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      return { status: 'timeout', message: 'No authentication token found' };
    }

    const response = await api.get('/user-session/check/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error checking user session:', error);
    if (error.response && error.response.status === 401) {
      return { status: 'timeout', message: 'Session has timed out' };
    }
    throw error;
  }
};

export const updateUserActivity = async () => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      return { status: 'error', message: 'No authentication token found' };
    }

    const response = await api.post('/user-session/update/', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating user activity:', error);
    if (error.response && error.response.status === 401) {
      return { status: 'timeout', message: 'Session has timed out' };
    }
    throw error;
  }
};

export const fetchCareers = async () => {
  try {
    const response = await api.get('/client/careers/');
    return response.data;
  } catch (error) {
    console.error('Error fetching careers:', error);
    throw error;
  }
};

export const submitCareerApplication = async (jobId, cvLink, applicantName = '', applicantEmail = '') => {
  try {
    const response = await api.post('/client/careers/apply/', {
      job_id: jobId,
      link_cv: cvLink,
      applicant_name: applicantName,
      applicant_email: applicantEmail
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting career application:', error);
    throw error;
  }
};

// Function to subscribe to newsletter
export const subscribeToNewsletter = async (email) => {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email hợp lệ'
      };
    }
    
    // Gửi email đến API để lưu vào bảng newsletter_subscribers
    const response = await api.post('/newsletter/subscribe/', { email });
    
    // Check if the API returned a successful response
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: response.data.message || 'Đăng ký nhận bản tin thành công!'
      };
    }
    
    // If we get here, the API returned an error status code but didn't throw an exception
    return {
      success: false,
      message: response.data?.error || response.data?.message || 'Không thể đăng ký. Vui lòng thử lại sau.'
    };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    
    // Check if the error is from the server (has response)
    if (error.response) {
      // Server responded with an error status
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          'Không thể đăng ký. Vui lòng thử lại sau.';
      
      // Check if this is a duplicate email error
      if (error.response.status === 400 && error.response.data?.error?.includes('đã đăng ký')) {
        return {
          success: false,
          message: 'Email này đã đăng ký nhận bản tin.'
        };
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    // Client-side or network error
    return {
      success: false,
      message: error.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
    };
  }
};

// Fetch products associated with a specific promotion
export const fetchProductsByPromotion = async (promotionId) => {
  try {
    console.log(`Fetching products for promotion ID: ${promotionId}`);
    
    // First try to get the products directly from the API
    const response = await fetch(`${API_URL}/promotions/${promotionId}/products/`);
    
    if (response.ok) {
      let data = await response.json();
      console.log(`Found ${data.length} products for promotion ${promotionId}`);
      
      // Ensure products have all required fields
      data = await Promise.all(data.map(async (product) => {
        // If product is missing images, try to fetch complete product data
        if (!product.images || product.images.length === 0) {
          console.log(`Product ${product.product_id} is missing images, fetching complete data`);
          try {
            const completeProduct = await fetch(`${API_URL}/products/${product.product_id}/`);
            if (completeProduct.ok) {
              const productData = await completeProduct.json();
              console.log(`Got complete data for product ${product.product_id}`);
              return {
                ...productData,
                has_promotion: true,
                discount_percentage: product.discount_percentage || 0,
                discounted_price: product.discounted_price || (productData.price * 0.7) // Fallback discount
              };
            }
          } catch (error) {
            console.error(`Failed to fetch complete data for product ${product.product_id}`, error);
          }
        }
        
        // Ensure product has images array
        if (!product.images) {
          product.images = [];
        }
        
        // Add default name if missing
        if (!product.name) {
          product.name = `Sản phẩm ID: ${product.product_id}`;
        }
        
        return {
          ...product,
          has_promotion: true
        };
      }));
      
      return data;
    } else {
      console.log(`API endpoint not available, falling back to client-side filtering`);
      
      // If the direct endpoint fails, get all promotions and products, then filter
      const allProducts = await fetchProducts();
      const promotions = await fetchPromotions();
      
      // Find the target promotion
      const targetPromotion = promotions.find(p => parseInt(p.promotion_id) === parseInt(promotionId));
      
      if (!targetPromotion) {
        console.log(`Promotion with ID ${promotionId} not found`);
        return [];
      }
      
      console.log(`Found promotion: ${targetPromotion.title} with discount ${targetPromotion.discount_percentage}%`);
      
      // Get products with discounted prices
      const productsWithPromotions = await Promise.all(
        allProducts.map(async (product) => {
          try {
            const promotionInfo = await getProductDiscountedPrice(product);
            if (promotionInfo) {
              console.log(`Product ${product.product_id} (${product.name}) has discount: ${promotionInfo.discountPercentage}%`);
              return {
                ...product,
                has_promotion: true,
                discounted_price: promotionInfo.discountedPrice,
                discount_percentage: promotionInfo.discountPercentage
              };
            }
            return { ...product, has_promotion: false };
          } catch (err) {
            console.error(`Error getting promotions for product ${product.product_id}:`, err);
            return { ...product, has_promotion: false };
          }
        })
      );
      
      // Filter products that have a promotion and match the requested promotion discount
      const filteredProducts = productsWithPromotions.filter(product => {
        const hasPromotion = product.has_promotion === true;
        const matchesDiscount = targetPromotion.discount_percentage && 
                               parseInt(product.discount_percentage) === parseInt(targetPromotion.discount_percentage);
        
        // Log each product's filtering decision
        if (hasPromotion) {
          console.log(`Product ${product.product_id} (${product.name}): has promotion=${hasPromotion}, discount match=${matchesDiscount}, product discount=${product.discount_percentage}%, promo discount=${targetPromotion.discount_percentage}%`);
        }
        
        return hasPromotion && matchesDiscount;
      });
      
      console.log(`Found ${filteredProducts.length} products with matching discount percentage`);
      
      // Verify all filtered products have required fields
      filteredProducts.forEach(product => {
        console.log(`Filtered product ${product.product_id}: name=${product.name}, has images=${product.images && product.images.length > 0}`);
      });
      
      return filteredProducts;
    }
  } catch (error) {
    console.error('Error fetching products by promotion:', error);
    return [];
  }
};

// Fetch blog posts
export const fetchBlogs = async () => {
  try {
    const response = await api.get('/blogs/');
    return response.data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

// Create a new blog post
export const createBlog = async (blogData) => {
  try {
    const response = await api.post('/blogs/', blogData);
    return response.data;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

// Upload blog image
export const uploadBlogImage = async (formData) => {
  try {
    const response = await api.post('/blog-images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading blog image:', error);
    throw error;
  }
};

export default api;