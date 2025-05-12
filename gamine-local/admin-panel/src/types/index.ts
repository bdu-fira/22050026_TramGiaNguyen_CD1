// Kiểu dữ liệu cho Admin
export interface Admin {
    admin_id: number;
    username: string;
    email: string;
    role: string;
    created_at: string;
}

// Kiểu dữ liệu cho đăng nhập
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    admin: Admin;
}

// Kiểu dữ liệu cho Permission
export interface Permission {
    permission_id: number;
    admin: number;
    table_name: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
}

// Kiểu dữ liệu cho AuditLog
export interface AuditLog {
    log_id: number;
    admin: number;
    admin_username: string;
    action: string;
    table_name: string | null;
    record_id: number | null;
    created_at: string;
}

// Kiểu dữ liệu cho User
export interface User {
    user_id: number;
    username: string;
    email: string;
    phone: string | null;
    address: string | null;
    created_at: string;
}

// Kiểu dữ liệu cho Category
export interface CategoryImage {
    image_id: number;
    image_url: string;
    is_primary: boolean;
}

export interface Category {
    category_id: number;
    name: string;
    description: string | null;
    img_url: string | null;
    images: CategoryImage[];
}

// Kiểu dữ liệu cho Product
export interface ProductImage {
    image_id: number;
    image_url: string;
    is_primary: boolean;
}

export interface ProductDetail {
    product_detail_id: number;
    specification: string | null;
}

export interface Product {
    product_id: number;
    name: string;
    description: string;
    price: number;
    discounted_price?: number;
    discount_percentage?: number;
    has_active_promotion?: boolean;
    stock_quantity: number;
    sold_quantity: number;
    category: number;
    category_name?: string;
    created_at: string;
    images: ProductImage[];
    detail?: ProductDetail;
}

// Kiểu dữ liệu cho Promotion
export interface Promotion {
    promotion_id: number;
    title: string;
    description: string | null;
    discount_percentage: number;
    start_date: string;
    end_date: string;
    img_banner: string | null;
}

// Kiểu dữ liệu cho ProductPromotion
export interface ProductPromotion {
    product_promotion_id: number;
    product: number | null;
    category: number | null;
    promotion: number;
    product_name: string | null;
    category_name: string | null;
    promotion_title: string;
}

// Kiểu dữ liệu cho Review
export interface Review {
    review_id: number;
    product: number;
    user: number;
    username: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

// Kiểu dữ liệu cho Order
export interface OrderDetail {
    order_detail_id: number;
    product: number;
    product_name: string;
    quantity: number;
    price: number;
    discounted_price?: number;
}

export interface Order {
    order_id: number;
    user: number | null;
    username: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    shipping_address: string | null;
    total_amount: number;
    order_status: 'Pending' | 'Processing' | 'In transit' | 'Completed';
    payment_method?: string;
    payment_status?: string;
    created_at: string;
    details: OrderDetail[];
}

// Kiểu dữ liệu cho Blog
export interface BlogImage {
    image_id: number;
    image_url: string;
    is_primary: boolean;
}

export interface Blog {
    blog_id: number;
    title: string;
    content: string;
    created_at: string;
    images: BlogImage[];
}

// Kiểu dữ liệu cho FAQ
export interface FAQ {
    faq_id: number;
    question: string;
    answer: string;
}

// Kiểu dữ liệu cho Contact
export interface Contact {
    contact_id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string | null;
    created_at: string;
}

// Kiểu dữ liệu cho Career
export interface Career {
    job_id: number;
    title: string;
    description: string;
    requirements: string | null;
    created_at: string;
    link_cv: string | null;
}

// Kiểu dữ liệu cho CareerApplication
export interface CareerApplication {
    application_id: number;
    career: number;
    applicant_name: string | null;
    applicant_email: string | null;
    cv_link: string;
    created_at: string;
}

// Kiểu dữ liệu cho Terms & Conditions và Privacy Policy
export interface TermsAndConditions {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export interface PrivacyPolicy {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

// Kiểu dữ liệu cho Dashboard Stats
export interface DashboardStats {
    total_users: number;
    new_users_count: number;
    total_products: number;
    total_orders: number;
    total_revenue: number;
    top_products: Product[];
    order_status_counts: {
        order_status: string;
        count: number;
    }[];
    monthly_revenue: {
        month: string;
        revenue: number;
    }[];
}

// Kiểu dữ liệu cho thanh toán
export interface Payment {
    payment_id: number;
    order: number;
    payment_method: string;
    payment_status: string;
    transaction_id: string | null;
    created_at: string;
}

// Kiểu dữ liệu cho URLs Mạng Xã Hội
export interface SocialMediaUrls {
    id: number;
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    discord: string | null;
    youtube: string | null;
    updated_at: string;
}