import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface PermissionRouteProps {
    children: ReactNode;
    pageName: string;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, pageName }) => {
    const { isAuthenticated, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra quyền truy cập trang
    const canAccessPage = hasPermission(pageName, 'read');
    
    if (!canAccessPage) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                padding={3}
                textAlign="center"
            >
                <Typography variant="h4" color="error" gutterBottom>
                    Không có quyền truy cập
                </Typography>
                <Typography variant="body1">
                    Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên để được cấp quyền.
                </Typography>
            </Box>
        );
    }

    return <>{children}</>;
};

export default PermissionRoute; 