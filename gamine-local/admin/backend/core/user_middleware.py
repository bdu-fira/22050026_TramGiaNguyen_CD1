import jwt as pyjwt
import time
import json
from django.conf import settings
from django.http import JsonResponse
from .models import Users

class UserSessionTimeoutMiddleware:
    """
    Middleware to track user session activity and enforce a 5-minute timeout
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for login or register paths
        if request.path == '/api/customer/login/' or request.path == '/api/customer/register/':
            return self.get_response(request)
            
        # Check for activity timestamp for user API paths
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            try:
                # Try to decode the token to get user_id
                payload = pyjwt.decode(
                    token, 
                    settings.SECRET_KEY, 
                    algorithms=['HS256'],
                    options={"verify_exp": False}
                )
                
                user_id = payload.get('user_id')
                
                # If this is a user, check/update the last activity
                if user_id:
                    # Import functions here to avoid circular imports
                    from .views import get_session_data, set_session_data, SESSION_TIMEOUT, delete_session_data
                    
                    current_time = int(time.time())
                    session_key = f"user_session_{user_id}"
                    
                    # Get last activity time
                    session_data = get_session_data(session_key)
                    
                    # Check session timeout except for checking status or updating activity endpoints
                    if session_data and not (request.path == '/api/user-session/check/' or request.path == '/api/user-session/update/'):
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
                    request.session_key = session_key
                    
            except Exception as e:
                print(f"User session middleware error: {str(e)}")
                # Continue processing even if token is invalid
                pass
        
        response = self.get_response(request)
        return response