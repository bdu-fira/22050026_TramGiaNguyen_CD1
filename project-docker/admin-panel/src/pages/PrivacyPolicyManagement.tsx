import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../components/Layout';
import { getPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy } from '../services/api';
import { PrivacyPolicy } from '../types';
import { useSnackbar } from 'notistack';

const PrivacyPolicyManagement: React.FC = () => {
    const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<PrivacyPolicy | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const response = await getPolicies();
            setPolicies(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu chính sách bảo mật:', error);
            enqueueSnackbar('Không thể lấy danh sách chính sách bảo mật', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (policy?: PrivacyPolicy) => {
        if (policy) {
            setEditingPolicy(policy);
            setFormData({
                title: policy.title,
                content: policy.content
            });
        } else {
            setEditingPolicy(null);
            setFormData({
                title: '',
                content: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPolicy(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (editingPolicy) {
                // Cập nhật chính sách
                await updatePolicy(editingPolicy.id, formData);
                enqueueSnackbar('Cập nhật chính sách bảo mật thành công!', { variant: 'success' });
            } else {
                // Tạo chính sách mới
                await createPolicy(formData);
                enqueueSnackbar('Tạo chính sách bảo mật mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchPolicies();
        } catch (error: any) {
            console.error('Lỗi khi lưu chính sách bảo mật:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu chính sách bảo mật', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chính sách bảo mật này?')) {
            try {
                await deletePolicy(id);
                enqueueSnackbar('Xóa chính sách bảo mật thành công!', { variant: 'success' });
                fetchPolicies();
            } catch (error) {
                console.error('Lỗi khi xóa chính sách bảo mật:', error);
                enqueueSnackbar('Không thể xóa chính sách bảo mật', { variant: 'error' });
            }
        }
    };

    // Hàm format ngày tháng
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Chính sách bảo mật</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Chính sách
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Nội dung</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress size={30} sx={{ my: 2 }} />
                                    </TableCell>
                                </TableRow>
                            ) : policies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                policies.map((policy) => (
                                    <TableRow key={policy.id}>
                                        <TableCell>{policy.id}</TableCell>
                                        <TableCell>{policy.title}</TableCell>
                                        <TableCell>
                                            {policy.content.length > 100
                                                ? `${policy.content.substring(0, 100)}...`
                                                : policy.content
                                            }
                                        </TableCell>
                                        <TableCell>{formatDate(policy.created_at)}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(policy)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(policy.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Chính sách bảo mật */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editingPolicy ? 'Sửa Chính sách bảo mật' : 'Thêm Chính sách bảo mật Mới'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Tiêu đề"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Nội dung"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                margin="normal"
                                multiline
                                rows={10}
                                required
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained" 
                            disabled={!formData.title.trim() || !formData.content.trim()}
                        >
                            {editingPolicy ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default PrivacyPolicyManagement; 