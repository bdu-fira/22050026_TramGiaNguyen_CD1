import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, 
    TextField, Chip, Tooltip, Tab, Tabs, List, ListItem, ListItemText, Divider,
    FormHelperText, CircularProgress, Avatar, InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PercentIcon from '@mui/icons-material/Percent';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Layout from '../components/Layout';
import { 
    getCategories, createCategory, updateCategory, deleteCategory,
    getPromotions, getCategoryPromotions
} from '../services/api';
import { Category, Promotion, CategoryImage } from '../types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Cloudinary configuration - Tương tự như ProductManagement
const CLOUDINARY_UPLOAD_PRESET = 'gamine_preset';
const CLOUDINARY_CLOUD_NAME = 'dlexb1dx9'; 
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

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
            id={`category-tabpanel-${index}`}
            aria-labelledby={`category-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    
    // Promotion dialog
    const [openPromotionDialog, setOpenPromotionDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryPromotions, setCategoryPromotions] = useState<Promotion[]>([]);
    const [loadingPromotions, setLoadingPromotions] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    
    // Hình ảnh
    const [images, setImages] = useState<CategoryImage[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu danh mục:', error);
            enqueueSnackbar('Không thể lấy danh sách danh mục', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || ''
            });
            setImages(category.images || []);
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: ''
            });
            setImages([]);
        }
        setOpenDialog(true);
        setTabValue(0);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCategory(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };
    
    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        try {
            setUploadingImage(true);
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.secure_url) {
                const newImage: CategoryImage = {
                    image_id: Date.now(), // Temporary ID for UI purposes
                    image_url: data.secure_url,
                    is_primary: images.length === 0 // First image is primary by default
                };
                
                setImages(prev => [...prev, newImage]);
                enqueueSnackbar('Tải hình ảnh lên thành công!', { variant: 'success' });
            }
        } catch (error) {
            console.error('Lỗi khi tải hình ảnh:', error);
            enqueueSnackbar('Không thể tải hình ảnh lên', { variant: 'error' });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = (imageId: number) => {
        setImages(prev => {
            const filtered = prev.filter(img => img.image_id !== imageId);
            // If we removed the primary image and have other images, make the first one primary
            if (filtered.length > 0 && !filtered.some(img => img.is_primary)) {
                filtered[0].is_primary = true;
            }
            return filtered;
        });
    };

    const handleSetPrimaryImage = (imageId: number) => {
        setImages(prev => 
            prev.map(img => ({
                ...img,
                is_primary: img.image_id === imageId
            }))
        );
    };

    const handleSubmit = async () => {
        try {
            // Tìm primary image (nếu có) để gán vào img_url
            const primaryImage = images.find(img => img.is_primary);
            const imgUrl = primaryImage ? primaryImage.image_url : null;
            
            if (editingCategory) {
                // Cập nhật danh mục
                const categoryData = {
                    name: formData.name,
                    description: formData.description || null,
                    img_url: imgUrl,
                    images: images.map(img => ({
                        image_url: img.image_url,
                        is_primary: img.is_primary
                    })) as any
                };
                
                await updateCategory(editingCategory.category_id, categoryData);
                enqueueSnackbar('Cập nhật danh mục thành công!', { variant: 'success' });
            } else {
                // Tạo danh mục mới
                await createCategory({
                    name: formData.name,
                    description: formData.description || null,
                    img_url: imgUrl,
                    images: images.map(img => ({
                        image_url: img.image_url,
                        is_primary: img.is_primary
                    })) as any
                });
                enqueueSnackbar('Tạo danh mục mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchCategories();
        } catch (error: any) {
            console.error('Lỗi khi lưu danh mục:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu danh mục', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            try {
                await deleteCategory(id);
                enqueueSnackbar('Xóa danh mục thành công!', { variant: 'success' });
                fetchCategories();
            } catch (error) {
                console.error('Lỗi khi xóa danh mục:', error);
                enqueueSnackbar('Không thể xóa danh mục', { variant: 'error' });
            }
        }
    };
    
    const handleOpenPromotionDialog = async (category: Category) => {
        setSelectedCategory(category);
        setOpenPromotionDialog(true);
        setTabValue(0);
        await fetchCategoryPromotions(category.category_id);
    };
    
    const handleClosePromotionDialog = () => {
        setOpenPromotionDialog(false);
        setSelectedCategory(null);
        setCategoryPromotions([]);
    };
    
    const fetchCategoryPromotions = async (categoryId: number) => {
        try {
            setLoadingPromotions(true);
            const response = await getCategoryPromotions(categoryId);
            setCategoryPromotions(response.data);
        } catch (error) {
            console.error('Không thể lấy danh sách khuyến mãi của danh mục:', error);
            enqueueSnackbar('Không thể lấy danh sách khuyến mãi', { variant: 'error' });
        } finally {
            setLoadingPromotions(false);
        }
    };
    
    const handleAddPromotion = () => {
        navigate('/promotions', { state: { selectedCategoryId: selectedCategory?.category_id } });
        handleClosePromotionDialog();
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Danh mục</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Danh mục
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Hình ảnh</TableCell>
                                <TableCell>Tên danh mục</TableCell>
                                <TableCell>Mô tả</TableCell>
                                <TableCell>Khuyến mãi</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.category_id}>
                                        <TableCell>{category.category_id}</TableCell>
                                        <TableCell>
                                            {category.img_url ? (
                                                <Avatar 
                                                    src={category.img_url} 
                                                    alt={category.name}
                                                    sx={{ width: 50, height: 50 }}
                                                    variant="rounded"
                                                />
                                            ) : category.images && category.images.length > 0 ? (
                                                <Avatar 
                                                    src={category.images.find(img => img.is_primary)?.image_url || category.images[0].image_url} 
                                                    alt={category.name}
                                                    sx={{ width: 50, height: 50 }}
                                                    variant="rounded"
                                                />
                                            ) : (
                                                <Avatar 
                                                    sx={{ width: 50, height: 50, bgcolor: 'grey.300' }}
                                                    variant="rounded"
                                                >
                                                    <ImageIcon />
                                                </Avatar>
                                            )}
                                        </TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>{category.description || '-'}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Xem khuyến mãi">
                                                <IconButton 
                                                    onClick={() => handleOpenPromotionDialog(category)}
                                                    color="primary"
                                                >
                                                    <LocalOfferIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(category)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(category.category_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Danh mục */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editingCategory ? 'Sửa Danh mục' : 'Thêm Danh mục Mới'}</DialogTitle>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Thông tin cơ bản" />
                            <Tab label="Hình ảnh" />
                        </Tabs>
                    </Box>
                    <DialogContent>
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Tên danh mục"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Mô tả"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={4}
                                />
                            </Box>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Hình ảnh danh mục
                                </Typography>
                                
                                <Box sx={{ mb: 3 }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={uploadingImage ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                                        disabled={uploadingImage}
                                    >
                                        Tải hình ảnh lên
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                            disabled={uploadingImage}
                                        />
                                    </Button>
                                    <FormHelperText>
                                        Hình ảnh sẽ được tải lên Cloudinary
                                    </FormHelperText>
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {images.map((image) => (
                                        <Box
                                            key={image.image_id}
                                            sx={{
                                                position: 'relative',
                                                width: 150,
                                                height: 150,
                                                m: 1,
                                                border: image.is_primary ? '2px solid #2196f3' : '1px solid #ddd',
                                                borderRadius: 1,
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <img
                                                src={image.image_url}
                                                alt="Category"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bgcolor: 'rgba(0,0,0,0.6)',
                                                    display: 'flex',
                                                    justifyContent: 'space-around',
                                                    p: 0.5
                                                }}
                                            >
                                                <Tooltip title="Đặt làm ảnh chính">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleSetPrimaryImage(image.image_id)}
                                                            disabled={image.is_primary}
                                                            sx={{ color: 'white' }}
                                                        >
                                                            <ImageIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Xóa ảnh">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveImage(image.image_id)}
                                                        sx={{ color: 'white' }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            {image.is_primary && (
                                                <Chip
                                                    label="Ảnh chính"
                                                    size="small"
                                                    color="primary"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 5,
                                                        right: 5
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    ))}
                                    
                                    {images.length === 0 && (
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: 200,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: 'grey.100',
                                                borderRadius: 1
                                            }}
                                        >
                                            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <ImageIcon sx={{ mr: 1 }} />
                                                Chưa có hình ảnh nào
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </TabPanel>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button onClick={handleSubmit} variant="contained">Lưu</Button>
                    </DialogActions>
                </Dialog>
                
                {/* Dialog Xem Khuyến mãi của Danh mục */}
                <Dialog open={openPromotionDialog} onClose={handleClosePromotionDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        Khuyến mãi cho danh mục: {selectedCategory?.name}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange}>
                                <Tab label="Khuyến mãi đang áp dụng" />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            {loadingPromotions ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <Typography>Đang tải khuyến mãi...</Typography>
                                </Box>
                            ) : categoryPromotions.length === 0 ? (
                                <Box sx={{ my: 2 }}>
                                    <Typography>Chưa có khuyến mãi nào cho danh mục này</Typography>
                                </Box>
                            ) : (
                                <List>
                                    {categoryPromotions.map((promotion, index) => (
                                        <React.Fragment key={promotion.promotion_id}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <PercentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                                            <Typography variant="body1">
                                                                {promotion.title} - <strong>{promotion.discount_percentage}%</strong>
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2">
                                                                {promotion.description || 'Không có mô tả'}
                                                            </Typography>
                                                            <Typography variant="caption">
                                                                Thời gian: {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                                {(() => {
                                                    const now = new Date();
                                                    const startDate = new Date(promotion.start_date);
                                                    const endDate = new Date(promotion.end_date);
                                                    
                                                    let status = "Chưa bắt đầu";
                                                    let color = "info";
                                                    
                                                    if (now >= startDate && now <= endDate) {
                                                        status = "Đang diễn ra";
                                                        color = "success";
                                                    } else if (now > endDate) {
                                                        status = "Đã kết thúc";
                                                        color = "error";
                                                    }
                                                    
                                                    return (
                                                        <Chip 
                                                            label={status} 
                                                            color={color as any}
                                                            size="small" 
                                                            sx={{ ml: 1 }}
                                                        />
                                                    );
                                                })()}
                                            </ListItem>
                                            {index < categoryPromotions.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </TabPanel>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={handleAddPromotion} 
                            variant="contained" 
                            color="primary" 
                            startIcon={<AddIcon />}
                        >
                            Thêm khuyến mãi mới
                        </Button>
                        <Button onClick={handleClosePromotionDialog}>Đóng</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default CategoryManagement; 