import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, 
    FormControlLabel, Switch, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import Layout from '../components/Layout';
import { getTerms, getTerm, createTerm, updateTerm, deleteTerm } from '../services/api';
import { TermsAndConditions } from '../types';
import { useSnackbar } from 'notistack';

const TermsAndConditionsManagement: React.FC = () => {
    const [terms, setTerms] = useState<TermsAndConditions[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTerm, setEditingTerm] = useState<TermsAndConditions | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [showPreview, setShowPreview] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        try {
            setLoading(true);
            const response = await getTerms();
            setTerms(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu điều khoản sử dụng:', error);
            enqueueSnackbar('Không thể lấy danh sách điều khoản sử dụng', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (term?: TermsAndConditions) => {
        if (term) {
            setEditingTerm(term);
            setFormData({
                title: term.title,
                content: term.content
            });
        } else {
            setEditingTerm(null);
            setFormData({
                title: '',
                content: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTerm(null);
        setShowPreview(false);
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
            if (editingTerm) {
                // Cập nhật điều khoản
                await updateTerm(editingTerm.id, formData);
                enqueueSnackbar('Cập nhật điều khoản sử dụng thành công!', { variant: 'success' });
            } else {
                // Tạo điều khoản mới
                await createTerm(formData);
                enqueueSnackbar('Tạo điều khoản sử dụng mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchTerms();
        } catch (error: any) {
            console.error('Lỗi khi lưu điều khoản sử dụng:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu điều khoản sử dụng', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa điều khoản sử dụng này?')) {
            try {
                await deleteTerm(id);
                enqueueSnackbar('Xóa điều khoản sử dụng thành công!', { variant: 'success' });
                fetchTerms();
            } catch (error) {
                console.error('Lỗi khi xóa điều khoản sử dụng:', error);
                enqueueSnackbar('Không thể xóa điều khoản sử dụng', { variant: 'error' });
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

    // Hàm hiển thị nội dung có thẻ HTML
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };

    const htmlExampleText = `
<h3>Tiêu đề</h3>
<p>Đoạn văn bản thông thường.</p>
<p><strong>Văn bản in đậm</strong> và <em>văn bản in nghiêng</em>.</p>
<ul>
    <li>Mục danh sách đầu tiên</li>
    <li>Mục danh sách thứ hai</li>
</ul>
<p>Chèn <a href="https://example.com">liên kết</a>.</p>
    `;

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Điều khoản sử dụng</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Điều khoản
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
                            ) : terms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                terms.map((term) => (
                                    <TableRow key={term.id}>
                                        <TableCell>{term.id}</TableCell>
                                        <TableCell>{term.title}</TableCell>
                                        <TableCell>
                                            {stripHtml(term.content).length > 100
                                                ? `${stripHtml(term.content).substring(0, 100)}...`
                                                : stripHtml(term.content)
                                            }
                                        </TableCell>
                                        <TableCell>{formatDate(term.created_at)}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(term)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(term.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Điều khoản sử dụng */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editingTerm ? 'Sửa Điều khoản sử dụng' : 'Thêm Điều khoản sử dụng Mới'}</DialogTitle>
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
                            
                            <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={showPreview} 
                                            onChange={() => setShowPreview(!showPreview)} 
                                        />
                                    }
                                    label="Xem trước nội dung"
                                />
                                <Tooltip title="Bạn có thể sử dụng HTML để định dạng nội dung">
                                    <IconButton>
                                        <InfoIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            
                            {showPreview ? (
                                <Box 
                                    sx={{ 
                                        border: '1px solid #ddd', 
                                        borderRadius: 1, 
                                        p: 2, 
                                        minHeight: '300px',
                                        mt: 2
                                    }}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                                </Box>
                            ) : (
                                <>
                                    <TextField
                                        fullWidth
                                        label="Nội dung (Hỗ trợ HTML)"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        multiline
                                        rows={12}
                                        required
                                        margin="normal"
                                        placeholder="Nhập nội dung điều khoản ở đây. Bạn có thể sử dụng HTML để định dạng nội dung."
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                        Ví dụ HTML mẫu:
                                    </Typography>
                                    <Box 
                                        component="pre" 
                                        sx={{ 
                                            bgcolor: '#f5f5f5', 
                                            p: 1, 
                                            borderRadius: 1, 
                                            fontSize: '0.75rem',
                                            overflowX: 'auto',
                                            maxHeight: '150px'
                                        }}
                                    >
                                        {htmlExampleText}
                                    </Box>
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained" 
                            disabled={!formData.title.trim() || !formData.content.trim()}
                        >
                            {editingTerm ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default TermsAndConditionsManagement; 