from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from django.db.models import Q
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

import jwt as pyjwt

from .models import Admin, Users

class AdminAuthBackend(BaseBackend):
    """
    Custom authentication backend for Admin model
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            admin = Admin.objects.get(username=username)
            if admin.check_password(password):
                return admin
        except Admin.DoesNotExist:
            return None
        
        return None
    
    def get_user(self, user_id):
        try:
            return Admin.objects.get(pk=user_id)
        except Admin.DoesNotExist:
            return None

class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT Authentication for Admin and Users
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        print(f"Đang xử lý token: {token}")
        
        # Xử lý token tùy chỉnh định dạng "user_id_hash"
        if token.startswith('user_'):
            try:
                # Extract user_id từ token format: user_id_hash
                parts = token.split('_')
                print(f"Phân tích token user: {parts}")
                if len(parts) >= 2:
                    user_id = int(parts[1])
                    print(f"Tìm user_id={user_id}")
                    user = Users.objects.get(user_id=user_id)
                    print(f"Đã tìm thấy user: {user.username}")
                    return (user, token)
                return None
            except (ValueError, Users.DoesNotExist) as e:
                print(f"Lỗi xác thực user token: {str(e)}")
                return None
        
        # Xử lý JWT token tiêu chuẩn (cho admin)
        try:
            payload = pyjwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256'],
                options={"verify_exp": False}  # Bỏ qua kiểm tra hết hạn
            )
            admin_id = payload.get('admin_id')
            
            if admin_id is None:
                print("Token không có admin_id")
                return None
            
            admin = Admin.objects.get(admin_id=admin_id)
            return (admin, token)
        except pyjwt.exceptions.PyJWTError as e:
            print(f"Lỗi JWT: {str(e)}")
            pass  # Nếu không phải là JWT hợp lệ, thử các phương thức khác
        except Admin.DoesNotExist:
            print("Admin không tồn tại")
            return None
        
        return None