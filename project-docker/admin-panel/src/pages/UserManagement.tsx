import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl, Pagination, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../components/Layout';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { User } from '../types';
import { useSnackbar } from 'notistack';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    // Pagination and search states
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // Filter users based on search query
        const filtered = users.filter(user => 
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.address && user.address.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        setFilteredUsers(filtered);
        setTotalPages(Math.ceil(filtered.length / rowsPerPage));
        setPage(1); // Reset to first page on new search
    }, [searchQuery, users, rowsPerPage]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getUsers();
            setUsers(response.data);
            setFilteredUsers(response.data);
            setTotalPages(Math.ceil(response.data.length / rowsPerPage));
        } catch (error) {
            console.error('Không thể lấy dữ liệu người dùng:', error);
            enqueueSnackbar('Không thể lấy danh sách người dùng', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                password: '', // Không hiển thị mật khẩu hiện tại
                phone: user.phone || '',
                address: user.address || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                phone: '',
                address: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (editingUser) {
                // Cập nhật người dùng
                const userData: Partial<User> & { password?: string } = {
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone || null,
                    address: formData.address || null
                };
                
                // Chỉ thêm mật khẩu nếu đã nhập
                if (formData.password) {
                    userData.password = formData.password;
                }
                
                console.log("Gửi dữ liệu cập nhật:", userData);
                const response = await updateUser(editingUser.user_id, userData);
                console.log("Kết quả cập nhật:", response.data);
                enqueueSnackbar('Cập nhật người dùng thành công!', { variant: 'success' });
            } else {
                // Tạo người dùng mới
                console.log("Gửi dữ liệu tạo mới:", formData);
                const response = await createUser({
                    ...formData,
                    password: formData.password,
                    phone: formData.phone || null,
                    address: formData.address || null
                });
                console.log("Kết quả tạo mới:", response.data);
                enqueueSnackbar('Tạo người dùng mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchUsers();
        } catch (error: any) {
            console.error('Lỗi khi lưu người dùng:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu người dùng', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await deleteUser(id);
                enqueueSnackbar('Xóa người dùng thành công!', { variant: 'success' });
                fetchUsers();
            } catch (error) {
                console.error('Lỗi khi xóa người dùng:', error);
                enqueueSnackbar('Không thể xóa người dùng', { variant: 'error' });
            }
        }
    };
    
    // Handlers for pagination and search
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };
    
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };
    
    // Get current page items
    const getCurrentItems = () => {
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredUsers.slice(startIndex, endIndex);
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Người dùng</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Người dùng
                    </Button>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc địa chỉ..."
                        variant="outlined"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tên đăng nhập</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Số điện thoại</TableCell>
                                <TableCell>Địa chỉ</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : getCurrentItems().length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                getCurrentItems().map((user) => (
                                    <TableRow key={user.user_id}>
                                        <TableCell>{user.user_id}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone || '-'}</TableCell>
                                        <TableCell>{user.address || '-'}</TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(user)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(user.user_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {!loading && filteredUsers.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination 
                            count={totalPages} 
                            page={page} 
                            onChange={handlePageChange} 
                            color="primary" 
                            showFirstButton 
                            showLastButton
                        />
                    </Box>
                )}

                {/* Dialog Thêm/Sửa Người dùng */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>{editingUser ? 'Sửa Người dùng' : 'Thêm Người dùng Mới'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                name="username"
                                label="Tên đăng nhập"
                                value={formData.username}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                            
                            <TextField
                                name="email"
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                            
                            <TextField
                                name="password"
                                label={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                fullWidth
                                required={!editingUser}
                            />
                            
                            <TextField
                                name="phone"
                                label="Số điện thoại"
                                value={formData.phone}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            
                            <TextField
                                name="address"
                                label="Địa chỉ"
                                value={formData.address}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button onClick={handleSubmit} variant="contained" color="primary">
                            {editingUser ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default UserManagement; 