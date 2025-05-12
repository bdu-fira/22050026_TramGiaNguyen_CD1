import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, checkAuth, getPermissions } from '../services/api';
import { Admin, LoginRequest, Permission } from '../types';
import { useSnackbar } from 'notistack';
import { initSessionManager, SessionManager } from '../utils/sessionManager';

// Định nghĩa kiểu dữ liệu cho thông tin quyền
interface UserPermissions {
    [key: string]: {
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
    };
}

// Định nghĩa kiểu dữ liệu cho context
interface AuthContextType {
    isAuthenticated: boolean;
    admin: Admin | null;
    permissions: UserPermissions;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    loading: boolean;
    hasPermission: (pageName: string, action?: 'create' | 'read' | 'update' | 'delete') => boolean;
    sessionManager: SessionManager | null;
}

// Tạo context
const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    admin: null,
    permissions: {},
    login: async () => {},
    logout: () => {},
    loading: true,
    hasPermission: () => false,
    sessionManager: null
});

// Hook để sử dụng context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({});
    const [loading, setLoading] = useState(true);
    const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // Hàm đăng xuất
    const logout = () => {
        // Clean up session manager
        if (sessionManager) {
            sessionManager.cleanup();
        }
        
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        localStorage.removeItem('permissions');
        localStorage.removeItem('lastActivityUpdate');
        sessionStorage.clear(); // Clear session storage too
        
        // Clear state
        setAdmin(null);
        setPermissions({});
        
        // Add a flag in session storage to prevent back navigation
        sessionStorage.setItem('session_expired', 'true');
        
        // Replace history so back button won't work
        window.history.replaceState(null, '', '/login');
        
        // Navigate to login
        navigate('/login', { replace: true });
        
        enqueueSnackbar('Bạn đã bị đăng xuất do không hoạt động trong thời gian dài', { 
            variant: 'warning' 
        });
    };

    // Initialize session manager
    useEffect(() => {
        if (admin && !sessionManager) {
            const manager = initSessionManager(logout);
            setSessionManager(manager);
            manager.init();
            // Lưu ý: Tính năng tự động đăng xuất sau 5 phút không hoạt động đã bị vô hiệu hóa
        }
    }, [admin, sessionManager]);

    // Kiểm tra phiên làm việc khi quay lại trang
    useEffect(() => {
        // Check if session was expired before
        const sessionExpired = sessionStorage.getItem('session_expired');
        if (sessionExpired === 'true') {
            // If on login page, clear the flag
            if (window.location.pathname === '/login') {
                sessionStorage.removeItem('session_expired');
            } else {
                // If not on login page but session was expired, force to login
                navigate('/login', { replace: true });
            }
        }
    }, [navigate]);

    // Hàm để tải quyền từ API
    const loadPermissions = async (adminId: number) => {
        try {
            const response = await getPermissions();
            const userPermissions = response.data.filter((perm: Permission) => perm.admin === adminId);
            
            // Chuyển đổi danh sách quyền thành đối tượng với key là tên trang
            const formattedPermissions: UserPermissions = {};
            userPermissions.forEach((perm: Permission) => {
                formattedPermissions[perm.table_name] = {
                    canCreate: perm.can_create,
                    canRead: perm.can_read,
                    canUpdate: perm.can_update,
                    canDelete: perm.can_delete
                };
            });
            
            // Lưu vào state và localStorage
            setPermissions(formattedPermissions);
            localStorage.setItem('permissions', JSON.stringify(formattedPermissions));
            
            return formattedPermissions;
        } catch (error) {
            console.error('Lỗi khi tải quyền người dùng:', error);
            return {};
        }
    };

    // Kiểm tra xem đã đăng nhập chưa
    useEffect(() => {
        const checkAuthentication = async () => {
            // If session was marked as expired, don't attempt to restore auth state
            const sessionExpired = sessionStorage.getItem('session_expired');
            if (sessionExpired === 'true') {
                setLoading(false);
                return;
            }
            
            const token = localStorage.getItem('token');
            const adminData = localStorage.getItem('admin');
            const permissionsData = localStorage.getItem('permissions');
            
            if (token && adminData) {
                try {
                    const parsedAdmin = JSON.parse(adminData);
                    setAdmin(parsedAdmin);
                    
                    // Tải quyền từ localStorage nếu có
                    if (permissionsData) {
                        setPermissions(JSON.parse(permissionsData));
                    } else if (parsedAdmin) {
                        // Nếu không có trong localStorage, tải từ API
                        await loadPermissions(parsedAdmin.admin_id);
                    }
                    
                    // Validate token with server and force logout if invalid
                    checkAuth().catch(err => {
                        console.warn('Lỗi kiểm tra xác thực:', err);
                        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                            logout();
                        }
                    });
                } catch (error) {
                    console.error('Lỗi xác thực:', error);
                    // Chỉ xóa dữ liệu nếu có lỗi phân tích JSON
                    localStorage.removeItem('token');
                    localStorage.removeItem('admin');
                    localStorage.removeItem('permissions');
                    setAdmin(null);
                    setPermissions({});
                }
            }
            
            setLoading(false);
        };
        
        checkAuthentication();
        
        // Clean up session manager when component unmounts
        return () => {
            if (sessionManager) {
                sessionManager.cleanup();
            }
        };
    }, []);

    // Hàm kiểm tra quyền
    const hasPermission = (pageName: string, action: 'create' | 'read' | 'update' | 'delete' = 'read') => {
        // Super Admin luôn có tất cả các quyền
        if (admin?.role === 'Super Admin') return true;
        
        // Nếu không có thông tin quyền, không cho phép
        if (!permissions || Object.keys(permissions).length === 0) return false;
        
        // Kiểm tra quyền cho trang
        const pagePermission = permissions[pageName];
        if (!pagePermission) return false;
        
        // Kiểm tra quyền cụ thể
        switch (action) {
            case 'create': return pagePermission.canCreate;
            case 'read': return pagePermission.canRead;
            case 'update': return pagePermission.canUpdate;
            case 'delete': return pagePermission.canDelete;
            default: return pagePermission.canRead;
        }
    };

    // Hàm đăng nhập
    const login = async (credentials: LoginRequest) => {
        try {
            // Clear any previous session expiry flag
            sessionStorage.removeItem('session_expired');
            
            setLoading(true);
            const response = await apiLogin(credentials);
            const { token, admin } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('admin', JSON.stringify(admin));
            localStorage.setItem('lastActivityUpdate', Date.now().toString());
            
            setAdmin(admin);
            
            // Tải quyền sau khi đăng nhập
            await loadPermissions(admin.admin_id);
            
            navigate('/dashboard');
            
            enqueueSnackbar('Đăng nhập thành công!', { 
                variant: 'success' 
            });
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            enqueueSnackbar('Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.', { 
                variant: 'error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!admin,
            admin,
            permissions,
            login,
            logout,
            loading,
            hasPermission,
            sessionManager
        }}>
            {children}
        </AuthContext.Provider>
    );
}; 