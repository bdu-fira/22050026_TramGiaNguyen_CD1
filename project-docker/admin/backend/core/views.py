from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login
from django.db.models import Sum, Count, F, Case, When
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from .models import (
    Admin, Permissions, AuditLog, Users, UserActivityLog, Categories, CategoryImages,
    Products, ProductImages, ProductDetails, Promotions, ProductPromotions, 
    Reviews, Orders, OrderDetails, Cart, Payments, Blog, BlogImages, 
    Careers, Contact, Faq, TermsAndConditions, PrivacyPolicy, SocialMediaUrls,
    CareerApplications, NewsletterSubscribers
)
from .serializers import (
    AdminSerializer, AdminCreateSerializer, PermissionsSerializer, AuditLogSerializer,
    UsersSerializer, UserCreateSerializer, CategoriesSerializer, ProductsSerializer, 
    ProductCreateSerializer, PromotionsSerializer, ProductPromotionsSerializer, 
    ReviewsSerializer, OrdersSerializer, OrderCreateSerializer, CartSerializer, CartDetailSerializer,
    PaymentsSerializer, BlogSerializer, CareersSerializer, ContactSerializer, 
    FaqSerializer, TermsAndConditionsSerializer, PrivacyPolicySerializer, SocialMediaUrlsSerializer,
    CareerApplicationsSerializer, NewsletterSubscriberSerializer
)
from .permissions import IsAdminOrSelf
import jwt as pyjwt
import datetime
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from django.contrib.auth.hashers import make_password, check_password
from decimal import Decimal
import json
import time
import redis

# Define Redis connection for session storage
# Will be initialized by getattr and fallback to None if Redis is not available
redis_client = getattr(settings, 'REDIS_CLIENT', None)
if not redis_client:
    try:
        redis_client = redis.Redis(host='localhost', port=6379, db=0)
        # Test connection
        redis_client.ping()
    except:
        # If Redis is not available, we'll use in-memory storage
        redis_client = None
        print("Warning: Redis not available, using in-memory session storage (not suitable for production)")

# In-memory session storage as fallback
session_store = {}

# Session timeout in seconds (5 minutes)
SESSION_TIMEOUT = 5 * 60

# Function to store session data
def set_session_data(key, value):
    if redis_client:
        redis_client.set(key, json.dumps(value))
        redis_client.expire(key, SESSION_TIMEOUT)
    else:
        session_store[key] = value

# Function to get session data
def get_session_data(key):
    if redis_client:
        data = redis_client.get(key)
        return json.loads(data) if data else None
    else:
        return session_store.get(key)

# Function to delete session data
def delete_session_data(key):
    if redis_client:
        redis_client.delete(key)
    elif key in session_store:
        del session_store[key]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_admin_activity(request):
    """
    Endpoint to update admin's last activity timestamp
    """
    admin = request.user
    if not hasattr(admin, 'admin_id'):
        return Response({'error': 'Invalid admin account'}, status=status.HTTP_401_UNAUTHORIZED)
    
    current_time = int(time.time())
    session_key = f"admin_session_{admin.admin_id}"
    
    # Get the current session data
    session_data = get_session_data(session_key)
    
    # Check if session has already timed out
    if session_data:
        last_active = session_data.get('last_active', 0)
        time_since_last_activity = current_time - last_active
        
        if time_since_last_activity > SESSION_TIMEOUT:
            # Session has already expired
            delete_session_data(session_key)
            return Response({'status': 'timeout', 'message': 'Session has timed out'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Save the current timestamp
    set_session_data(session_key, {'last_active': current_time})
    
    return Response({'status': 'ok', 'last_active': current_time})

@api_view(['GET'])
@permission_classes([AllowAny])
def check_user_session(request):
    """
    Endpoint to check if user session is still active
    """
    user = request.user
    if not hasattr(user, 'user_id'):
        return Response({'status': 'timeout'}, status=status.HTTP_401_UNAUTHORIZED)
    
    current_time = int(time.time())
    session_key = f"user_session_{user.user_id}"
    
    # Get the last activity timestamp
    session_data = get_session_data(session_key)
    
    if not session_data:
        # First time checking, initialize the session
        set_session_data(session_key, {'last_active': current_time})
        return Response({'status': 'active', 'last_active': current_time})
    
    last_active = session_data.get('last_active', 0)
    time_since_last_activity = current_time - last_active
    
    # Check if session has timed out
    if time_since_last_activity > SESSION_TIMEOUT:
        delete_session_data(session_key)
        return Response({
            'status': 'timeout', 
            'message': 'Session has timed out',
            'time_since_activity': time_since_last_activity,
            'timeout_limit': SESSION_TIMEOUT
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Update the last activity timestamp
    set_session_data(session_key, {'last_active': current_time})
    
    return Response({
        'status': 'active', 
        'last_active': current_time,
        'time_elapsed': time_since_last_activity,
        'session_timeout': SESSION_TIMEOUT,
        'time_remaining': SESSION_TIMEOUT - time_since_last_activity
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_session_status(request):
    """
    Endpoint to check if admin session is still active
    """
    admin = request.user
    if not hasattr(admin, 'admin_id'):
        return Response({'status': 'timeout'}, status=status.HTTP_401_UNAUTHORIZED)
    
    current_time = int(time.time())
    session_key = f"admin_session_{admin.admin_id}"
    
    # Get the last activity timestamp
    session_data = get_session_data(session_key)
    
    if not session_data:
        # First time checking, initialize the session
        set_session_data(session_key, {'last_active': current_time})
        return Response({'status': 'active', 'last_active': current_time})
    
    last_active = session_data.get('last_active', 0)
    time_since_last_activity = current_time - last_active
    
    # Check if session has timed out
    if time_since_last_activity > SESSION_TIMEOUT:
        delete_session_data(session_key)
        return Response({
            'status': 'timeout', 
            'message': 'Session has timed out',
            'time_since_activity': time_since_last_activity,
            'timeout_limit': SESSION_TIMEOUT
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Update the last activity timestamp
    set_session_data(session_key, {'last_active': current_time})
    
    return Response({
        'status': 'active', 
        'last_active': current_time,
        'time_elapsed': time_since_last_activity,
        'session_timeout': SESSION_TIMEOUT,
        'time_remaining': SESSION_TIMEOUT - time_since_last_activity
    })

# Authentication views
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Đang đăng nhập với username: {username}")
    
    if not username or not password:
        print("Thiếu username hoặc password")
        return Response({'error': 'Vui lòng cung cấp tên đăng nhập và mật khẩu'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Kiểm tra xem username/email có tồn tại không
        try:
            admin = Admin.objects.get(Q(username=username) | Q(email=username))
            print(f"Tìm thấy admin: {admin.username}, ID: {admin.admin_id}")
        except Admin.DoesNotExist:
            print(f"Không tìm thấy admin với username/email: {username}")
            return Response({'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Kiểm tra mật khẩu
        if not admin.check_password(password):
            print(f"Mật khẩu không đúng cho admin: {admin.username}")
            return Response({'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Kiểm tra tài khoản có active không
        if not admin.is_active:
            print(f"Tài khoản admin {admin.username} không active")
            return Response({'error': 'Tài khoản đã bị vô hiệu hóa'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Xác thực thành công, tạo token
        admin = authenticate(request, username=username, password=password)
        
        if not admin:
            print(f"Xác thực thất bại cho {username} mặc dù đã kiểm tra mật khẩu")
            return Response({'error': 'Đăng nhập thất bại'}, status=status.HTTP_401_UNAUTHORIZED)
        
        print(f"Xác thực thành công cho admin: {admin.username}")
        
        # Tạo JWT token
        payload = {
            'admin_id': admin.admin_id,
            'username': admin.username,
            'email': admin.email,
            'role': admin.role,
            'is_active': admin.is_active,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=365)  # Hạn dùng 1 năm
        }
        
        token = pyjwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        print(f"Đã tạo token cho admin: {admin.username}")
        
        # Ghi log đăng nhập
        AuditLog.objects.create(
            admin=admin,
            action='Đăng nhập',
            table_name='Admin'
        )
        
        return Response({
            'token': token,
            'admin': {
                'admin_id': admin.admin_id,
                'username': admin.username,
                'email': admin.email,
                'role': admin.role
            }
        })
    except Exception as e:
        print(f"Lỗi không xác định khi đăng nhập: {str(e)}")
        return Response({'error': f'Lỗi đăng nhập: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Endpoint để kiểm tra thông tin admin hiện tại
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def current_admin(request):
    admin = request.user
    return Response({
        'admin_id': admin.admin_id,
        'username': admin.username,
        'email': admin.email,
        'role': admin.role,
        'is_active': admin.is_active
    })

# AdminViewSet
@method_decorator(csrf_exempt, name='dispatch')
class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        # Tạm thời trả về [] để bỏ qua kiểm tra quyền
        return []
    
    def get_queryset(self):
        # Debug output
        print(f"User: {self.request.user}")
        print(f"User authenticated: {self.request.user.is_authenticated if hasattr(self.request.user, 'is_authenticated') else 'Unknown'}")
        
        # Tạm thời cho phép xem tất cả
        return Admin.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminCreateSerializer
        return AdminSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo Admin mới',
            table_name='Admin',
            record_id=admin.admin_id
        )
        
        return Response(AdminSerializer(admin).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log thông tin debug
        print(f"Cập nhật user ID: {instance.admin_id}")
        print(f"Data nhận được: {request.data}")
        
        # Đảm bảo các trường có thể null
        data = request.data.copy()
        if 'phone' in data and data['phone'] == '':
            data['phone'] = None
        if 'address' in data and data['address'] == '':
            data['address'] = None
            
        try:
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            admin = serializer.save()
            
            # Ghi log
            AuditLog.objects.create(
                admin_id=request.user.admin_id,
                action='Cập nhật Admin',
                table_name='Admin',
                record_id=admin.admin_id
            )
            
            return Response(AdminSerializer(admin).data)
        except Exception as e:
            # Log lỗi chi tiết
            print(f"Lỗi khi cập nhật admin: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.admin_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa Admin',
            table_name='Admin',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# PermissionsViewSet
@method_decorator(csrf_exempt, name='dispatch')
class PermissionsViewSet(viewsets.ModelViewSet):
    queryset = Permissions.objects.all()
    serializer_class = PermissionsSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        permission = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo quyền mới',
            table_name='Permissions',
            record_id=permission.permission_id
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        permission = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật quyền',
            table_name='Permissions',
            record_id=permission.permission_id
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.permission_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa quyền',
            table_name='Permissions',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# AuditLogViewSet
@method_decorator(csrf_exempt, name='dispatch')
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [AllowAny]

# Dashboard view
@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    try:
        # Số lượng người dùng
        total_users_count = Users.objects.count()
        
        # Số lượng người dùng mới trong 30 ngày qua
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_users_count = Users.objects.filter(created_at__gte=thirty_days_ago).count()
        
        # Tổng số sản phẩm
        total_products = Products.objects.count()
        
        # Tổng số đơn hàng và doanh thu
        total_orders = Orders.objects.count()
        # Chuyển về 0 nếu không có doanh thu
        revenue_data = Orders.objects.filter(order_status='Completed').aggregate(revenue=Sum('total_amount'))
        total_revenue = revenue_data['revenue'] if revenue_data['revenue'] else 0
        
        # Sản phẩm bán chạy nhất
        top_products = Products.objects.order_by('-sold_quantity')[:5]
        top_products_data = ProductsSerializer(top_products, many=True).data
        
        # Đơn hàng theo trạng thái
        order_status_counts = Orders.objects.values('order_status').annotate(count=Count('order_id'))
        
        # Doanh thu theo tháng trong năm hiện tại
        current_year = timezone.now().year
        monthly_revenue = []
        
        # Dữ liệu theo từng tháng trong năm
        for month in range(1, 13):
            month_revenue = Orders.objects.filter(
                created_at__year=current_year,
                created_at__month=month,
                order_status='Completed'
            ).aggregate(revenue=Sum('total_amount'))
            
            monthly_revenue.append({
                'month': f'{month}/{current_year}',
                'revenue': month_revenue['revenue'] if month_revenue['revenue'] else 0
            })
        
        return Response({
            'total_users': total_users_count,
            'new_users_count': new_users_count,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'top_products': top_products_data,
            'order_status_counts': order_status_counts,
            'monthly_revenue': monthly_revenue
        })
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu dashboard: {str(e)}")
        return Response(
            {'error': f'Không thể lấy dữ liệu dashboard: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# UsersViewSet
@method_decorator(csrf_exempt, name='dispatch')
class UsersViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UsersSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateSerializer
        return UsersSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo người dùng mới',
            table_name='Users',
            record_id=user.user_id
        )
        
        return Response(UsersSerializer(user).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log thông tin debug
        print(f"Cập nhật user ID: {instance.user_id}")
        print(f"Data nhận được: {request.data}")
        
        # Đảm bảo các trường có thể null
        data = request.data.copy()
        if 'phone' in data and data['phone'] == '':
            data['phone'] = None
        if 'address' in data and data['address'] == '':
            data['address'] = None
            
        try:
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Ghi log
            AuditLog.objects.create(
                admin_id=request.user.admin_id,
                action='Cập nhật người dùng',
                table_name='Users',
                record_id=user.user_id
            )
            
            return Response(UsersSerializer(user).data)
        except Exception as e:
            # Log lỗi chi tiết
            print(f"Lỗi khi cập nhật user: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.user_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa người dùng',
            table_name='Users',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# CategoriesViewSet
@method_decorator(csrf_exempt, name='dispatch')
class CategoriesViewSet(viewsets.ModelViewSet):
    queryset = Categories.objects.all()
    serializer_class = CategoriesSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        
        # Xử lý hình ảnh nếu có
        if 'images' in request.data and isinstance(request.data['images'], list):
            for image_data in request.data['images']:
                is_primary = image_data.get('is_primary', False)
                CategoryImages.objects.create(
                    category=category,
                    image_url=image_data['image_url'],
                    is_primary=is_primary
                )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo danh mục mới',
            table_name='Categories',
            record_id=category.category_id
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        
        # Cập nhật hoặc thêm hình ảnh nếu có
        if 'images' in request.data and isinstance(request.data['images'], list):
            # Xóa hình ảnh cũ và thêm mới
            CategoryImages.objects.filter(category=category).delete()
            for image_data in request.data['images']:
                is_primary = image_data.get('is_primary', False)
                CategoryImages.objects.create(
                    category=category,
                    image_url=image_data['image_url'],
                    is_primary=is_primary
                )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật danh mục',
            table_name='Categories',
            record_id=category.category_id
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.category_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa danh mục',
            table_name='Categories',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# ProductsViewSet
@method_decorator(csrf_exempt, name='dispatch')
class ProductsViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all().order_by('product_id')
    serializer_class = ProductsSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Products.objects.all().order_by('product_id')
        
        # Lấy tham số tìm kiếm từ URL nếu có
        search_query = self.request.query_params.get('search', None)
        category_id = self.request.query_params.get('category', None) or self.request.query_params.get('category_id', None)
        
        # Ghi log debug
        print(f"[ProductsViewSet] Nhận được request tìm kiếm sản phẩm với tham số: search={search_query}, category={category_id}")
        
        # Lọc theo danh mục nếu có
        if category_id:
            try:
                category_id = int(category_id)
                queryset = queryset.filter(category_id=category_id)
                print(f"[ProductsViewSet] Lọc theo danh mục {category_id}: {queryset.count()} sản phẩm")
            except (ValueError, TypeError):
                print(f"[ProductsViewSet] category_id không hợp lệ: {category_id}")
        
        # Xử lý tìm kiếm nếu có
        if search_query:
            print(f"[ProductsViewSet] Xử lý tìm kiếm với từ khóa: '{search_query}'")
            
            # Sử dụng prefetch_related để lấy thông tin sản phẩm và chi tiết trong một truy vấn
            queryset = queryset.prefetch_related('product_details')
            
            # Phân tách từ khóa tìm kiếm thành các từ riêng biệt
            search_terms = search_query.lower().split()
            print(f"[ProductsViewSet] Các từ khóa tìm kiếm: {search_terms}")
            
            # Điểm số tương đồng cho mỗi sản phẩm
            product_scores = {}
            
            # Duyệt qua từng sản phẩm để tìm kiếm
            for product in queryset:
                # Bỏ qua nếu sản phẩm không có tên
                if not product.name:
                    continue
                
                # Tổng điểm cho sản phẩm này
                score = 0
                
                # Tách tên sản phẩm thành các từ riêng biệt
                product_name = product.name.lower()
                product_name_terms = product_name.split()
                
                # Tìm kiếm trong mô tả sản phẩm nếu có
                product_description = (product.description or "").lower()
                
                # Thêm tìm kiếm trong thông số kỹ thuật nếu có
                product_specs = ""
                try:
                    # Lấy thông số kỹ thuật từ product_details
                    product_details = product.product_details.first()
                    if product_details and product_details.specification:
                        product_specs = product_details.specification.lower()
                except:
                    pass
                
                # Kiểm tra tương đồng với toàn bộ cụm từ tìm kiếm
                if search_query.lower() in product_name:
                    score += 10  # Ưu tiên cao nhất nếu tên chứa chính xác cụm từ tìm kiếm
                
                # Kiểm tra từng từ trong từ khóa tìm kiếm
                for search_term in search_terms:
                    # Kiểm tra xem từ khóa có xuất hiện trong tên sản phẩm không
                    if search_term in product_name:
                        score += 5  # Cộng điểm nếu từ khóa xuất hiện trong tên
                    
                    # Kiểm tra từng từ trong tên sản phẩm
                    for product_term in product_name_terms:
                        # Nếu từ khóa tìm kiếm nằm trong từ của sản phẩm hoặc ngược lại
                        if search_term in product_term or product_term in search_term:
                            score += 3
                        # Nếu từ khóa và từ sản phẩm khớp hoàn toàn
                        elif search_term == product_term:
                            score += 4
                    
                    # Kiểm tra trong mô tả
                    if product_description and search_term in product_description:
                        score += 2
                    
                    # Kiểm tra trong thông số kỹ thuật
                    if product_specs and search_term in product_specs:
                        score += 1
                
                # Lưu điểm nếu sản phẩm có điểm tương đồng > 0
                if score > 0:
                    product_scores[product.product_id] = score
            
            # Nếu có sản phẩm tương đồng, lọc và sắp xếp theo điểm số
            if product_scores:
                # Tạo mảng ID sản phẩm đã sắp xếp theo điểm số giảm dần
                sorted_ids = sorted(product_scores.keys(), key=lambda x: product_scores.get(x, 0), reverse=True)
                
                # Log các kết quả tìm kiếm hàng đầu để debug
                top_products = sorted_ids[:5] if len(sorted_ids) > 5 else sorted_ids
                print(f"[ProductsViewSet] Top kết quả tìm kiếm:")
                for product_id in top_products:
                    product_name = next((p.name for p in queryset if p.product_id == product_id), "Unknown")
                    print(f"  - ID: {product_id}, Tên: {product_name}, Điểm: {product_scores[product_id]}")
                
                # Tạo danh sách các sản phẩm theo thứ tự đã sắp xếp
                preserved = Case(*[When(product_id=id, then=pos) for pos, id in enumerate(sorted_ids)])
                queryset = queryset.filter(product_id__in=sorted_ids).order_by(preserved)
                print(f"[ProductsViewSet] Tổng số kết quả tìm kiếm: {queryset.count()} sản phẩm")
            else:
                # Nếu không có kết quả tương đồng, trả về queryset rỗng
                queryset = Products.objects.none()
                print("[ProductsViewSet] Không tìm thấy sản phẩm phù hợp với từ khóa tìm kiếm")
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return ProductCreateSerializer
        return ProductsSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        # Xử lý chi tiết sản phẩm nếu có
        if 'detail' in request.data and isinstance(request.data['detail'], dict):
            ProductDetails.objects.create(
                product=product,
                specification=request.data['detail'].get('specification')
            )
        elif 'specification' in request.data:
            ProductDetails.objects.create(
                product=product,
                specification=request.data['specification']
            )
        
        # Xử lý hình ảnh nếu có
        if 'images' in request.data and isinstance(request.data['images'], list):
            for image_data in request.data['images']:
                is_primary = image_data.get('is_primary', False)
                ProductImages.objects.create(
                    product=product,
                    image_url=image_data['image_url'],
                    is_primary=is_primary
                )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo sản phẩm mới',
            table_name='Products',
            record_id=product.product_id
        )
        
        return Response(ProductsSerializer(product).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        # Cập nhật chi tiết sản phẩm nếu có
        if 'detail' in request.data and isinstance(request.data['detail'], dict):
            product_detail, created = ProductDetails.objects.get_or_create(product=product)
            product_detail.specification = request.data['detail'].get('specification')
            product_detail.save()
        elif 'specification' in request.data:
            product_detail, created = ProductDetails.objects.get_or_create(product=product)
            product_detail.specification = request.data['specification']
            product_detail.save()
        
        # Cập nhật hoặc thêm hình ảnh nếu có
        if 'images' in request.data and isinstance(request.data['images'], list):
            # Có thể xóa hình ảnh cũ và thêm mới hoặc cập nhật từng cái
            ProductImages.objects.filter(product=product).delete()
            for image_data in request.data['images']:
                is_primary = image_data.get('is_primary', False)
                ProductImages.objects.create(
                    product=product,
                    image_url=image_data['image_url'],
                    is_primary=is_primary
                )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật sản phẩm',
            table_name='Products',
            record_id=product.product_id
        )
        
        return Response(ProductsSerializer(product).data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.product_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa sản phẩm',
            table_name='Products',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# PromotionsViewSet
@method_decorator(csrf_exempt, name='dispatch')
class PromotionsViewSet(viewsets.ModelViewSet):
    queryset = Promotions.objects.all()
    serializer_class = PromotionsSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        promotion = serializer.save()
        
        # Gắn khuyến mãi vào sản phẩm cụ thể nếu có
        if 'product_ids' in request.data and isinstance(request.data['product_ids'], list):
            for product_id in request.data['product_ids']:
                try:
                    product = Products.objects.get(product_id=product_id)
                    ProductPromotions.objects.create(
                        product=product,
                        category=None,
                        promotion=promotion
                    )
                except Products.DoesNotExist:
                    pass
        
        # Gắn khuyến mãi vào danh mục sản phẩm nếu có
        if 'category_ids' in request.data and isinstance(request.data['category_ids'], list):
            for category_id in request.data['category_ids']:
                try:
                    category = Categories.objects.get(category_id=category_id)
                    ProductPromotions.objects.create(
                        product=None,
                        category=category,
                        promotion=promotion
                    )
                except Categories.DoesNotExist:
                    pass
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo khuyến mãi mới',
            table_name='Promotions',
            record_id=promotion.promotion_id
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        promotion = serializer.save()
        
        # Xóa tất cả các liên kết khuyến mãi cũ
        ProductPromotions.objects.filter(promotion=promotion).delete()
        
        # Cập nhật khuyến mãi cho sản phẩm cụ thể nếu có
        if 'product_ids' in request.data and isinstance(request.data['product_ids'], list):
            for product_id in request.data['product_ids']:
                try:
                    product = Products.objects.get(product_id=product_id)
                    ProductPromotions.objects.create(
                        product=product,
                        category=None,
                        promotion=promotion
                    )
                except Products.DoesNotExist:
                    pass
        
        # Cập nhật khuyến mãi cho danh mục sản phẩm nếu có
        if 'category_ids' in request.data and isinstance(request.data['category_ids'], list):
            for category_id in request.data['category_ids']:
                try:
                    category = Categories.objects.get(category_id=category_id)
                    ProductPromotions.objects.create(
                        product=None,
                        category=category,
                        promotion=promotion
                    )
                except Categories.DoesNotExist:
                    pass
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật khuyến mãi',
            table_name='Promotions',
            record_id=promotion.promotion_id
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.promotion_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa khuyến mãi',
            table_name='Promotions',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# OrdersViewSet
@method_decorator(csrf_exempt, name='dispatch')
class OrdersViewSet(viewsets.ModelViewSet):
    queryset = Orders.objects.all().order_by('-order_id')
    serializer_class = OrdersSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderCreateSerializer
        return OrdersSerializer
    
    def create(self, request, *args, **kwargs):
        # Nếu có chi tiết đơn hàng, hãy áp dụng giá khuyến mãi nếu không chỉ định giá rõ ràng
        if 'details' in request.data and isinstance(request.data['details'], list):
            for detail in request.data['details']:
                # Nếu không có giá hoặc giá là 0, sử dụng giá khuyến mãi
                if 'price' not in detail or not detail['price']:
                    try:
                        product = Products.objects.get(pk=detail['product'])
                        # Sử dụng str() thay vì float() để giữ nguyên độ chính xác
                        detail['price'] = str(product.get_discounted_price())
                    except Products.DoesNotExist:
                        pass
        
        # Lưu thông tin thanh toán nếu có                
        payment_data = None
        if 'payment' in request.data:
            payment_data = request.data.pop('payment')
                        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Tạo bản ghi thanh toán
        if payment_data:
            # Tạo mã giao dịch ngẫu nhiên
            transaction_id = f"TXN{int(timezone.now().timestamp())}"
            
            Payments.objects.create(
                order=order,
                payment_method=payment_data.get('payment_method', 'Cash on Delivery'),
                payment_status=payment_data.get('payment_status', 'Pending'),
                transaction_id=transaction_id
            )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo đơn hàng mới',
            table_name='Orders',
            record_id=order.order_id
        )
        
        return Response(OrdersSerializer(order).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        # Nếu có chi tiết đơn hàng, hãy áp dụng giá khuyến mãi nếu không chỉ định giá rõ ràng
        if 'details' in request.data and isinstance(request.data['details'], list):
            for detail in request.data['details']:
                # Nếu không có giá hoặc giá là 0, sử dụng giá khuyến mãi
                if 'price' not in detail or not detail['price']:
                    try:
                        product = Products.objects.get(pk=detail['product'])
                        # Sử dụng str() thay vì float() để giữ nguyên độ chính xác
                        detail['price'] = str(product.get_discounted_price())
                    except Products.DoesNotExist:
                        pass
        
        # Lưu thông tin thanh toán nếu có                
        payment_data = None
        if 'payment' in request.data:
            payment_data = request.data.pop('payment')
                        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Lưu trạng thái trước khi cập nhật để kiểm tra nếu đổi trạng thái
        previous_status = instance.order_status
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Cập nhật hoặc tạo thông tin thanh toán
        if payment_data:
            payment, created = Payments.objects.get_or_create(
                order=order,
                defaults={
                    'payment_method': payment_data.get('payment_method', 'Cash on Delivery'),
                    'payment_status': payment_data.get('payment_status', 'Pending'),
                    'transaction_id': f"TXN{int(timezone.now().timestamp())}"
                }
            )
            
            if not created:
                # Nếu bản ghi đã tồn tại, cập nhật thông tin
                payment.payment_method = payment_data.get('payment_method', payment.payment_method)
                payment.payment_status = payment_data.get('payment_status', payment.payment_status)
                payment.save()
        
        # Nếu trạng thái thay đổi thành "Completed" và trạng thái trước đó không phải là "Completed"
        if 'order_status' in request.data and request.data['order_status'] == 'Completed' and previous_status != 'Completed':
            # Cập nhật kho cho từng sản phẩm trong đơn hàng
            for detail in order.details.all():
                try:
                    # Giảm số lượng trong kho và tăng số lượng đã bán
                    product = detail.product
                    quantity = detail.quantity
                    
                    # Kiểm tra xem có đủ hàng trong kho không
                    if product.stock_quantity < quantity:
                        # Vẫn cập nhật với số lượng có sẵn
                        available_quantity = product.stock_quantity
                        product.sold_quantity += available_quantity
                        product.stock_quantity = 0
                    else:
                        product.stock_quantity -= quantity
                        product.sold_quantity += quantity
                    
                    product.save()
                    
                    # Ghi log
                    AuditLog.objects.create(
                        admin_id=request.user.admin_id,
                        action=f'Cập nhật kho hàng cho sản phẩm {product.name} (-{quantity})',
                        table_name='Products',
                        record_id=product.product_id
                    )
                except Exception as e:
                    # Ghi lại lỗi nhưng không dừng quá trình xử lý
                    print(f"Lỗi khi cập nhật kho hàng: {str(e)}")
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật đơn hàng',
            table_name='Orders',
            record_id=order.order_id
        )
        
        return Response(OrdersSerializer(order).data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.order_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa đơn hàng',
            table_name='Orders',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# BlogViewSet
@method_decorator(csrf_exempt, name='dispatch')
class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all().order_by('-blog_id')
    serializer_class = BlogSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blog = serializer.save()
        
        # Xử lý hình ảnh nếu có
        if 'images' in request.data and isinstance(request.data['images'], list):
            for image_data in request.data['images']:
                is_primary = image_data.get('is_primary', False)
                BlogImages.objects.create(
                    blog=blog,
                    image_url=image_data['image_url'],
                    is_primary=is_primary
                )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo bài viết mới',
            table_name='Blog',
            record_id=blog.blog_id
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        blog = serializer.save()
        
        # Cập nhật hình ảnh nếu có
        if 'images' in request.data and isinstance(request.data['images'], list):
            # Xóa hình ảnh cũ và thêm mới
            BlogImages.objects.filter(blog=blog).delete()
            for image_data in request.data['images']:
                is_primary = image_data.get('is_primary', False)
                BlogImages.objects.create(
                    blog=blog,
                    image_url=image_data['image_url'],
                    is_primary=is_primary
                )
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật bài viết',
            table_name='Blog',
            record_id=blog.blog_id
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.blog_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa bài viết',
            table_name='Blog',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# FaqViewSet
@method_decorator(csrf_exempt, name='dispatch')
class FaqViewSet(viewsets.ModelViewSet):
    queryset = Faq.objects.all()
    serializer_class = FaqSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faq = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo FAQ mới',
            table_name='Faq',
            record_id=faq.faq_id
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        faq = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật FAQ',
            table_name='Faq',
            record_id=faq.faq_id
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.faq_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa FAQ',
            table_name='Faq',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# ContactViewSet
@method_decorator(csrf_exempt, name='dispatch')
class ContactViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.contact_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa liên hệ',
            table_name='Contact',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# CareersViewSet
@method_decorator(csrf_exempt, name='dispatch')
class CareersViewSet(viewsets.ModelViewSet):
    queryset = Careers.objects.all()
    serializer_class = CareersSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        career = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Tạo tuyển dụng mới',
            table_name='Careers',
            record_id=career.job_id
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        career = serializer.save()
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Cập nhật tuyển dụng',
            table_name='Careers',
            record_id=career.job_id
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance_id = instance.job_id
        self.perform_destroy(instance)
        
        # Ghi log
        AuditLog.objects.create(
            admin_id=request.user.admin_id,
            action='Xóa tuyển dụng',
            table_name='Careers',
            record_id=instance_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# TermsAndConditionsViewSet
@method_decorator(csrf_exempt, name='dispatch')
class TermsAndConditionsViewSet(viewsets.ModelViewSet):
    queryset = TermsAndConditions.objects.all()
    serializer_class = TermsAndConditionsSerializer
    permission_classes = [AllowAny]

# PrivacyPolicyViewSet
@method_decorator(csrf_exempt, name='dispatch')
class PrivacyPolicyViewSet(viewsets.ModelViewSet):
    queryset = PrivacyPolicy.objects.all()
    serializer_class = PrivacyPolicySerializer
    permission_classes = [AllowAny]

# Endpoint để lấy khuyến mãi áp dụng cho một sản phẩm cụ thể
@api_view(['GET'])
@permission_classes([AllowAny])
def product_promotions(request, product_id):
    try:
        product = Products.objects.get(product_id=product_id)
        
        # Lấy các khuyến mãi áp dụng trực tiếp cho sản phẩm
        direct_promotions = ProductPromotions.objects.filter(product=product)
        
        # Lấy các khuyến mãi áp dụng cho danh mục của sản phẩm
        category_promotions = ProductPromotions.objects.filter(category=product.category)
        
        # Kết hợp kết quả và loại bỏ trùng lặp
        all_promotions = []
        
        for promo in direct_promotions:
            all_promotions.append(promo.promotion)
            
        for promo in category_promotions:
            if promo.promotion not in all_promotions:
                all_promotions.append(promo.promotion)
        
        serializer = PromotionsSerializer(all_promotions, many=True)
        return Response(serializer.data)
    except Products.DoesNotExist:
        return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

# Endpoint để lấy danh sách các khuyến mãi áp dụng cho một danh mục
@api_view(['GET'])
@permission_classes([AllowAny])
def category_promotions(request, category_id):
    try:
        category = Categories.objects.get(category_id=category_id)
        promotions = [pp.promotion for pp in ProductPromotions.objects.filter(category=category)]
        serializer = PromotionsSerializer(promotions, many=True)
        return Response(serializer.data)
    except Categories.DoesNotExist:
        return Response({"error": "Danh mục không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

# Endpoint để lấy giá sau khuyến mãi của sản phẩm
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_price(request, product_id):
    try:
        product = Products.objects.get(product_id=product_id)
        regular_price = product.price
        discounted_price = product.get_discounted_price()
        
        # Kiểm tra nếu có giảm giá
        has_discount = regular_price != discounted_price
        
        # Tính phần trăm giảm giá
        if has_discount:
            discount_percent = round(((regular_price - discounted_price) / regular_price * Decimal('100')), 2)
        else:
            discount_percent = 0
        
        return Response({
            'product_id': product.product_id,
            'name': product.name,
            'regular_price': regular_price,
            'discounted_price': discounted_price,
            'has_discount': has_discount,
            'discount_percent': discount_percent
        })
    except Products.DoesNotExist:
        return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

# API đăng nhập cho người dùng thông thường
@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Đang đăng nhập với username: {username}")
        
        if not username or not password:
            return Response(
                {'detail': 'Vui lòng nhập tên đăng nhập và mật khẩu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tìm người dùng theo username hoặc email
        user = Users.objects.filter(
            Q(username=username) | Q(email=username)
        ).first()
        
        if not user:
            print(f"Không tìm thấy tài khoản với username/email: {username}")
            return Response(
                {'detail': 'Tài khoản không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra mật khẩu
        if not check_password(password, user.password):
            print(f"Mật khẩu không chính xác cho user: {user.username}")
            return Response(
                {'detail': 'Mật khẩu không chính xác'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Tạo token đơn giản dễ parse
        token = f"user_{user.user_id}_{abs(hash(user.username+str(user.user_id)))}"
        print(f"Đã tạo token: {token}")
        
        # Lấy thông tin thiết bị và IP
        ip_address = request.META.get('REMOTE_ADDR', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Ghi log hoạt động đăng nhập
        try:
            UserActivityLog.objects.create(
                user=user,
                action='User login',
                device=user_agent,
                ip_address=ip_address
            )
            print(f"Đã ghi log đăng nhập cho user: {user.username}, IP: {ip_address}, Device: {user_agent}")
        except Exception as e:
            print(f"Lỗi khi ghi log đăng nhập: {str(e)}")
        
        # Trả về thông tin người dùng và token đơn giản
        user_data = {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'token': token,
        }
        
        print(f"Đăng nhập thành công: {user.username}, ID: {user.user_id}")
        return Response(user_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"Lỗi đăng nhập: {str(e)}")
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API đăng ký cho người dùng thông thường
@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    try:
        data = request.data
        
        # Kiểm tra các trường bắt buộc
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return Response(
                {'detail': 'Vui lòng điền đầy đủ thông tin bắt buộc'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra username đã tồn tại chưa
        if Users.objects.filter(username=data.get('username')).exists():
            return Response(
                {'detail': 'Tên đăng nhập đã được sử dụng'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra email đã tồn tại chưa
        if Users.objects.filter(email=data.get('email')).exists():
            return Response(
                {'detail': 'Email đã được sử dụng'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mã hóa mật khẩu
        hashed_password = make_password(data.get('password'))
        
        # Tạo người dùng mới
        user = Users.objects.create(
            username=data.get('username'),
            email=data.get('email'),
            password=hashed_password,
            phone=data.get('phone', ''),
            address=data.get('address', '')
        )
        
        return Response({
            'user_id': user.user_id,
            'username': user.username,
            'message': 'Đăng ký thành công'
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API để cập nhật thông tin người dùng
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_user_profile(request):
    try:
        # Lấy token từ header
        auth_header = request.headers.get('Authorization', '')
        print(f"Đã nhận token header: {auth_header}")
        
        if not auth_header.startswith('Bearer '):
            return Response(
                {'detail': 'Không tìm thấy Bearer token trong header'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        print(f"Đã nhận token: {token}")
        
        # Parse token để lấy user_id
        user_id = None
        
        # Nếu token có định dạng như "user_{user_id}_{hash}"
        if token.startswith('user_'):
            parts = token.split('_')
            if len(parts) >= 2:
                try:
                    user_id = int(parts[1])
                    print(f"Đã trích xuất user_id={user_id} từ token")
                except ValueError:
                    print("Không thể parse user_id từ token")
            else:
                print("Token không đúng định dạng user_id_hash")
        
        if not user_id:
            print("Không thể xác định user_id từ token")
            return Response(
                {'detail': 'Token không hợp lệ'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Tìm người dùng theo ID
        try:
            user = Users.objects.get(user_id=user_id)
            print(f"Đã tìm thấy user: {user.username}, ID: {user.user_id}")
        except Users.DoesNotExist:
            print(f"Không tìm thấy người dùng với ID: {user_id}")
            return Response(
                {'detail': 'Người dùng không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cập nhật thông tin người dùng
        data = request.data
        print(f"Dữ liệu cập nhật: {data}")
        
        # Không cho phép thay đổi email
        if 'email' in data:
            del data['email']
            
        # Cập nhật các trường dữ liệu
        if 'username' in data and data['username'] != user.username:
            # Kiểm tra username đã tồn tại chưa
            if Users.objects.filter(username=data['username']).exclude(user_id=user_id).exists():
                return Response(
                    {'detail': 'Tên đăng nhập đã được sử dụng'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = data['username']
            print(f"Đã cập nhật username thành: {user.username}")
            
        if 'phone' in data:
            user.phone = data['phone']
            print(f"Đã cập nhật phone thành: {user.phone}")
            
        if 'address' in data:
            user.address = data['address']
            print(f"Đã cập nhật address thành: {user.address}")
            
        # Lưu thay đổi vào database
        user.save()
        print("Đã lưu thay đổi vào database")
        
        # Trả về thông tin đã cập nhật
        response_data = {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone or '',
            'address': user.address or ''
        }
        print(f"Trả về thông tin người dùng đã cập nhật: {response_data}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Lỗi khi xử lý update_user_profile: {str(e)}")
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API để lấy thông tin chi tiết người dùng
@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile(request):
    try:
        # Lấy token từ header
        auth_header = request.headers.get('Authorization', '')
        print(f"Đã nhận token header: {auth_header}")
        
        if not auth_header.startswith('Bearer '):
            return Response(
                {'detail': 'Không tìm thấy Bearer token trong header'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        print(f"Đã nhận token: {token}")
        
        # Parse token để lấy user_id
        user_id = None
        
        # Nếu token có định dạng như "user_{user_id}_{hash}"
        if token.startswith('user_'):
            parts = token.split('_')
            if len(parts) >= 2:
                try:
                    user_id = int(parts[1])
                except ValueError:
                    pass
        
        if not user_id:
            print("Không thể xác định user_id từ token")
            return Response(
                {'detail': 'Token không hợp lệ'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Tìm người dùng theo ID
        try:
            user = Users.objects.get(user_id=user_id)
            print(f"Đã tìm thấy user: {user.username}, ID: {user.user_id}")
        except Users.DoesNotExist:
            print(f"Không tìm thấy người dùng với ID: {user_id}")
            return Response(
                {'detail': 'Người dùng không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Trả về thông tin người dùng
        response_data = {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone or '',
            'address': user.address or ''
        }
        print(f"Trả về thông tin người dùng: {response_data}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Lỗi khi xử lý user_profile: {str(e)}")
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API để thay đổi mật khẩu người dùng
@api_view(['POST'])
@permission_classes([AllowAny])
def user_change_password(request):
    try:
        # Lấy token từ header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return Response(
                {'detail': 'Không tìm thấy Bearer token trong header'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        # Parse token để lấy user_id
        user_id = None
        
        # Nếu token có định dạng như "user_{user_id}_{hash}"
        if token.startswith('user_'):
            parts = token.split('_')
            if len(parts) >= 2:
                try:
                    user_id = int(parts[1])
                except ValueError:
                    pass
        
        if not user_id:
            return Response(
                {'detail': 'Token không hợp lệ'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Tìm người dùng theo ID
        try:
            user = Users.objects.get(user_id=user_id)
        except Users.DoesNotExist:
            return Response(
                {'detail': 'Người dùng không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra dữ liệu đầu vào
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'detail': 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra mật khẩu hiện tại
        if not check_password(current_password, user.password):
            return Response(
                {'detail': 'Mật khẩu hiện tại không chính xác'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Đảm bảo mật khẩu mới đủ mạnh
        if len(new_password) < 8:
            return Response(
                {'detail': 'Mật khẩu mới phải có ít nhất 8 ký tự'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cập nhật mật khẩu mới
        user.password = make_password(new_password)
        user.save()
        
        return Response({
            'detail': 'Mật khẩu đã được thay đổi thành công'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Endpoint để cập nhật số lượng tồn kho và số lượng đã bán
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def update_product_inventory(request, product_id):
    try:
        product = Products.objects.get(product_id=product_id)
        
        # Lấy số lượng từ request
        quantity = request.data.get('quantity', 0)
        quantity = int(quantity)
        
        # Nếu quantity < 0, giảm stock_quantity và tăng sold_quantity
        # Điều này xảy ra khi một đơn hàng được hoàn thành
        if quantity < 0:
            abs_quantity = abs(quantity)
            
            # Kiểm tra xem có đủ hàng trong kho không
            if product.stock_quantity < abs_quantity:
                return Response({
                    "error": f"Không đủ hàng trong kho. Hiện chỉ có {product.stock_quantity} sản phẩm."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cập nhật số lượng
            product.stock_quantity -= abs_quantity
            product.sold_quantity += abs_quantity
        else:
            # Nếu quantity > 0, tăng stock_quantity
            # Điều này xảy ra khi nhập thêm hàng vào kho
            product.stock_quantity += quantity
        
        # Lưu thay đổi
        product.save()
        
        # Ghi log
        try:
            AuditLog.objects.create(
                admin_id=request.user.admin_id if hasattr(request.user, 'admin_id') else None,
                action=f"Cập nhật kho hàng sản phẩm {product.name} ({quantity})",
                table_name='Products',
                record_id=product.product_id
            )
        except:
            # Bỏ qua lỗi nếu không thể ghi log
            pass
        
        return Response({
            "success": True,
            "product_id": product.product_id,
            "name": product.name,
            "stock_quantity": product.stock_quantity,
            "sold_quantity": product.sold_quantity,
            "message": f"Đã cập nhật số lượng tồn kho thành {product.stock_quantity} và số lượng đã bán thành {product.sold_quantity}"
        })
    except Products.DoesNotExist:
        return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Endpoint để lấy danh sách các khuyến mãi đang còn hiệu lực
@api_view(['GET'])
@permission_classes([AllowAny])
def active_promotions(request):
    try:
        from django.utils import timezone
        current_time = timezone.now()
        
        # Lấy các khuyến mãi đang còn hiệu lực
        active_promos = Promotions.objects.filter(
            start_date__lte=current_time,
            end_date__gte=current_time
        ).order_by('end_date')  # Sắp xếp theo thời gian kết thúc gần nhất
        
        # Debug: Thêm domain cho img_banner nếu cần
        domain = request.build_absolute_uri('/').rstrip('/')
        for promo in active_promos:
            if promo.img_banner and not promo.img_banner.startswith(('http://', 'https://')):
                # Đảm bảo đường dẫn bắt đầu bằng /
                img_path = promo.img_banner
                if not img_path.startswith('/'):
                    img_path = f'/{img_path}'
                promo.img_banner = f"{domain}{img_path}"
                
            # In thông tin cho debug
            print(f"Promotion {promo.promotion_id} - {promo.title}: {promo.img_banner}")
        
        serializer = PromotionsSerializer(active_promos, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in active_promotions: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Endpoint để lấy danh sách sản phẩm được áp dụng cho một khuyến mãi
@api_view(['GET'])
@permission_classes([AllowAny])
def promotion_products(request, promotion_id):
    try:
        promotion = Promotions.objects.get(promotion_id=promotion_id)
        # Lấy tất cả các bản ghi ProductPromotions có liên kết đến promotion này và có sản phẩm (không phải null)
        product_promotions = ProductPromotions.objects.filter(promotion=promotion, product__isnull=False)
        
        # Tạo dữ liệu phản hồi với thông tin sản phẩm
        product_data = []
        for pp in product_promotions:
            product_data.append({
                'product_promotion_id': pp.product_promotion_id,
                'product_id': pp.product.product_id,
                'product_name': pp.product.name,
                'price': pp.product.price
            })
        
        return Response(product_data)
    except Promotions.DoesNotExist:
        return Response({"error": "Khuyến mãi không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

# Endpoint để lấy danh sách danh mục được áp dụng cho một khuyến mãi
@api_view(['GET'])
@permission_classes([AllowAny])
def promotion_categories(request, promotion_id):
    try:
        promotion = Promotions.objects.get(promotion_id=promotion_id)
        # Lấy tất cả các bản ghi ProductPromotions có liên kết đến promotion này và có danh mục (không phải null)
        category_promotions = ProductPromotions.objects.filter(promotion=promotion, category__isnull=False)
        
        # Tạo dữ liệu phản hồi với thông tin danh mục
        category_data = []
        for cp in category_promotions:
            category_data.append({
                'product_promotion_id': cp.product_promotion_id,
                'category_id': cp.category.category_id,
                'category_name': cp.category.name,
            })
        
        return Response(category_data)
    except Promotions.DoesNotExist:
        return Response({"error": "Khuyến mãi không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

# Endpoint để lấy thông tin khuyến mãi chi tiết cho trang Promotions
@api_view(['GET'])
@permission_classes([AllowAny])
def promotions_frontend(request):
    """
    API endpoint cung cấp dữ liệu khuyến mãi cho trang Promotions trên frontend.
    Trả về 3 danh sách khuyến mãi: hiện tại, sắp tới và đã hết hạn.
    """
    try:
        now = timezone.now()
        
        # Lấy khuyến mãi đang diễn ra (hiện tại)
        current_promotions = Promotions.objects.filter(
            start_date__lte=now,
            end_date__gte=now
        ).order_by('end_date')
        
        # Lấy khuyến mãi sắp tới
        upcoming_promotions = Promotions.objects.filter(
            start_date__gt=now
        ).order_by('start_date')
        
        # Lấy khuyến mãi đã hết hạn (chỉ lấy 10 khuyến mãi gần nhất để tránh quá tải)
        expired_promotions = Promotions.objects.filter(
            end_date__lt=now
        ).order_by('-end_date')[:10]
        
        # Xử lý và tạo dữ liệu response
        def process_promotions(promotions):
            result = []
            for promo in promotions:
                # Lấy thông tin sản phẩm được áp dụng
                product_promotions = ProductPromotions.objects.filter(
                    promotion=promo, 
                    product__isnull=False
                ).select_related('product')
                
                products = []
                for pp in product_promotions:
                    product = {
                        'id': pp.product.product_id,
                        'name': pp.product.name,
                        'regular_price': float(pp.product.price),
                        'discounted_price': float(pp.product.get_discounted_price()),
                    }
                    
                    # Thêm ảnh sản phẩm nếu có
                    product_image = ProductImages.objects.filter(
                        product=pp.product, 
                        is_primary=True
                    ).first()
                    
                    if product_image:
                        product['image'] = product_image.image_url
                    else:
                        # Lấy ảnh đầu tiên nếu không có ảnh chính
                        any_image = ProductImages.objects.filter(
                            product=pp.product
                        ).first()
                        product['image'] = any_image.image_url if any_image else None
                    
                    products.append(product)
                
                # Lấy thông tin danh mục được áp dụng
                category_promotions = ProductPromotions.objects.filter(
                    promotion=promo, 
                    category__isnull=False
                ).select_related('category')
                
                categories = []
                for cp in category_promotions:
                    category = {
                        'id': cp.category.category_id,
                        'name': cp.category.name,
                    }
                    
                    # Thêm URL ảnh danh mục nếu có
                    if cp.category.img_url:
                        category['image'] = cp.category.img_url
                    
                    categories.append(category)
                
                # Tạo dữ liệu khuyến mãi
                promotion_data = {
                    'id': promo.promotion_id,
                    'title': promo.title,
                    'description': promo.description,
                    'discount_percentage': promo.discount_percentage,
                    'start_date': promo.start_date,
                    'end_date': promo.end_date,
                    'img_banner': promo.img_banner,
                    'products': products,
                    'categories': categories,
                    'code': f"PROMO{promo.promotion_id:02d}",  # Tạo mã khuyến mãi giả
                }
                
                result.append(promotion_data)
            
            return result
        
        # Xử lý cả 3 loại khuyến mãi
        current = process_promotions(current_promotions)
        upcoming = process_promotions(upcoming_promotions)
        expired = process_promotions(expired_promotions)
        
        # Chọn khuyến mãi nổi bật (featured) là khuyến mãi hiện tại đầu tiên hoặc khuyến mãi sắp tới đầu tiên
        featured = None
        if current:
            featured = current[0]
        elif upcoming:
            featured = upcoming[0]
        
        response_data = {
            'featured': featured,
            'current': current,
            'upcoming': upcoming,
            'expired': expired
        }
        
        return Response(response_data)
    
    except Exception as e:
        print(f"Error in promotions_frontend: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Endpoint để lấy thông tin bài viết cho trang Blog
@api_view(['GET'])
@permission_classes([AllowAny])
def blogs_frontend(request):
    """
    API endpoint cung cấp dữ liệu bài viết cho trang Blog trên frontend.
    Trả về danh sách bài viết mới nhất.
    """
    try:
        # Lấy các bài viết mới nhất
        blogs = Blog.objects.all().order_by('-created_at')
        
        # Số lượng bài viết hiển thị trên mỗi trang
        page_size = int(request.query_params.get('page_size', 10))
        
        # Trang hiện tại
        page = int(request.query_params.get('page', 1))
        
        # Tính toán vị trí bắt đầu và kết thúc
        start = (page - 1) * page_size
        end = start + page_size
        
        # Phân trang thủ công
        paginated_blogs = blogs[start:end]
        
        # Xử lý và tạo dữ liệu response
        result = []
        for blog in paginated_blogs:
            # Lấy thông tin hình ảnh
            blog_images = BlogImages.objects.filter(blog=blog)
            
            # Tìm hình ảnh chính
            primary_image = blog_images.filter(is_primary=True).first()
            
            # Nếu không có hình ảnh chính, lấy hình ảnh đầu tiên
            if not primary_image and blog_images.exists():
                primary_image = blog_images.first()
            
            # Tạo dữ liệu bài viết
            blog_data = {
                'id': blog.blog_id,
                'title': blog.title,
                'content': blog.content,
                'created_at': blog.created_at,
                'primary_image': primary_image.image_url if primary_image else None,
                'images': [
                    {
                        'image_id': img.image_id,
                        'image_url': img.image_url,
                        'is_primary': img.is_primary
                    } for img in blog_images
                ]
            }
            
            result.append(blog_data)
        
        # Tổng số bài viết và tổng số trang
        total_blogs = blogs.count()
        total_pages = (total_blogs + page_size - 1) // page_size
        
        response_data = {
            'blogs': result,
            'pagination': {
                'total_blogs': total_blogs,
                'total_pages': total_pages,
                'current_page': page,
                'page_size': page_size
            }
        }
        
        return Response(response_data)
    
    except Exception as e:
        print(f"Error in blogs_frontend: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def add_to_cart(request):
    """
    Thêm sản phẩm vào giỏ hàng. Yêu cầu:
    - product_id: ID của sản phẩm
    - user_id: ID của người dùng
    - quantity: Số lượng (mặc định là 1)
    """
    try:
        data = request.data
        product_id = data.get('product_id')
        user_id = data.get('user_id')
        quantity = data.get('quantity', 1)
        
        # Kiểm tra xem sản phẩm có tồn tại không
        try:
            product = Products.objects.get(pk=product_id)
        except Products.DoesNotExist:
            return Response(
                {"error": "Sản phẩm không tồn tại"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra xem người dùng có tồn tại không
        try:
            user = Users.objects.get(pk=user_id)
        except Users.DoesNotExist:
            return Response(
                {"error": "Người dùng không tồn tại"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra xem số lượng có hợp lệ không
        if not isinstance(quantity, int) or quantity <= 0:
            return Response(
                {"error": "Số lượng phải là số nguyên dương"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra xem sản phẩm có đủ số lượng trong kho không
        if product.stock_quantity < quantity:
            return Response(
                {"error": f"Số lượng sản phẩm trong kho không đủ. Hiện chỉ còn {product.stock_quantity} sản phẩm."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa (chưa được gán cho đơn hàng nào)
        cart_item = Cart.objects.filter(user=user, product=product, order__isnull=True).first()
        
        if cart_item:
            # Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
            cart_item.quantity += quantity
            cart_item.save()
            message = "Đã cập nhật số lượng sản phẩm trong giỏ hàng"
        else:
            # Nếu sản phẩm chưa có trong giỏ hàng, tạo mới
            cart_item = Cart.objects.create(
                user=user,
                product=product,
                quantity=quantity,
                created_at=timezone.now()
            )
            message = "Đã thêm sản phẩm vào giỏ hàng"
        
        # Trả về thông tin giỏ hàng
        return Response({
            "success": True,
            "message": message,
            "cart_item": {
                "cart_id": cart_item.cart_id,
                "product_id": product.product_id,
                "product_name": product.name,
                "quantity": cart_item.quantity,
                "price": float(product.price),
                "created_at": cart_item.created_at
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Đã xảy ra lỗi: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 

# API endpoints cho giỏ hàng
@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_user_cart(request, user_id):
    """
    Lấy danh sách các sản phẩm trong giỏ hàng của người dùng
    """
    try:
        # Kiểm tra xem user có tồn tại không
        try:
            user = Users.objects.get(user_id=user_id)
        except Users.DoesNotExist:
            return Response(
                {"error": "Người dùng không tồn tại"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lấy giỏ hàng của người dùng (chỉ các sản phẩm chưa được đặt hàng)
        cart_items = Cart.objects.filter(user=user, order__isnull=True)
        
        # Serialize dữ liệu
        serializer = CartDetailSerializer(cart_items, many=True)
        
        # Tính tổng tiền và các thông tin khác
        total_price = sum(item.product.price * item.quantity for item in cart_items)
        discounted_total = sum(item.product.get_discounted_price() * item.quantity for item in cart_items)
        
        # Tính phí vận chuyển mặc định
        shipping_cost = 30000  # 30,000 VND

        # Tính tổng cộng (sau khuyến mãi + phí vận chuyển)
        final_total = discounted_total + shipping_cost
        
        return Response({
            "cart_items": serializer.data,
            "cart_summary": {
                "total_items": len(cart_items),
                "total_price": float(total_price),
                "discounted_total": float(discounted_total),
                "shipping_cost": float(shipping_cost),
                "final_total": float(final_total)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Đã xảy ra lỗi: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def update_cart_item(request, cart_id):
    """
    Cập nhật số lượng sản phẩm trong giỏ hàng
    """
    try:
        # Lấy thông tin từ request
        data = request.data
        new_quantity = data.get('quantity')
        
        if new_quantity is None:
            return Response(
                {"error": "Vui lòng cung cấp số lượng mới"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Chuyển đổi sang số nguyên và kiểm tra giá trị
            new_quantity = int(new_quantity)
            if new_quantity <= 0:
                return Response(
                    {"error": "Số lượng phải lớn hơn 0"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"error": "Số lượng phải là số nguyên"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra và lấy cart item
        try:
            cart_item = Cart.objects.get(cart_id=cart_id)
        except Cart.DoesNotExist:
            return Response(
                {"error": "Sản phẩm không tồn tại trong giỏ hàng"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra số lượng trong kho
        if cart_item.product.stock_quantity < new_quantity:
            return Response(
                {"error": f"Số lượng sản phẩm trong kho không đủ. Hiện chỉ còn {cart_item.product.stock_quantity} sản phẩm."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cập nhật số lượng
        cart_item.quantity = new_quantity
        cart_item.save()
        
        # Trả về thông tin đã cập nhật
        serializer = CartDetailSerializer(cart_item)
        return Response({
            "success": True,
            "message": "Đã cập nhật số lượng sản phẩm",
            "cart_item": serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Đã xảy ra lỗi: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
@csrf_exempt
def remove_cart_item(request, cart_id):
    """
    Xóa sản phẩm khỏi giỏ hàng
    """
    try:
        # Kiểm tra và lấy cart item
        try:
            cart_item = Cart.objects.get(cart_id=cart_id)
        except Cart.DoesNotExist:
            return Response(
                {"error": "Sản phẩm không tồn tại trong giỏ hàng"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lưu thông tin sản phẩm đã xóa để trả về
        product_name = cart_item.product.name
        
        # Xóa sản phẩm khỏi giỏ hàng
        cart_item.delete()
        
        return Response({
            "success": True,
            "message": f"Đã xóa sản phẩm '{product_name}' khỏi giỏ hàng"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Đã xảy ra lỗi: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API endpoint để tạo đơn hàng từ giỏ hàng
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def create_order_from_cart(request):
    """
    Tạo đơn hàng mới từ giỏ hàng của người dùng
    """
    try:
        # Lấy thông tin từ request
        data = request.data
        user_id = data.get('user_id')
        shipping_address = data.get('shipping_address')
        payment_method = data.get('payment_method', 'COD')  # Mặc định là COD
        
        # Kiểm tra thông tin bắt buộc
        if not user_id:
            return Response(
                {"error": "Vui lòng cung cấp user_id"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not shipping_address:
            return Response(
                {"error": "Vui lòng cung cấp địa chỉ giao hàng"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra xem user có tồn tại không
        try:
            user = Users.objects.get(user_id=user_id)
        except Users.DoesNotExist:
            return Response(
                {"error": "Người dùng không tồn tại"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lấy giỏ hàng của người dùng (chỉ các sản phẩm chưa được đặt hàng)
        cart_items = Cart.objects.filter(user=user, order__isnull=True)
        
        if not cart_items.exists():
            return Response(
                {"error": "Giỏ hàng trống, không thể tạo đơn hàng"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tính tổng tiền
        total_amount = sum(item.product.get_discounted_price() * item.quantity for item in cart_items)
        
        # Thêm phí vận chuyển
        shipping_cost = 30000  # 30,000 VND
        total_amount += shipping_cost
        
        # Tạo đơn hàng mới
        new_order = Orders.objects.create(
            user=user,
            customer_name=user.username,
            customer_email=user.email,
            customer_phone=user.phone,
            shipping_address=shipping_address,
            total_amount=total_amount,
            order_status='Pending'  # Trạng thái mặc định là "Đang xử lý"
        )
        
        # Tạo chi tiết đơn hàng
        for cart_item in cart_items:
            OrderDetails.objects.create(
                order=new_order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.get_discounted_price()  # Lưu giá đã giảm
            )
            
            # Cập nhật số lượng tồn kho của sản phẩm
            product = cart_item.product
            product.stock_quantity -= cart_item.quantity
            product.sold_quantity += cart_item.quantity
            product.save()
            
            # Gán order cho cart_item để đánh dấu đã đặt hàng
            cart_item.order = new_order
            cart_item.save()
        
        # Tạo thông tin thanh toán
        payment = Payments.objects.create(
            order=new_order,
            payment_method=payment_method,
            payment_status='Pending',  # Trạng thái mặc định là "Đang xử lý"
            transaction_id=f"TXN{int(timezone.now().timestamp())}"  # Tạo mã giao dịch
        )
        
        # Serialize dữ liệu để trả về
        order_serializer = OrdersSerializer(new_order)
        
        return Response({
            "success": True,
            "message": "Đã tạo đơn hàng thành công",
            "order": order_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {"error": f"Đã xảy ra lỗi: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_user_orders(request, user_id):
    """
    Lấy danh sách đơn hàng của người dùng
    """
    try:
        # Kiểm tra người dùng tồn tại
        try:
            user = Users.objects.get(user_id=user_id)
        except Users.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        
        # Lấy đơn hàng của người dùng, sắp xếp theo thời gian tạo giảm dần (mới nhất lên đầu)
        orders = Orders.objects.filter(user=user).order_by('-created_at')
        
        # Serialize dữ liệu
        serializer = OrdersSerializer(orders, many=True)
        
        # Lấy thêm thông tin hình ảnh cho từng sản phẩm trong đơn hàng
        enhanced_orders = []
        
        for order_data in serializer.data:
            # Tạo bản sao của đơn hàng để thêm thông tin hình ảnh
            enhanced_order = dict(order_data)
            
            # Cập nhật thông tin hình ảnh cho từng sản phẩm trong đơn hàng
            enhanced_details = []
            for detail in enhanced_order['details']:
                # Lấy product_id từ chi tiết đơn hàng
                product_id = detail['product']
                
                # Tìm hình ảnh chính của sản phẩm
                try:
                    # Ưu tiên hình ảnh chính (is_primary=True)
                    product_image = ProductImages.objects.filter(
                        product_id=product_id, 
                        is_primary=True
                    ).first()
                    
                    # Nếu không tìm thấy hình ảnh chính, lấy hình ảnh đầu tiên
                    if not product_image:
                        product_image = ProductImages.objects.filter(
                            product_id=product_id
                        ).first()
                    
                    # Nếu tìm thấy hình ảnh, thêm vào chi tiết
                    if product_image:
                        detail['image_url'] = product_image.image_url
                    else:
                        detail['image_url'] = None
                        
                except Exception as e:
                    detail['image_url'] = None
                    print(f"Lỗi khi lấy hình ảnh sản phẩm {product_id}: {str(e)}")
                
                # Thử lấy thông tin hình ảnh từ giỏ hàng nếu không tìm thấy hình ảnh trực tiếp
                if not detail.get('image_url'):
                    try:
                        # Tìm mục giỏ hàng tương ứng với sản phẩm trong đơn hàng
                        cart_item = Cart.objects.filter(
                            order_id=order_data['order_id'], 
                            product_id=product_id
                        ).first()
                        
                        if cart_item:
                            # Lấy sản phẩm từ giỏ hàng
                            product = cart_item.product
                            # Lấy hình ảnh chính của sản phẩm
                            product_image = product.images.filter(is_primary=True).first() or product.images.first()
                            if product_image:
                                detail['image_url'] = product_image.image_url
                    except Exception as e:
                        print(f"Lỗi khi lấy hình ảnh từ giỏ hàng: {str(e)}")
                
                # Nếu vẫn không tìm thấy hình ảnh, sử dụng ảnh mặc định
                if not detail.get('image_url'):
                    detail['image_url'] = '/assets/images/product-placeholder.jpg'
                
                enhanced_details.append(detail)
            
            # Cập nhật chi tiết đơn hàng với thông tin đã bổ sung
            enhanced_order['details'] = enhanced_details
            enhanced_orders.append(enhanced_order)
        
        return Response({
            "success": True,
            "orders": enhanced_orders
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Đã xảy ra lỗi: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def cancel_order(request, order_id):
    """
    Hủy đơn hàng khi đơn hàng đang ở trạng thái 'Processing'
    """
    try:
        # Lấy thông tin đơn hàng từ database
        try:
            order = Orders.objects.get(order_id=order_id)
        except Orders.DoesNotExist:
            return Response({"error": "Đơn hàng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra xem đơn hàng có thuộc về người dùng gửi request không
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Vui lòng cung cấp user_id"}, status=status.HTTP_400_BAD_REQUEST)
            
        if order.user is None or str(order.user.user_id) != str(user_id):
            return Response({"error": "Bạn không có quyền hủy đơn hàng này"}, status=status.HTTP_403_FORBIDDEN)
        
        # Kiểm tra trạng thái đơn hàng
        if order.order_status not in ['Pending', 'Processing']:
            return Response(
                {"error": "Chỉ có thể hủy đơn hàng ở trạng thái 'Đang xử lý'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cập nhật trạng thái đơn hàng
        order.order_status = 'Cancelled'
        order.save()
        
        # Cập nhật lại số lượng sản phẩm trong kho
        order_details = OrderDetails.objects.filter(order=order)
        for detail in order_details:
            product = detail.product
            # Hoàn trả số lượng sản phẩm vào kho
            product.stock_quantity += detail.quantity
            product.sold_quantity -= detail.quantity
            product.save()
        
        # Cập nhật trạng thái thanh toán nếu có
        try:
            payment = Payments.objects.get(order=order)
            payment.payment_status = 'Cancelled'
            payment.save()
        except Payments.DoesNotExist:
            pass
        
        return Response({
            "success": True,
            "message": "Đơn hàng đã được hủy thành công",
            "order": OrdersSerializer(order).data
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def add_review(request):
    """
    API endpoint để thêm đánh giá sản phẩm.
    Lấy thông tin user_id từ dữ liệu gửi lên thay vì token.
    """
    try:
        # Lấy dữ liệu từ request
        product_id = request.data.get('product_id')
        user_id = request.data.get('user_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        
        print(f"Đang xử lý đánh giá: user_id={user_id}, product_id={product_id}, rating={rating}")
        
        # Kiểm tra các trường bắt buộc
        if not product_id:
            return Response({'error': 'product_id là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return Response({'error': 'user_id là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not rating:
            return Response({'error': 'rating là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return Response({'error': 'rating phải từ 1 đến 5'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'rating phải là số nguyên'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Kiểm tra sản phẩm có tồn tại không
        try:
            product = Products.objects.get(product_id=product_id)
        except Products.DoesNotExist:
            return Response({'error': 'Sản phẩm không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
            
        # Kiểm tra người dùng có tồn tại không
        try:
            user = Users.objects.get(user_id=user_id)
        except Users.DoesNotExist:
            return Response({'error': 'Người dùng không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
            
        # Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
        existing_review = Reviews.objects.filter(user=user, product=product).first()
        
        if existing_review:
            # Cập nhật đánh giá hiện có
            existing_review.rating = rating
            existing_review.comment = comment
            existing_review.created_at = timezone.now()
            existing_review.save()
            
            serializer = ReviewsSerializer(existing_review)
            return Response({
                'message': 'Đã cập nhật đánh giá sản phẩm thành công',
                'review': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # Tạo đánh giá mới
            new_review = Reviews(
                user=user,
                product=product,
                rating=rating,
                comment=comment
            )
            new_review.save()
            
            serializer = ReviewsSerializer(new_review)
            return Response({
                'message': 'Đã thêm đánh giá sản phẩm thành công',
                'review': serializer.data
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        print(f"Lỗi khi thêm đánh giá: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Endpoint để lấy đánh giá sản phẩm theo product_id
@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_reviews(request, product_id):
    """
    API endpoint để lấy tất cả đánh giá của một sản phẩm.
    """
    try:
        # Kiểm tra sản phẩm có tồn tại không
        try:
            product = Products.objects.get(product_id=product_id)
        except Products.DoesNotExist:
            return Response({'error': 'Sản phẩm không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
            
        # Lấy tất cả đánh giá của sản phẩm, sắp xếp theo thời gian tạo giảm dần
        reviews = Reviews.objects.filter(product=product).order_by('-created_at')
        
        serializer = ReviewsSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Lỗi khi lấy đánh giá sản phẩm: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Endpoint để lấy thông tin khuyến mãi cho trang client
@api_view(['GET'])
@permission_classes([AllowAny])
def promotions_client(request):
    """
    API endpoint cung cấp dữ liệu khuyến mãi định dạng phù hợp với component Promotions.js
    ở phía client. Trả về các khuyến mãi hiện tại, sắp tới và đã hết hạn.
    """
    try:
        now = timezone.now()
        
        # Lấy khuyến mãi đang diễn ra (hiện tại)
        current_promotions = Promotions.objects.filter(
            start_date__lte=now,
            end_date__gte=now
        ).order_by('end_date')
        
        # Lấy khuyến mãi sắp tới
        upcoming_promotions = Promotions.objects.filter(
            start_date__gt=now
        ).order_by('start_date')
        
        # Lấy khuyến mãi đã hết hạn (chỉ lấy 5 khuyến mãi gần nhất để tránh quá tải)
        expired_promotions = Promotions.objects.filter(
            end_date__lt=now
        ).order_by('-end_date')[:5]
        
        # Format dữ liệu để phù hợp với Promotions.js component
        def format_promotions(promotions_queryset):
            formatted_promos = []
            for promo in promotions_queryset:
                # Lấy thêm thông tin sản phẩm từ bảng ProductPromotions nếu cần
                product_promos = ProductPromotions.objects.filter(promotion=promo, product__isnull=False).first()
                product_image = None
                if product_promos and product_promos.product:
                    # Tìm ảnh sản phẩm
                    product_img = ProductImages.objects.filter(product=product_promos.product, is_primary=True).first()
                    if not product_img:
                        product_img = ProductImages.objects.filter(product=product_promos.product).first()
                    if product_img:
                        product_image = product_img.image_url
                
                # Tạo mã khuyến mãi giả từ ID
                promo_code = f"PROMO{promo.promotion_id}"
                
                # Format thời gian hết hạn
                expiry_text = promo.end_date.strftime("%d/%m/%Y")
                if promo.end_date < now:
                    expiry_text = f"Expired {expiry_text}"
                elif promo.start_date > now:
                    expiry_text = f"Starts {promo.start_date.strftime('%d/%m/%Y')}"
                
                formatted_promos.append({
                    'id': promo.promotion_id,
                    'title': promo.title,
                    'description': promo.description or "Enjoy special discounts with this promotion",
                    'code': promo_code,
                    'expires': expiry_text,
                    'image': promo.img_banner or product_image
                })
            
            return formatted_promos
        
        # Xử lý cả 3 loại khuyến mãi
        current = format_promotions(current_promotions)
        upcoming = format_promotions(upcoming_promotions)
        expired = format_promotions(expired_promotions)
        
        # Lấy khuyến mãi nổi bật (featured) là khuyến mãi hiện tại đầu tiên hoặc sắp tới
        featured = {}
        if current:
            featured = {
                'title': current[0]['title'],
                'description': current[0]['description'],
                'code': current[0]['code'],
                'image': current[0]['image']
            }
        elif upcoming:
            featured = {
                'title': upcoming[0]['title'],
                'description': upcoming[0]['description'],
                'code': upcoming[0]['code'],
                'image': upcoming[0]['image']
            }
        
        response_data = {
            'featured': featured,
            'promotions': {
                'current': current,
                'upcoming': upcoming,
                'expired': expired
            }
        }
        
        return Response(response_data)
    
    except Exception as e:
        print(f"Error in promotions_client: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SocialMediaUrlsViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaUrls.objects.all()
    serializer_class = SocialMediaUrlsSerializer
    permission_classes = [AllowAny]  # Allow anonymous access to social media URLs
    
    def get_object(self):
        # Always return the first record or create one if none exists
        obj, created = SocialMediaUrls.objects.get_or_create(pk=1)
        return obj
    
    def list(self, request, *args, **kwargs):
        # Always return the first record or create one if none exists
        instance, created = SocialMediaUrls.objects.get_or_create(pk=1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        # Override create to update or create the first record
        instance, created = SocialMediaUrls.objects.get_or_create(pk=1)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
        
    def update(self, request, *args, **kwargs):
        # Always update the first record
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Log the action
        admin = request.user if hasattr(request, 'user') else None
        if admin and hasattr(admin, 'admin_id'):
            AuditLog.objects.create(
                admin=admin,
                action=f"Updated social media URLs",
                table_name="SocialMediaUrls",
                record_id=instance.id
            )
            
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def faqs_frontend(request):
    """
    API endpoint cung cấp dữ liệu FAQs cho trang frontend customer support
    """
    try:
        # Lấy tất cả câu hỏi, sắp xếp theo ID tăng dần
        faqs = Faq.objects.all().order_by('faq_id')
        serializer = FaqSerializer(faqs, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in faqs_frontend: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# API riêng cho frontend client
@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def client_terms_conditions(request):
    """
    API endpoint dành cho trang Terms and Conditions của client frontend
    Trả về danh sách các điều khoản sử dụng đã sắp xếp theo ID
    """
    terms = TermsAndConditions.objects.all().order_by('id')
    serializer = TermsAndConditionsSerializer(terms, many=True)
    return Response(serializer.data)

# Endpoint để lấy chi tiết sản phẩm theo product_id
@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_details(request, product_id):
    try:
        # Tìm kiếm chi tiết sản phẩm theo product_id
        product_detail = ProductDetails.objects.get(product_id=product_id)
        
        # Trả về thông tin chi tiết sản phẩm
        data = {
            'product_detail_id': product_detail.product_detail_id,
            'product_id': product_detail.product_id,
            'specification': product_detail.specification
        }
        
        return Response(data)
    except ProductDetails.DoesNotExist:
        # Trả về thông báo nếu không tìm thấy
        return Response({"error": "Không tìm thấy thông tin chi tiết sản phẩm"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Xử lý các lỗi khác
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User session endpoints
@api_view(['POST'])
@permission_classes([AllowAny])
def update_user_activity(request):
    """
    Endpoint to update user's last activity timestamp
    """
    user = request.user
    if not hasattr(user, 'user_id'):
        return Response({'error': 'Invalid user account'}, status=status.HTTP_401_UNAUTHORIZED)
    
    current_time = int(time.time())
    session_key = f"user_session_{user.user_id}"
    
    # Get the current session data
    session_data = get_session_data(session_key)
    
    # Check if session has already timed out
    if session_data:
        last_active = session_data.get('last_active', 0)
        time_since_last_activity = current_time - last_active
        
        if time_since_last_activity > SESSION_TIMEOUT:
            # Session has already expired
            delete_session_data(session_key)
            return Response({'status': 'timeout', 'message': 'Session has timed out'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Save the current timestamp
    set_session_data(session_key, {'last_active': current_time})
    
    return Response({
        'status': 'success',
        'timestamp': current_time
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def user_logout(request):
    """
    Endpoint để đăng xuất người dùng và vô hiệu hóa token
    Hỗ trợ cả request thông thường và request từ sendBeacon
    """
    # Xác định loại request (thông thường hoặc sendBeacon)
    content_type = request.content_type.lower()
    token = None
    
    # Xử lý request từ sendBeacon (có thể là text/plain hoặc application/json)
    if 'text/plain' in content_type or 'application/octet-stream' in content_type:
        try:
            body_unicode = request.body.decode('utf-8')
            data = json.loads(body_unicode)
            token = data.get('token')
        except Exception as e:
            print(f"Lỗi khi xử lý request sendBeacon: {e}")
    else:
        # Xử lý request thông thường
        token = request.data.get('token')
        if not token:
            # Thử lấy token từ header Authorization
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
    
    # Nếu có token, vô hiệu hóa nó
    if token:
        # Lấy user_id từ token (nếu có thể)
        try:
            # Giải mã token để lấy user_id
            decoded_token = pyjwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = decoded_token.get('user_id')
            
            if user_id:
                # Xóa dữ liệu phiên
                session_key = f"user_session_{user_id}"
                delete_session_data(session_key)
                
                # Log hoạt động đăng xuất
                try:
                    # Lấy thông tin thiết bị và IP
                    ip_address = request.META.get('REMOTE_ADDR', '')
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    
                    UserActivityLog.objects.create(
                        user_id=user_id,
                        action='User logged out',
                        device=user_agent,
                        ip_address=ip_address
                    )
                except Exception as e:
                    print(f"Lỗi khi log hoạt động đăng xuất: {e}")
        except Exception as e:
            print(f"Lỗi khi giải mã token: {e}")
    
    return Response({"success": True, "message": "Đăng xuất thành công"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def careers_client(request):
    """
    API endpoint cho trang tuyển dụng trên frontend
    """
    try:
        careers = Careers.objects.all().order_by('-created_at')
        
        result = []
        for career in careers:
            # Dùng hasattr để kiểm tra xem model có thuộc tính link_cv hay không
            link_cv = getattr(career, 'link_cv', None) if hasattr(career, 'link_cv') else None
            
            result.append({
                'job_id': career.job_id,
                'title': career.title,
                'description': career.description,
                'requirements': career.requirements,
                'created_at': career.created_at.isoformat(),
                'link_cv': link_cv
            })
        
        return Response(result)
    except Exception as e:
        print(f"Lỗi khi lấy danh sách tuyển dụng: {str(e)}")
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def career_apply(request):
    """
    API endpoint để xử lý việc ứng tuyển và lưu link CV
    """
    try:
        job_id = request.data.get('job_id')
        link_cv = request.data.get('link_cv')
        applicant_name = request.data.get('applicant_name', '')
        applicant_email = request.data.get('applicant_email', '')
        
        if not job_id or not link_cv:
            return Response(
                {'detail': 'Vui lòng cung cấp đủ thông tin job_id và link_cv'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            career = Careers.objects.get(job_id=job_id)
        except Careers.DoesNotExist:
            return Response(
                {'detail': f'Không tìm thấy công việc với ID: {job_id}'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Kiểm tra định dạng URL hợp lệ
        if not link_cv.startswith('http'):
            return Response(
                {'detail': 'Link CV không hợp lệ. Vui lòng cung cấp URL đầy đủ bắt đầu bằng http/https'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tạo bản ghi mới trong bảng CareerApplications
        application = CareerApplications.objects.create(
            career=career,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            cv_link=link_cv
        )
            
        return Response({
            'success': True,
            'message': 'Đã lưu thông tin ứng tuyển thành công',
            'application_id': application.application_id
        })
        
    except Exception as e:
        print(f"Lỗi khi xử lý đơn ứng tuyển: {str(e)}")
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_career_applications(request, job_id):
    """
    API endpoint để lấy danh sách CV ứng tuyển cho một vị trí
    """
    try:
        try:
            career = Careers.objects.get(job_id=job_id)
        except Careers.DoesNotExist:
            return Response(
                {'detail': f'Không tìm thấy công việc với ID: {job_id}'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        applications = CareerApplications.objects.filter(career=career)
        serializer = CareerApplicationsSerializer(applications, many=True)
            
        return Response(serializer.data)
        
    except Exception as e:
        print(f"Lỗi khi lấy danh sách ứng tuyển: {str(e)}")
        return Response(
            {'detail': f'Lỗi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def track_user_activity(request):
    """
    API endpoint to track user activities such as page views, searches, etc.
    """
    try:
        user_id = request.data.get('user_id')
        action_type = request.data.get('action_type')  # e.g., 'page_view', 'search', 'product_view', etc.
        page_path = request.data.get('page_path', '')
        search_query = request.data.get('search_query', '')
        product_id = request.data.get('product_id', None)
        category_id = request.data.get('category_id', None)
        
        # Validate required fields
        if not user_id or not action_type:
            return Response({
                'detail': 'Missing required fields: user_id and action_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get device and IP info
        ip_address = request.META.get('REMOTE_ADDR', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Format action message based on action type
        action_message = ''
        if action_type == 'page_view':
            action_message = f"Viewed page: {page_path}"
        elif action_type == 'search':
            action_message = f"Searched for: {search_query}"
        elif action_type == 'product_view':
            action_message = f"Viewed product ID: {product_id}"
        elif action_type == 'category_view':
            action_message = f"Viewed category ID: {category_id}"
        else:
            action_message = f"{action_type}: {page_path or search_query}"
        
        # Create activity log entry
        UserActivityLog.objects.create(
            user_id=user_id,
            action=action_message,
            device=user_agent,
            ip_address=ip_address
        )
        
        return Response({
            'success': True,
            'message': 'Activity logged successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error tracking user activity: {str(e)}")
        return Response({
            'detail': f"Error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def subscribe_newsletter(request):
    """API endpoint để đăng ký nhận bản tin"""
    try:
        email = request.data.get('email', '')
        
        # Validate email
        if not email or '@' not in email:
            return Response({'error': 'Vui lòng cung cấp địa chỉ email hợp lệ'}, status=400)
        
        # Check if email already exists
        if NewsletterSubscribers.objects.filter(email=email).exists():
            return Response({'error': 'Email này đã đăng ký nhận bản tin'}, status=400)
        
        # Create new subscriber
        subscriber = NewsletterSubscribers(email=email)
        subscriber.save()
        
        return Response({
            'message': 'Đăng ký nhận bản tin thành công!',
            'email': email
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def newsletter_subscribers_list(request):
    """
    API endpoint to get the list of newsletter subscribers
    """
    try:
        subscribers = NewsletterSubscribers.objects.all().order_by('-created_at')
        serializer = NewsletterSubscriberSerializer(subscribers, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error getting newsletter subscribers: {str(e)}")
        return Response(
            {"error": f"Error getting newsletter subscribers: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )