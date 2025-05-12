from rest_framework import permissions

class IsAdminOrSelf(permissions.BasePermission):
    """
    Custom permission để cho phép admin chỉnh sửa thông tin của chính mình
    """
    def has_permission(self, request, view):
        # Super Admin luôn có toàn quyền
        if request.user.role == 'Super Admin':
            return True
            
        # Các admin khác được phép xem danh sách và thêm mới
        if view.action in ['list', 'create']:
            return True
            
        # Các thao tác khác sẽ kiểm tra ở has_object_permission
        return True
        
    def has_object_permission(self, request, view, obj):
        # Super Admin luôn có toàn quyền
        if request.user.role == 'Super Admin':
            return True
        
        # Admin thường chỉ có thể sửa thông tin của chính mình
        return obj.admin_id == request.user.admin_id 