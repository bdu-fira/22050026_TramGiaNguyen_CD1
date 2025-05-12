import axios, { AxiosError, AxiosResponse } from 'axios';
import { 
    LoginRequest, Admin, Permission, User, Category, Product, 
    Promotion, Order, Blog, FAQ, Contact, Career, 
    TermsAndConditions, PrivacyPolicy, DashboardStats, AuditLog, Payment,
    SocialMediaUrls, CareerApplication
} from '../types';

// Tạo instance của axios
const API = axios.create({
    baseURL: window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : `http://${window.location.hostname}:8000/api`,
    withCredentials: false, // Không gửi cookies với request
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

// Thêm interceptor để thêm token vào header
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Thêm interceptor để xử lý các lỗi response
API.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        // Không tự động xóa token khi có lỗi 401
        // Việc xử lý xác thực sẽ do AuthContext đảm nhiệm
        return Promise.reject(error);
    }
);

// Authentication API
export const login = (credentials: LoginRequest) => API.post('/login/', credentials);
export const checkAuth = () => API.get('/admins/me/');

// Dashboard API
export const getDashboardStats = () => API.get<DashboardStats>('/dashboard/');

// Admin API
export const getAdmins = () => API.get<Admin[]>('/admins/');
export const getAdmin = (id: number) => API.get<Admin>(`/admins/${id}/`);
export const createAdmin = (admin: Partial<Admin> & { password: string }) => API.post('/admins/', admin);
export const updateAdmin = (id: number, admin: Partial<Admin> & { password?: string }) => API.put(`/admins/${id}/`, admin);
export const deleteAdmin = (id: number) => API.delete(`/admins/${id}/`);

// Permission API
export const getPermissions = () => API.get<Permission[]>('/permissions/');
export const getPermission = (id: number) => API.get<Permission>(`/permissions/${id}/`);
export const createPermission = (permission: Partial<Permission>) => API.post('/permissions/', permission);
export const updatePermission = (id: number, permission: Partial<Permission>) => API.put(`/permissions/${id}/`, permission);
export const deletePermission = (id: number) => API.delete(`/permissions/${id}/`);

// AuditLog API
export const getAuditLogs = () => API.get<AuditLog[]>('/audit-logs/');

// User API
export const getUsers = () => API.get<User[]>('/users/');
export const getUser = (id: number) => API.get<User>(`/users/${id}/`);
export const createUser = (user: Partial<User> & { password: string }) => API.post('/users/', user);
export const updateUser = (id: number, user: Partial<User> & { password?: string }) => API.put(`/users/${id}/`, user);
export const deleteUser = (id: number) => API.delete(`/users/${id}/`);

// Category API
export const getCategories = () => API.get<Category[]>('/categories/');
export const getCategory = (id: number) => API.get<Category>(`/categories/${id}/`);
export const createCategory = (category: Partial<Category>) => API.post('/categories/', category);
export const updateCategory = (id: number, category: Partial<Category>) => API.put(`/categories/${id}/`, category);
export const deleteCategory = (id: number) => API.delete(`/categories/${id}/`);

// Product API
export const getProducts = (offset = 0, limit = 1000) => API.get<Product[]>(`/products/?offset=${offset}&limit=${limit}`);
export const getProduct = (id: number) => API.get<Product>(`/products/${id}/`);
export const createProduct = (product: any) => API.post('/products/', product);
export const updateProduct = (id: number, product: any) => API.put(`/products/${id}/`, product);
export const deleteProduct = (id: number) => API.delete(`/products/${id}/`);

// Promotion API
export const getPromotions = () => API.get<Promotion[]>('/promotions/');
export const getPromotion = (id: number) => API.get<Promotion>(`/promotions/${id}/`);
export const createPromotion = (promotion: any) => API.post('/promotions/', promotion);
export const updatePromotion = (id: number, promotion: any) => API.put(`/promotions/${id}/`, promotion);
export const deletePromotion = (id: number) => API.delete(`/promotions/${id}/`);
export const getProductPromotions = (productId: number) => API.get<Promotion[]>(`/products/${productId}/promotions/`);
export const getCategoryPromotions = (categoryId: number) => API.get<Promotion[]>(`/categories/${categoryId}/promotions/`);

// Order API
export const getOrders = () => API.get<Order[]>('/orders/');
export const getOrder = (id: number) => API.get<Order>(`/orders/${id}/`);
export const createOrder = (order: any) => API.post('/orders/', order);
export const updateOrder = (id: number, order: Partial<Order>) => API.put(`/orders/${id}/`, order);
export const deleteOrder = (id: number) => API.delete(`/orders/${id}/`);

// Blog API
export const getBlogs = () => API.get<Blog[]>('/blogs/');
export const getBlog = (id: number) => API.get<Blog>(`/blogs/${id}/`);
export const createBlog = (blog: any) => API.post('/blogs/', blog);
export const updateBlog = (id: number, blog: any) => API.put(`/blogs/${id}/`, blog);
export const deleteBlog = (id: number) => API.delete(`/blogs/${id}/`);

// FAQ API
export const getFaqs = () => API.get<FAQ[]>('/faqs/');
export const getFaq = (id: number) => API.get<FAQ>(`/faqs/${id}/`);
export const createFaq = (faq: Partial<FAQ>) => API.post('/faqs/', faq);
export const updateFaq = (id: number, faq: Partial<FAQ>) => API.put(`/faqs/${id}/`, faq);
export const deleteFaq = (id: number) => API.delete(`/faqs/${id}/`);

// Contact API
export const getContacts = () => API.get<Contact[]>('/contacts/');
export const getContact = (id: number) => API.get<Contact>(`/contacts/${id}/`);
export const deleteContact = (id: number) => API.delete(`/contacts/${id}/`);

// Career API
export const getCareers = () => API.get<Career[]>('/careers/');
export const getCareerById = (id: number) => API.get<Career>(`/careers/${id}/`);
export const createCareer = (data: any) => API.post<Career>('/careers/', data);
export const updateCareer = (id: number, data: any) => API.put<Career>(`/careers/${id}/`, data);
export const deleteCareer = (id: number) => API.delete(`/careers/${id}/`);
export const getCareerApplications = (jobId: number) => API.get<CareerApplication[]>(`/client/careers/${jobId}/applications/`);

// Terms & Conditions API
export const getTerms = () => API.get<TermsAndConditions[]>('/terms/');
export const getTerm = (id: number) => API.get<TermsAndConditions>(`/terms/${id}/`);
export const createTerm = (term: Partial<TermsAndConditions>) => API.post('/terms/', term);
export const updateTerm = (id: number, term: Partial<TermsAndConditions>) => API.put(`/terms/${id}/`, term);
export const deleteTerm = (id: number) => API.delete(`/terms/${id}/`);

// Privacy Policy API
export const getPolicies = () => API.get<PrivacyPolicy[]>('/privacy/');
export const getPolicy = (id: number) => API.get<PrivacyPolicy>(`/privacy/${id}/`);
export const createPolicy = (policy: Partial<PrivacyPolicy>) => API.post('/privacy/', policy);
export const updatePolicy = (id: number, policy: Partial<PrivacyPolicy>) => API.put(`/privacy/${id}/`, policy);
export const deletePolicy = (id: number) => API.delete(`/privacy/${id}/`);

// Payment API
export const getPayments = () => API.get<Payment[]>('/payments/');
export const getPayment = (id: number) => API.get<Payment>(`/payments/${id}/`);
export const createPayment = (payment: Partial<Payment>) => API.post('/payments/', payment);
export const updatePayment = (id: number, payment: Partial<Payment>) => API.put(`/payments/${id}/`, payment);
export const deletePayment = (id: number) => API.delete(`/payments/${id}/`);
export const getOrderPayment = (orderId: number) => API.get<Payment>(`/orders/${orderId}/payment/`);

// Inventory API
export const updateProductInventory = (productId: number, quantity: number) => 
  API.post(`/products/${productId}/update-inventory/`, { quantity });

// Lấy danh sách sản phẩm đã áp dụng cho một khuyến mãi
export const getPromotionProducts = (promotionId: number) => {
  return API.get(`/promotions/${promotionId}/products/`);
};

// Lấy danh sách danh mục đã áp dụng cho một khuyến mãi
export const getPromotionCategories = (promotionId: number) => {
  return API.get(`/promotions/${promotionId}/categories/`);
};

// Blog Category API
export const getBlogCategories = () => API.get<Category[]>('/blog-categories/');
export const getBlogCategory = (id: number) => API.get<Category>(`/blog-categories/${id}/`);
export const createBlogCategory = (category: Partial<Category>) => API.post('/blog-categories/', category);
export const updateBlogCategory = (id: number, category: Partial<Category>) => API.put(`/blog-categories/${id}/`, category);
export const deleteBlogCategory = (id: number) => API.delete(`/blog-categories/${id}/`);

// Tạo một utility function để kiểm tra khuyến mãi có đang active không
export const isPromotionActive = (promotion: any) => {
  const now = new Date();
  const startDate = new Date(promotion.start_date);
  const endDate = new Date(promotion.end_date);
  
  return now >= startDate && now <= endDate;
};

// API để lấy giá khuyến mãi của sản phẩm
export const getProductDiscountedPrice = async (productId: number) => {
  try {
    // Lấy thông tin khuyến mãi áp dụng trực tiếp cho sản phẩm
    const productPromotionResponse = await API.get(`/product-promotions/${productId}/`);
    
    if (productPromotionResponse.data && Array.isArray(productPromotionResponse.data)) {
      // Lọc ra các khuyến mãi đang active
      const activePromotions = productPromotionResponse.data.filter(promo => isPromotionActive(promo));
      
      if (activePromotions.length > 0) {
        // Tìm khuyến mãi có discount cao nhất
        const maxDiscount = Math.max(...activePromotions.map(promo => promo.discount_percentage));
        return maxDiscount; // Trả về phần trăm giảm giá
      }
    }
    
    return 0; // Không có khuyến mãi
  } catch (error) {
    console.error('Lỗi khi lấy giá khuyến mãi:', error);
    return 0;
  }
};

// Social Media URLs API
export const getSocialMediaUrls = () => API.get<SocialMediaUrls>('/social-media/');
export const updateSocialMediaUrls = (urls: Partial<SocialMediaUrls>) => API.put('/social-media/1/', urls);

// Newsletter Subscribers API
export const getNewsletterSubscribers = () => API.get('/newsletter-subscribers/');