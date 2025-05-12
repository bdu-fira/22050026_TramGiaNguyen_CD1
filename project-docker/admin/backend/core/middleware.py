import jwt as pyjwt
import time
import json
from django.conf import settings
from django.http import JsonResponse
from .models import Admin

class SessionTimeoutMiddleware:
    """
    Middleware to track admin session activity and enforce a 5-minute timeout
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for login path
        if request.path == '/api/login/':
            return self.get_response(request)
            
        # Check for activity timestamp for admin paths
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            try:
                # Try to decode the token to get admin_id
                payload = pyjwt.decode(
                    token, 
                    settings.SECRET_KEY, 
                    algorithms=['HS256'],
                    options={"verify_exp": False}
                )
                
                admin_id = payload.get('admin_id')
                
                # If this is an admin user, check/update the last activity
                if admin_id:
                    current_time = int(time.time())
                    session_key = f"admin_session_{admin_id}"
                    
                    # Check if we need to get session data from Redis/storage
                    from .views import get_session_data, set_session_data, SESSION_TIMEOUT, delete_session_data
                    
                    # Get last activity time
                    session_data = get_session_data(session_key)
                    
                    # Check session timeout except for checking status or updating activity endpoints
                    if session_data and not (request.path == '/api/admin-session/check/' or request.path == '/api/admin-session/update/'):
                        last_active = session_data.get('last_active', 0)
                        time_since_last_activity = current_time - last_active
                        
                        # If session has timed out, return 401
                        if time_since_last_activity > SESSION_TIMEOUT:
                            delete_session_data(session_key)
                            return JsonResponse({
                                'status': 'timeout',
                                'message': 'Your session has timed out. Please login again.'
                            }, status=401)
                    
                    # Update the last activity timestamp in the request
                    request.last_active = current_time
                    
                    # Store the session key for later use
                    request.session_key = session_key
                    
            except Exception as e:
                print(f"Session middleware error: {str(e)}")
                # Continue processing even if token is invalid
                pass
        
        response = self.get_response(request)
        return response

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Tạm thời bỏ qua middleware vì đã dùng custom authentication class
        return self.get_response(request)
        
        # Danh sách các đường dẫn không cần xác thực
        exempt_paths = [
            '/api/login/',
            '/admin/',
            '/api-auth/',
        ]
        
        # Bỏ qua xác thực cho các đường dẫn không cần xác thực
        if any(request.path.startswith(path) for path in exempt_paths):
            return self.get_response(request)
        
        # Kiểm tra token trong header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Không có token hoặc token không hợp lệ'}, status=401)
        
        token = auth_header.split(' ')[1]
        
        try:
            # Giải mã token mà không kiểm tra hết hạn
            payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'], options={"verify_exp": False})
            admin_id = payload.get('admin_id')
            
            if not admin_id:
                return JsonResponse({'error': 'Token không hợp lệ'}, status=401)
            
            # Lấy admin từ database
            try:
                admin = Admin.objects.get(admin_id=admin_id)
                if not admin.is_active:
                    return JsonResponse({'error': 'Tài khoản đã bị vô hiệu hóa'}, status=401)
                request.user = admin
            except Admin.DoesNotExist:
                return JsonResponse({'error': 'Người dùng không tồn tại'}, status=401)
        except pyjwt.InvalidTokenError:
            return JsonResponse({'error': 'Token không hợp lệ'}, status=401)
            
        return self.get_response(request) 