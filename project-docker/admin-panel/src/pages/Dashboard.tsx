import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Paper, CircularProgress, Card, CardHeader, CardContent, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import Layout from '../components/Layout';
import { getDashboardStats } from '../services/api';
import { DashboardStats } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [revenueView, setRevenueView] = useState<'month' | 'quarter'>('month');

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
        if (amount === undefined || amount === null) return '0 VNĐ';
        // Đảm bảo giá trị đủ lớn để hiển thị đúng (nếu đang ở định dạng đơn vị nhỏ)
        // Nếu giá < 1000 thì nhân nó lên với 1,000,000 (có thể dữ liệu đang lưu ở đơn vị triệu)
        const adjustedAmount = amount < 1000 ? amount * 1000000 : amount;
        // Làm tròn số để loại bỏ phần thập phân
        const roundedAmount = Math.round(adjustedAmount);
        return new Intl.NumberFormat('vi-VN', { 
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(roundedAmount) + ' VNĐ';
    };

    // Format số không có đơn vị tiền tệ (chỉ có phân cách hàng nghìn)
    const formatNumber = (amount: number) => {
        if (amount === undefined || amount === null) return '0 VNĐ';
        // Làm tròn số để loại bỏ phần thập phân
        const roundedAmount = Math.round(amount);
        return new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(roundedAmount) + ' VNĐ';
    };

    // Màu sắc cho biểu đồ
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

    // Handle view change
    const handleRevenueViewChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: 'month' | 'quarter' | null,
    ) => {
        if (newView !== null) {
            setRevenueView(newView);
        }
    };

    // Process quarterly data
    const getQuarterlyData = () => {
        if (!stats?.monthly_revenue) return [];
        
        const quarterlyData = [
            { quarter: 'Q1', revenue: 0 },
            { quarter: 'Q2', revenue: 0 },
            { quarter: 'Q3', revenue: 0 },
            { quarter: 'Q4', revenue: 0 }
        ];
        
        stats.monthly_revenue.forEach(item => {
            const month = parseInt(item.month);
            if (month >= 1 && month <= 3) {
                quarterlyData[0].revenue += item.revenue;
            } else if (month >= 4 && month <= 6) {
                quarterlyData[1].revenue += item.revenue;
            } else if (month >= 7 && month <= 9) {
                quarterlyData[2].revenue += item.revenue;
            } else if (month >= 10 && month <= 12) {
                quarterlyData[3].revenue += item.revenue;
            }
        });
        
        return quarterlyData;
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
                    <>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
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

                        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
                            {/* Biểu đồ doanh thu theo tháng */}
                            <Box gridColumn={{ xs: "span 12", md: "span 8" }}>
                                <Card>
                                    <CardHeader 
                                        title="Doanh thu" 
                                        action={
                                            <ToggleButtonGroup
                                                value={revenueView}
                                                exclusive
                                                onChange={handleRevenueViewChange}
                                                size="small"
                                            >
                                                <ToggleButton value="month">
                                                    Theo tháng
                                                </ToggleButton>
                                                <ToggleButton value="quarter">
                                                    Theo quý
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        }
                                    />
                                    <Divider />
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            {revenueView === 'month' ? (
                                                <LineChart
                                                    data={stats?.monthly_revenue || []}
                                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis tickFormatter={(value) => formatCurrency(value).split(' VNĐ')[0]} />
                                                    <Tooltip 
                                                        formatter={(value: any) => [formatCurrency(value), "Doanh thu"]} 
                                                        labelFormatter={(label) => `Tháng ${label}`}
                                                    />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Doanh thu" />
                                                </LineChart>
                                            ) : (
                                                <LineChart
                                                    data={getQuarterlyData()}
                                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="quarter" />
                                                    <YAxis tickFormatter={(value) => formatCurrency(value).split(' VNĐ')[0]} />
                                                    <Tooltip 
                                                        formatter={(value: any) => [formatCurrency(value), "Doanh thu"]} 
                                                        labelFormatter={(label) => `${label}`}
                                                    />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Doanh thu" />
                                                </LineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Biểu đồ người dùng mới và tổng số */}
                            <Box gridColumn={{ xs: "span 12", md: "span 4" }}>
                                <Card>
                                    <CardHeader title="Số liệu người dùng" />
                                    <Divider />
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="subtitle1">Tổng số người dùng</Typography>
                                                <Typography variant="h4">{stats?.total_users || 0}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1">Người dùng mới</Typography>
                                                <Typography variant="h4">{stats?.new_users_count || 0}</Typography>
                                                <Box sx={{ width: '100%', mt: 1 }}>
                                                    <ResponsiveContainer width="100%" height={100}>
                                                        <BarChart data={[{ name: 'Mới', value: stats?.new_users_count || 0 }, { name: 'Hiện tại', value: (stats?.total_users || 0) - (stats?.new_users_count || 0) }]}>
                                                            <XAxis dataKey="name" />
                                                            <Tooltip />
                                                            <Bar dataKey="value" fill="#8884d8" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Biểu đồ trạng thái đơn hàng */}
                            <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                <Card>
                                    <CardHeader title="Trạng thái đơn hàng" />
                                    <Divider />
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={stats?.order_status_counts || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="count"
                                                    nameKey="order_status"
                                                >
                                                    {stats?.order_status_counts?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    )) || []}
                                                </Pie>
                                                <Tooltip formatter={(value, name, props) => [value, props.payload.order_status]} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Top sản phẩm bán chạy */}
                            <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                <Card>
                                    <CardHeader title="Top sản phẩm bán chạy" />
                                    <Divider />
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart
                                                data={stats?.top_products?.slice(0, 5).map(product => ({
                                                    ...product,
                                                    // Chuyển giá về kiểu chuỗi để tránh vấn đề định dạng
                                                    nameWithPrice: `${product.name} - Giá: ${formatCurrency(product.price)}`
                                                })) || []}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                layout="vertical"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis type="category" dataKey="name" width={150} />
                                                <Tooltip 
                                                    formatter={(value, name, props) => {
                                                        if (name === 'sold_quantity') {
                                                            return [`${value} đã bán`, 'Số lượng'];
                                                        }
                                                        // Lấy thông tin giá từ product trong payload
                                                        const product = props.payload;
                                                        return [formatCurrency(product.price), 'Giá bán'];
                                                    }}
                                                    labelFormatter={(name) => `${name}`}
                                                />
                                                <Legend />
                                                <Bar dataKey="sold_quantity" name="Số lượng đã bán" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Biểu đồ phân tích giá sản phẩm */}
                            <Box gridColumn="span 12">
                                <Card>
                                    <CardHeader title="Phân tích giá sản phẩm top bán chạy" />
                                    <Divider />
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart
                                                data={stats?.top_products?.slice(0, 10) || []}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(value) => formatCurrency(value).split(' VNĐ')[0]} />
                                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                                <Tooltip 
                                                    formatter={(value, name, props) => {
                                                        if (name === 'price') {
                                                            return [formatCurrency(Number(value)), 'Giá gốc'];
                                                        }
                                                        if (name === 'discounted_price') {
                                                            // Get discounted price from payload
                                                            const product = props.payload;
                                                            return [formatCurrency(Number(product.discounted_price)), 'Giá khuyến mãi'];
                                                        }
                                                        if (name === 'sold_quantity') {
                                                            const product = props.payload;
                                                            return [`${product.sold_quantity} đã bán`, 'Số lượng'];
                                                        }
                                                        return [value, name];
                                                    }}
                                                />
                                                <Legend />
                                                <Bar yAxisId="left" dataKey="price" name="Giá gốc" fill="#8884d8" />
                                                <Bar yAxisId="left" dataKey="discounted_price" name="Giá khuyến mãi" fill="#82ca9d" />
                                                <Bar yAxisId="right" dataKey="sold_quantity" name="Số lượng đã bán" fill="#FF8042" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Layout>
    );
};

export default Dashboard; 