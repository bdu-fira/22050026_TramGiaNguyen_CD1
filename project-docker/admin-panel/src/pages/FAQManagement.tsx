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
import { getFaqs, getFaq, createFaq, updateFaq, deleteFaq } from '../services/api';
import { FAQ } from '../types';
import { useSnackbar } from 'notistack';

const FAQManagement: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState({
        question: '',
        answer: ''
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const response = await getFaqs();
            setFaqs(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu FAQ:', error);
            enqueueSnackbar('Không thể lấy danh sách FAQ', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (faq?: FAQ) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer
            });
        } else {
            setEditingFaq(null);
            setFormData({
                question: '',
                answer: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingFaq(null);
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
            if (editingFaq) {
                // Cập nhật FAQ
                await updateFaq(editingFaq.faq_id, formData);
                enqueueSnackbar('Cập nhật FAQ thành công!', { variant: 'success' });
            } else {
                // Tạo FAQ mới
                await createFaq(formData);
                enqueueSnackbar('Tạo FAQ mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchFaqs();
        } catch (error: any) {
            console.error('Lỗi khi lưu FAQ:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu FAQ', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa FAQ này?')) {
            try {
                await deleteFaq(id);
                enqueueSnackbar('Xóa FAQ thành công!', { variant: 'success' });
                fetchFaqs();
            } catch (error) {
                console.error('Lỗi khi xóa FAQ:', error);
                enqueueSnackbar('Không thể xóa FAQ', { variant: 'error' });
            }
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý FAQ</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm FAQ
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Câu hỏi</TableCell>
                                <TableCell>Câu trả lời</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <CircularProgress size={30} sx={{ my: 2 }} />
                                    </TableCell>
                                </TableRow>
                            ) : faqs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                faqs.map((faq) => (
                                    <TableRow key={faq.faq_id}>
                                        <TableCell>{faq.faq_id}</TableCell>
                                        <TableCell>
                                            {faq.question.length > 100
                                                ? `${faq.question.substring(0, 100)}...`
                                                : faq.question
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {faq.answer.length > 100
                                                ? `${faq.answer.substring(0, 100)}...`
                                                : faq.answer
                                            }
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(faq)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(faq.faq_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa FAQ */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editingFaq ? 'Sửa FAQ' : 'Thêm FAQ Mới'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Câu hỏi"
                                name="question"
                                value={formData.question}
                                onChange={handleInputChange}
                                margin="normal"
                                multiline
                                rows={3}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Câu trả lời"
                                name="answer"
                                value={formData.answer}
                                onChange={handleInputChange}
                                margin="normal"
                                multiline
                                rows={6}
                                required
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained" 
                            disabled={!formData.question.trim() || !formData.answer.trim()}
                        >
                            {editingFaq ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default FAQManagement; 