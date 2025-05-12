import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, 
    TextField, MenuItem, Select, FormControl, InputLabel, Chip, Tooltip,
    Divider, List, ListItem, ListItemText, Tabs, Tab, FormHelperText,
    SelectChangeEvent, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Layout from '../components/Layout';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getProducts, getUsers, getUser } from '../services/api';
import { Order, Product, User, OrderDetail, Payment } from '../types';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`order-tabpanel-${index}`}
            aria-labelledby={`order-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Định dạng số tiền
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Định dạng ngày giờ
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

// Lấy màu cho trạng thái đơn hàng
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Pending':
            return 'warning';
        case 'Processing':
            return 'info';
        case 'In transit':
            return 'primary';
        case 'Completed':
            return 'success';
        case 'Cancelled':
            return 'error';
        default:
            return 'default';
    }
};

const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
    
    // Form data cho đơn hàng
    const [formData, setFormData] = useState({
        user: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        total_amount: 0,
        order_status: 'Pending',
        payment_method: 'Cash on Delivery',
        payment_status: 'Pending'
    });
    
    // Form data cho chi tiết đơn hàng đang thêm
    const [detailForm, setDetailForm] = useState({
        product: '',
        quantity: 1,
        price: 0
    });
    
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchOrders();
        fetchProducts();
        fetchUsers();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu đơn hàng:', error);
            enqueueSnackbar('Không thể lấy danh sách đơn hàng', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const fetchProducts = async () => {
        try {
            const response = await getProducts(0, 1000);
            setProducts(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu sản phẩm:', error);
        }
    };
    
    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu người dùng:', error);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOpenDialog = (order?: Order) => {
        if (order) {
            setEditingOrder(order);
            setFormData({
                user: order.user ? String(order.user) : '',
                customer_name: order.customer_name || '',
                customer_email: order.customer_email || '',
                customer_phone: order.customer_phone || '',
                shipping_address: order.shipping_address || '',
                total_amount: order.total_amount,
                order_status: order.order_status,
                payment_method: order.payment_method || 'Cash on Delivery',
                payment_status: 'Pending'
            });
            setOrderDetails([...order.details]);
        } else {
            setEditingOrder(null);
            setFormData({
                user: '',
                customer_name: '',
                customer_email: '',
                customer_phone: '',
                shipping_address: '',
                total_amount: 0,
                order_status: 'Pending',
                payment_method: 'Cash on Delivery',
                payment_status: 'Pending'
            });
            setOrderDetails([]);
        }
        setOpenDialog(true);
        setTabValue(0);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingOrder(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        if (name) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            
            // Nếu chọn user, lấy thông tin khách hàng
            if (name === 'user' && value) {
                fetchUserDetails(Number(value));
            }
        }
    };
    
    // Hàm mới để xử lý sự kiện onChange cho các component Select
    const handleSelectChange = (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
        const name = event.target.name;
        const value = event.target.value;
        
        if (name) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            
            // Nếu chọn user, lấy thông tin khách hàng
            if (name === 'user' && value) {
                fetchUserDetails(Number(value));
            }
        }
    };
    
    const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        
        if (name === 'product') {
            // Khi người dùng chọn sản phẩm, lấy thông tin giá sản phẩm
            const selectedProduct = products.find(p => p.product_id.toString() === value);
            if (selectedProduct) {
                // Sử dụng giá khuyến mãi nếu có, ngược lại dùng giá gốc
                const price = selectedProduct.discounted_price !== undefined && selectedProduct.discounted_price !== null
                    ? selectedProduct.discounted_price 
                    : selectedProduct.price;
                
                console.log('Selected product:', selectedProduct.name);
                console.log('Price set to:', price, 'Type:', typeof price);
                
                setDetailForm(prev => ({
                    ...prev,
                    product: value as string,
                    price: Number(price) // Chuyển đổi thành kiểu number
                }));
                return;
            }
        }
        
        setDetailForm(prev => ({
            ...prev,
            [name as string]: name === 'price' || name === 'quantity' ? Number(value) : value
        }));
    };
    
    // Hàm mới để xử lý sự kiện onChange cho component Select trong chi tiết sản phẩm
    const handleDetailSelectChange = (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
        const name = event.target.name;
        const value = event.target.value;
        
        if (name === 'product') {
            // Khi người dùng chọn sản phẩm, lấy thông tin giá sản phẩm
            const selectedProduct = products.find(p => p.product_id.toString() === value);
            if (selectedProduct) {
                // Sử dụng giá khuyến mãi nếu có, ngược lại dùng giá gốc
                const price = selectedProduct.discounted_price !== undefined && selectedProduct.discounted_price !== null
                    ? selectedProduct.discounted_price 
                    : selectedProduct.price;
                
                console.log('Selected product:', selectedProduct.name);
                console.log('Price set to:', price, 'Type:', typeof price);
                
                setDetailForm(prev => ({
                    ...prev,
                    product: value as string,
                    price: Number(price) // Chuyển đổi thành kiểu number
                }));
                return;
            }
        }
        
        setDetailForm(prev => ({
            ...prev,
            [name as string]: name === 'price' || name === 'quantity' ? Number(value) : value
        }));
    };
    
    const handleAddDetail = () => {
        if (!detailForm.product) {
            enqueueSnackbar('Vui lòng chọn sản phẩm', { variant: 'error' });
            return;
        }
        
        if (detailForm.quantity <= 0) {
            enqueueSnackbar('Số lượng phải lớn hơn 0', { variant: 'error' });
            return;
        }
        
        const selectedProduct = products.find(p => p.product_id === Number(detailForm.product));
        if (!selectedProduct) return;
        
        // Lấy giá từ detailForm - đây là giá đã cập nhật khi chọn sản phẩm
        const price = detailForm.price;
        
        const newDetail: OrderDetail = {
            order_detail_id: Math.random(), // Temporary ID for UI
            product: selectedProduct.product_id,
            product_name: selectedProduct.name,
            quantity: Number(detailForm.quantity),
            price: price
        };
        
        console.log('Adding product to order with price:', price);
        
        setOrderDetails(prev => [...prev, newDetail]);
        
        // Cập nhật tổng tiền
        const newTotal = orderDetails.reduce((sum, detail) => 
            sum + (detail.quantity * detail.price), 0) + (newDetail.quantity * newDetail.price);
        
        setFormData(prev => ({
            ...prev,
            total_amount: newTotal
        }));
        
        // Reset form
        setDetailForm({
            product: '',
            quantity: 1,
            price: 0
        });
    };
    
    const handleRemoveDetail = (detailId: number) => {
        const detailToRemove = orderDetails.find(d => d.order_detail_id === detailId);
        if (!detailToRemove) return;
        
        setOrderDetails(prev => prev.filter(d => d.order_detail_id !== detailId));
        
        // Cập nhật tổng tiền
        const newTotal = orderDetails
            .filter(d => d.order_detail_id !== detailId)
            .reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);
        
        setFormData(prev => ({
            ...prev,
            total_amount: newTotal
        }));
    };

    // Hàm lấy thông tin người dùng
    const fetchUserDetails = async (userId: number) => {
        try {
            const response = await getUser(userId);
            const userData = response.data;
            
            // Cập nhật thông tin người dùng vào form
            setFormData(prev => ({
                ...prev,
                customer_name: userData.username || '',
                customer_email: userData.email || '',
                customer_phone: userData.phone || '',
                shipping_address: userData.address || ''
            }));
        } catch (error) {
            console.error('Không thể lấy thông tin người dùng:', error);
        }
    };

    const handleSubmit = async () => {
        // Kiểm tra dữ liệu
        if (orderDetails.length === 0) {
            enqueueSnackbar('Đơn hàng phải có ít nhất một sản phẩm', { variant: 'error' });
            return;
        }
        
        // Nếu không chọn user thì phải có thông tin khách hàng
        if (!formData.user && !formData.customer_name) {
            enqueueSnackbar('Vui lòng chọn khách hàng hoặc nhập thông tin khách hàng', { variant: 'error' });
            return;
        }
        
        try {
            const orderData: any = {
                user: formData.user ? Number(formData.user) : null,
                customer_name: formData.customer_name || null,
                customer_email: formData.customer_email || null,
                customer_phone: formData.customer_phone || null,
                shipping_address: formData.shipping_address || null,
                total_amount: formData.total_amount,
                order_status: formData.order_status,
                details: orderDetails.map(detail => ({
                    product: detail.product,
                    quantity: detail.quantity,
                    price: detail.price
                }))
            };
            
            // Thêm thông tin thanh toán
            const paymentData = {
                payment_method: formData.payment_method,
                payment_status: formData.payment_status || 'Pending'
            };

            // Kiểm tra xem có phải chuyển sang trạng thái Completed
            const isCompletedOrder = formData.order_status === 'Completed';
            const wasCompletedBefore = editingOrder?.order_status === 'Completed';
            
            if (editingOrder) {
                // Cập nhật đơn hàng với thông tin thanh toán
                orderData.payment = paymentData;
                await updateOrder(editingOrder.order_id, orderData);
                enqueueSnackbar('Cập nhật đơn hàng thành công!', { variant: 'success' });
                
                // Thông báo nếu đơn hàng được đánh dấu hoàn thành
                if (isCompletedOrder && !wasCompletedBefore) {
                    enqueueSnackbar('Đơn hàng đã được đánh dấu hoàn thành, kho hàng sẽ được cập nhật tự động.', { variant: 'info' });
                }
            } else {
                // Tạo đơn hàng mới với thông tin thanh toán
                orderData.payment = paymentData;
                const response = await createOrder(orderData);
                enqueueSnackbar('Tạo đơn hàng mới thành công!', { variant: 'success' });
                
                // Thông báo nếu đơn hàng mới có trạng thái Completed
                if (isCompletedOrder) {
                    enqueueSnackbar('Đơn hàng mới đã được đánh dấu hoàn thành, kho hàng sẽ được cập nhật tự động.', { variant: 'info' });
                }
            }
            
            handleCloseDialog();
            fetchOrders();
        } catch (error: any) {
            console.error('Lỗi khi lưu đơn hàng:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu đơn hàng', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
            try {
                await deleteOrder(id);
                enqueueSnackbar('Xóa đơn hàng thành công!', { variant: 'success' });
                fetchOrders();
            } catch (error) {
                console.error('Lỗi khi xóa đơn hàng:', error);
                enqueueSnackbar('Không thể xóa đơn hàng', { variant: 'error' });
            }
        }
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Quản lý đơn hàng
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleOpenDialog()}
                    sx={{ mb: 2 }}
                >
                    Tạo đơn hàng mới
                </Button>
                
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Khách hàng</TableCell>
                                <TableCell>Tổng tiền</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell>Sản phẩm</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.order_id}>
                                        <TableCell>{order.order_id}</TableCell>
                                        <TableCell>
                                            {order.username || order.customer_name || 'Khách vãng lai'}
                                            {order.customer_email && (
                                                <Typography variant="body2" color="textSecondary">
                                                    {order.customer_email}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={order.order_status} 
                                                color={getStatusColor(order.order_status) as any}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(order.created_at)}</TableCell>
                                        <TableCell>
                                            {order.details.length} sản phẩm
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(order)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(order.order_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Đơn hàng */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editingOrder ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới'}
                    </DialogTitle>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Thông tin đơn hàng" />
                            <Tab label="Chi tiết sản phẩm" />
                        </Tabs>
                    </Box>
                    <DialogContent>
                        <TabPanel value={tabValue} index={0}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Loại đơn hàng
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Box>
                                
                                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="user-label">Khách hàng có tài khoản</InputLabel>
                                        <Select
                                            labelId="user-label"
                                            name="user"
                                            value={formData.user}
                                            label="Khách hàng có tài khoản"
                                            onChange={handleSelectChange}
                                        >
                                            <MenuItem value="">
                                                <em>Không chọn (Khách không có tài khoản)</em>
                                            </MenuItem>
                                            {users.map(user => (
                                                <MenuItem key={user.user_id} value={user.user_id}>
                                                    {user.username} - {user.email}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>
                                            Nếu chọn khách hàng có tài khoản, các thông tin bên dưới sẽ được bỏ qua
                                        </FormHelperText>
                                    </FormControl>
                                </Box>
                                
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Thông tin khách hàng không có tài khoản
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                                        <TextField
                                            fullWidth
                                            label="Tên khách hàng"
                                            name="customer_name"
                                            value={formData.customer_name}
                                            onChange={handleInputChange}
                                            disabled={!!formData.user}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            name="customer_email"
                                            value={formData.customer_email}
                                            onChange={handleInputChange}
                                            disabled={!!formData.user}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                                        <TextField
                                            fullWidth
                                            label="Số điện thoại"
                                            name="customer_phone"
                                            value={formData.customer_phone}
                                            onChange={handleInputChange}
                                            disabled={!!formData.user}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ width: '100%' }}>
                                        <TextField
                                            fullWidth
                                            label="Địa chỉ giao hàng"
                                            name="shipping_address"
                                            value={formData.shipping_address}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            disabled={!!formData.user}
                                        />
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Thông tin đơn hàng
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ width: { xs: '100%', md: 'calc(33% - 8px)' } }}>
                                        <TextField
                                            fullWidth
                                            label="Tổng tiền"
                                            name="total_amount"
                                            value={formData.total_amount}
                                            onChange={handleInputChange}
                                            type="number"
                                            InputProps={{
                                                readOnly: true
                                            }}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: 'calc(33% - 8px)' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="status-label">Trạng thái</InputLabel>
                                            <Select
                                                labelId="status-label"
                                                name="order_status"
                                                value={formData.order_status}
                                                label="Trạng thái"
                                                onChange={handleSelectChange}
                                            >
                                                <MenuItem value="Pending">Chờ xử lý</MenuItem>
                                                <MenuItem value="Processing">Đang xử lý</MenuItem>
                                                <MenuItem value="In transit">Đang giao hàng</MenuItem>
                                                <MenuItem value="Completed">Hoàn thành</MenuItem>
                                                <MenuItem value="Cancelled">Đã hủy</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: 'calc(33% - 8px)' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="payment-method-label">Phương thức thanh toán</InputLabel>
                                            <Select
                                                labelId="payment-method-label"
                                                name="payment_method"
                                                value={formData.payment_method}
                                                label="Phương thức thanh toán"
                                                onChange={handleSelectChange}
                                            >
                                                <MenuItem value="Cash on Delivery">Thanh toán khi nhận hàng (COD)</MenuItem>
                                                <MenuItem value="Bank Transfer">Chuyển khoản ngân hàng</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: 'calc(33% - 8px)' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="payment-status-label">Trạng thái thanh toán</InputLabel>
                                            <Select
                                                labelId="payment-status-label"
                                                name="payment_status"
                                                value={formData.payment_status}
                                                label="Trạng thái thanh toán"
                                                onChange={handleSelectChange}
                                            >
                                                <MenuItem value="Pending">Chờ thanh toán</MenuItem>
                                                <MenuItem value="Completed">Đã thanh toán</MenuItem>
                                                <MenuItem value="Failed">Thất bại</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </Stack>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Thêm sản phẩm vào đơn hàng
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                    <Box sx={{ width: { xs: '100%', md: '31%' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="product-label">Sản phẩm</InputLabel>
                                            <Select
                                                labelId="product-label"
                                                name="product"
                                                value={detailForm.product}
                                                label="Sản phẩm"
                                                onChange={handleDetailSelectChange}
                                            >
                                                <MenuItem value="">
                                                    <em>Chọn sản phẩm</em>
                                                </MenuItem>
                                                {products.map(product => (
                                                    <MenuItem key={product.product_id} value={product.product_id.toString()}>
                                                        {product.name} - {
                                                            product.discounted_price && product.discounted_price !== product.price 
                                                            ? <span>
                                                                <span style={{ textDecoration: 'line-through', color: '#888' }}>
                                                                    {formatCurrency(product.price)}
                                                                </span>
                                                                {' '}
                                                                <span style={{ color: 'red' }}>
                                                                    {formatCurrency(product.discounted_price)}
                                                                </span>
                                                            </span>
                                                            : formatCurrency(product.price)
                                                        }
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: '15%' } }}>
                                        <TextField
                                            fullWidth
                                            label="Số lượng"
                                            name="quantity"
                                            value={detailForm.quantity}
                                            onChange={handleDetailInputChange}
                                            type="number"
                                            inputProps={{ min: 1 }}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: '23%' } }}>
                                        <TextField
                                            fullWidth
                                            label="Đơn giá"
                                            name="price"
                                            value={detailForm.price}
                                            onChange={handleDetailInputChange}
                                            type="number"
                                            inputProps={{ min: 0 }}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ width: { xs: '100%', md: '23%' } }}>
                                        <Button 
                                            variant="contained" 
                                            onClick={handleAddDetail}
                                            fullWidth
                                        >
                                            Thêm vào đơn hàng
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle1" gutterBottom>
                                Sản phẩm trong đơn hàng
                            </Typography>
                            
                            {orderDetails.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <ShoppingCartIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                    <Typography color="text.secondary">
                                        Chưa có sản phẩm nào trong đơn hàng
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {orderDetails.map((detail, index) => {
                                        const product = products.find(p => p.product_id === detail.product);
                                        
                                        return (
                                            <React.Fragment key={detail.order_detail_id}>
                                                <ListItem
                                                    secondaryAction={
                                                        <IconButton 
                                                            edge="end" 
                                                            onClick={() => handleRemoveDetail(detail.order_detail_id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Typography>
                                                                    {product?.name || detail.product_name}
                                                                </Typography>
                                                                <Typography>
                                                                    {formatCurrency(detail.price * detail.quantity)}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Typography variant="body2">
                                                                    Số lượng: {detail.quantity}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    Đơn giá: {formatCurrency(detail.price)}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < orderDetails.length - 1 && <Divider />}
                                            </React.Fragment>
                                        );
                                    })}
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, p: 2, bgcolor: 'grey.100' }}>
                                        <Typography variant="h6">
                                            Tổng tiền: {formatCurrency(formData.total_amount)}
                                        </Typography>
                                    </Box>
                                </List>
                            )}
                        </TabPanel>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained"
                            disabled={orderDetails.length === 0}
                        >
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default OrderManagement; 