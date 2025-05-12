import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Link, Chip, Badge, Tooltip, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import DateRangeIcon from '@mui/icons-material/DateRange';
import Layout from '../components/Layout';
import { getCareers, createCareer, updateCareer, deleteCareer, getCareerApplications } from '../services/api';
import { Career, CareerApplication } from '../types';
import { useSnackbar } from 'notistack';

const CareerManagement: React.FC = () => {
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCareer, setEditingCareer] = useState<Career | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        link_cv: ''
    });
    const [cvViewOpen, setCvViewOpen] = useState(false);
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
    const [applications, setApplications] = useState<CareerApplication[]>([]);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchCareers();
    }, []);

    const fetchCareers = async () => {
        try {
            setLoading(true);
            const response = await getCareers();
            setCareers(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu tuyển dụng:', error);
            enqueueSnackbar('Không thể lấy danh sách tuyển dụng', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (career?: Career) => {
        if (career) {
            setEditingCareer(career);
            setFormData({
                title: career.title,
                description: career.description,
                requirements: career.requirements || '',
                link_cv: career.link_cv || ''
            });
        } else {
            setEditingCareer(null);
            setFormData({
                title: '',
                description: '',
                requirements: '',
                link_cv: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCareer(null);
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
            if (editingCareer) {
                // Cập nhật vị trí tuyển dụng
                await updateCareer(editingCareer.job_id, formData);
                enqueueSnackbar('Cập nhật vị trí tuyển dụng thành công!', { variant: 'success' });
            } else {
                // Tạo vị trí tuyển dụng mới
                await createCareer(formData);
                enqueueSnackbar('Tạo vị trí tuyển dụng mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchCareers();
        } catch (error: any) {
            console.error('Lỗi khi lưu vị trí tuyển dụng:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu vị trí tuyển dụng', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vị trí tuyển dụng này?')) {
            try {
                await deleteCareer(id);
                enqueueSnackbar('Xóa vị trí tuyển dụng thành công!', { variant: 'success' });
                fetchCareers();
            } catch (error) {
                console.error('Lỗi khi xóa vị trí tuyển dụng:', error);
                enqueueSnackbar('Không thể xóa vị trí tuyển dụng', { variant: 'error' });
            }
        }
    };

    // Hàm xử lý xem danh sách CV
    const handleViewCvs = async (career: Career) => {
        setSelectedCareer(career);
        setCvViewOpen(true);
        
        try {
            setLoadingApplications(true);
            const response = await getCareerApplications(career.job_id);
            setApplications(response.data);
        } catch (error) {
            console.error('Không thể lấy danh sách ứng tuyển:', error);
            enqueueSnackbar('Không thể lấy danh sách ứng tuyển', { variant: 'error' });
            setApplications([]);
        } finally {
            setLoadingApplications(false);
        }
    };

    // Xử lý đóng modal xem CV
    const handleCloseCvView = () => {
        setCvViewOpen(false);
        setSelectedCareer(null);
        setApplications([]);
    };

    // Hàm xử lý tên file từ URL
    const extractFilenameFromUrl = (url: string): string => {
        try {
            // Xử lý URL Google Drive
            if (url.includes('drive.google.com')) {
                return 'Google Drive CV';
            }
            
            // Xử lý URL thông thường
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop() || 'Unknown';
            
            // Giới hạn độ dài tên file để hiển thị
            return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
        } catch (error) {
            console.error('Error parsing URL:', error);
            return 'CV Link';
        }
    };

    // Hàm format ngày tạo CV
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Tuyển dụng</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Vị trí Tuyển dụng
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Mô tả</TableCell>
                                <TableCell>Yêu cầu</TableCell>
                                <TableCell align="center">Ứng viên</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : careers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                careers.map((career) => (
                                    <TableRow key={career.job_id}>
                                        <TableCell>{career.job_id}</TableCell>
                                        <TableCell>{career.title}</TableCell>
                                        <TableCell>
                                            {career.description.length > 100 
                                                ? `${career.description.substring(0, 100)}...` 
                                                : career.description}
                                        </TableCell>
                                        <TableCell>
                                            {career.requirements && career.requirements.length > 100 
                                                ? `${career.requirements.substring(0, 100)}...` 
                                                : career.requirements || '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Xem danh sách ứng viên">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="primary"
                                                    startIcon={<PeopleIcon />}
                                                    onClick={() => handleViewCvs(career)}
                                                >
                                                    Xem ứng viên
                                                </Button>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{new Date(career.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(career)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(career.job_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Vị trí Tuyển dụng */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editingCareer ? 'Sửa Vị trí Tuyển dụng' : 'Thêm Vị trí Tuyển dụng Mới'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                name="title"
                                label="Tiêu đề"
                                value={formData.title}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                            
                            <TextField
                                name="description"
                                label="Mô tả công việc"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                multiline
                                rows={6}
                            />
                            
                            <TextField
                                name="requirements"
                                label="Yêu cầu ứng viên"
                                value={formData.requirements}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={6}
                            />

                            <TextField
                                name="link_cv"
                                label="Link CV Google Drive"
                                value={formData.link_cv}
                                onChange={handleInputChange}
                                fullWidth
                                placeholder="https://drive.google.com/file/d/..."
                                helperText="Nhập đường dẫn đến CV của ứng viên (Google Drive)"
                            />
                            
                            {editingCareer && editingCareer.link_cv && (
                                <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        CV hiện tại:
                                    </Typography>
                                    <Link 
                                        href={editingCareer.link_cv} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                    >
                                        <DescriptionIcon fontSize="small" />
                                        {extractFilenameFromUrl(editingCareer.link_cv)}
                                    </Link>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy bỏ</Button>
                        <Button onClick={handleSubmit} variant="contained">Lưu</Button>
                    </DialogActions>
                </Dialog>

                {/* Modal xem danh sách ứng viên */}
                <Dialog open={cvViewOpen} onClose={handleCloseCvView} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon color="primary" />
                                <Typography>
                                    Ứng viên cho vị trí: {selectedCareer?.title}
                                </Typography>
                            </Box>
                            <Chip 
                                label={`${applications.length} Ứng viên`} 
                                color="primary" 
                                size="small" 
                            />
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            {loadingApplications ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : applications.length === 0 ? (
                                <Typography color="text.secondary" align="center">
                                    Chưa có ứng viên nào ứng tuyển cho vị trí này
                                </Typography>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width="5%">#</TableCell>
                                                <TableCell>Thông tin ứng viên</TableCell>
                                                <TableCell>CV</TableCell>
                                                <TableCell>Ngày nộp</TableCell>
                                                <TableCell width="15%">Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {applications.map((application, index) => (
                                                <TableRow key={application.application_id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            {application.applicant_name && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <PersonIcon fontSize="small" color="action" />
                                                                    <Typography variant="body2">
                                                                        {application.applicant_name}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            {application.applicant_email && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <EmailIcon fontSize="small" color="action" />
                                                                    <Typography variant="body2">
                                                                        {application.applicant_email}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            {!application.applicant_name && !application.applicant_email && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Không có thông tin
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Link 
                                                            href={application.cv_link} 
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{ 
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                maxWidth: '200px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap' 
                                                            }}
                                                        >
                                                            <DescriptionIcon fontSize="small" />
                                                            {extractFilenameFromUrl(application.cv_link)}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DateRangeIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                {formatDate(application.created_at)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            href={application.cv_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            startIcon={<DescriptionIcon />}
                                                        >
                                                            Mở CV
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCvView}>Đóng</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default CareerManagement; 