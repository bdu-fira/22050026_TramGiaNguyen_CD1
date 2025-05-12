from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from . import views
from django.views.decorators.csrf import csrf_exempt
from rest_framework.viewsets import ViewSetMixin
from core.views import client_terms_conditions

# Đăng ký router với csrf_exempt
router = DefaultRouter()
# Đặt csrf_exempt cho tất cả các viewsets
router.register(r'admins', views.AdminViewSet)
router.register(r'permissions', views.PermissionsViewSet)
router.register(r'audit-logs', views.AuditLogViewSet)
router.register(r'users', views.UsersViewSet)
router.register(r'categories', views.CategoriesViewSet)
router.register(r'products', views.ProductsViewSet)
router.register(r'promotions', views.PromotionsViewSet)
router.register(r'orders', views.OrdersViewSet)
router.register(r'blogs', views.BlogViewSet)
router.register(r'faqs', views.FaqViewSet)
router.register(r'contacts', views.ContactViewSet)
router.register(r'careers', views.CareersViewSet)
router.register(r'terms', views.TermsAndConditionsViewSet)
router.register(r'privacy', views.PrivacyPolicyViewSet)
router.register(r'social-media', views.SocialMediaUrlsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', csrf_exempt(views.admin_login), name='admin_login'),
    path('dashboard/', csrf_exempt(views.dashboard_stats), name='dashboard_stats'),
    path('admins/me/', csrf_exempt(views.current_admin), name='current_admin'),
    path('products/<int:product_id>/promotions/', csrf_exempt(views.product_promotions), name='product_promotions'),
    path('products/<int:product_id>/price/', csrf_exempt(views.product_price), name='product_price'),
    path('products/<int:product_id>/update-inventory/', csrf_exempt(views.update_product_inventory), name='update_product_inventory'),
    path('categories/<int:category_id>/promotions/', csrf_exempt(views.category_promotions), name='category_promotions'),
    path('active-promotions/', csrf_exempt(views.active_promotions), name='active_promotions'),
    
    # Newsletter subscribers list endpoint
    path('newsletter-subscribers/', csrf_exempt(views.newsletter_subscribers_list), name='newsletter_subscribers_list'),
    
    # Thêm URL để lấy danh sách sản phẩm và danh mục của một khuyến mãi
    path('promotions/<int:promotion_id>/products/', csrf_exempt(views.promotion_products), name='promotion_products'),
    path('promotions/<int:promotion_id>/categories/', csrf_exempt(views.promotion_categories), name='promotion_categories'),
    
    # API endpoint cho trang khuyến mãi trên frontend
    path('frontend/promotions/', csrf_exempt(views.promotions_frontend), name='promotions_frontend'),
    # API endpoint mới cho trang khuyến mãi của client
    path('client/promotions/', csrf_exempt(views.promotions_client), name='promotions_client'),
    
    # API endpoint cho trang blog trên frontend
    path('frontend/blogs/', csrf_exempt(views.blogs_frontend), name='blogs_frontend'),
    
    # API endpoint cho trang FAQ (Câu hỏi thường gặp) trên frontend
    path('frontend/faqs/', csrf_exempt(views.faqs_frontend), name='faqs_frontend'),
    
    # API đăng nhập/đăng ký người dùng
    path('customer/login/', views.user_login, name='user-login'),
    path('customer/register/', views.user_register, name='user-register'),
    path('customer/profile/update/', views.update_user_profile, name='update-user-profile'),
    path('customer/profile/', views.user_profile, name='user-profile'),
    path('customer/change-password/', views.user_change_password, name='user-change-password'),
    
    # Thêm endpoint đăng xuất (logout)
    path('logout/', csrf_exempt(views.user_logout), name='user-logout'),
    
    # API cho đơn hàng của người dùng
    path('orders/user/<int:user_id>/', csrf_exempt(views.get_user_orders), name='get-user-orders'),
    
    # API hủy đơn hàng
    path('orders/cancel/<int:order_id>/', csrf_exempt(views.cancel_order), name='cancel-order'),
    
    # API cho giỏ hàng
    path('cart/add/', csrf_exempt(views.add_to_cart), name='add-to-cart'),
    
    # API endpoints mới cho giỏ hàng
    path('cart/user/<int:user_id>/', csrf_exempt(views.get_user_cart), name='get-user-cart'),
    path('cart/update/<int:cart_id>/', csrf_exempt(views.update_cart_item), name='update-cart-item'),
    path('cart/remove/<int:cart_id>/', csrf_exempt(views.remove_cart_item), name='remove-cart-item'),
    path('cart/checkout/', csrf_exempt(views.create_order_from_cart), name='create-order-from-cart'),
    
    # API endpoints cho đánh giá sản phẩm
    path('reviews/add/', csrf_exempt(views.add_review), name='add-review'),
    path('reviews/product/<int:product_id>/', csrf_exempt(views.get_product_reviews), name='get-product-reviews'),
    
    # Thêm URL path cho client APIs
    path('client/terms-conditions/', csrf_exempt(client_terms_conditions), name='client_terms_conditions'),
    
    # API endpoint lấy chi tiết sản phẩm theo product_id
    path('product-details/<int:product_id>/', csrf_exempt(views.get_product_details), name='get_product_details'),
    path('admin-session/update/', views.update_admin_activity, name='update_admin_activity'),
    path('admin-session/check/', views.check_session_status, name='check_session_status'),
    
    # User session management
    path('user-session/update/', views.update_user_activity, name='update_user_activity'),
    path('user-session/check/', views.check_user_session, name='check_user_session'),
    path('user-activity/track/', csrf_exempt(views.track_user_activity), name='track_user_activity'),
    
    # API endpoint mới cho trang tuyển dụng của client
    path('client/careers/', csrf_exempt(views.careers_client), name='careers_client'),
    path('client/careers/apply/', csrf_exempt(views.career_apply), name='career_apply'),
    path('client/careers/<int:job_id>/applications/', csrf_exempt(views.get_career_applications), name='get_career_applications'),
    path('newsletter/subscribe/', views.subscribe_newsletter, name='subscribe_newsletter'),
] 