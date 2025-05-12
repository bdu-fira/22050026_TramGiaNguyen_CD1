import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Paper, CircularProgress } from '@mui/material';
import Layout from '../components/Layout';
import { getDashboardStats } from '../services/api';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                const response = await getDashboardStats();
                setStats(response.data);
            } catch (err) {
                console.error("Lỗi khi lấy thông tin dashboard:", err);
                setError("Không thể lấy thông tin dashboard. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    // Format số tiền
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Chào mừng đến với trang quản trị
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                    Đây là trang quản trị Gamine. Từ đây bạn có thể quản lý tất cả các khía cạnh của trang web.
                </Typography>
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Paper sx={{ p: 2, flex: 1 }}>
                            <Typography variant="h6">Người dùng</Typography>
                            <Typography variant="h4">{stats?.total_users || 0}</Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1 }}>
                            <Typography variant="h6">Đơn hàng</Typography>
                            <Typography variant="h4">{stats?.total_orders || 0}</Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1 }}>
                            <Typography variant="h6">Sản phẩm</Typography>
                            <Typography variant="h4">{stats?.total_products || 0}</Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1 }}>
                            <Typography variant="h6">Doanh thu</Typography>
                            <Typography variant="h4">{formatCurrency(stats?.total_revenue || 0)}</Typography>
                        </Paper>
                    </Stack>
                )}
            </Box>
        </Layout>
    );
};

export default Dashboard; 