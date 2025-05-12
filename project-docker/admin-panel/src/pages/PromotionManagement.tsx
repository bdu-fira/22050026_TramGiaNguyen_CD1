import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, 
    TextField, MenuItem, Select, FormControl, InputLabel, Grid, Chip, Avatar, 
    FormHelperText, CircularProgress, InputAdornment, Tooltip, Tab, Tabs, SelectChangeEvent,
    FormLabel, FormGroup, Checkbox, FormControlLabel, ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PercentIcon from '@mui/icons-material/Percent';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoIcon from '@mui/icons-material/Photo';
import Layout from '../components/Layout';
import { 
    getPromotions, createPromotion, updatePromotion, deletePromotion,
    getCategories, getProducts, getPromotionProducts, getPromotionCategories
} from '../services/api';
import { Promotion, Category, Product } from '../types';
import { useSnackbar } from 'notistack';
import { styled } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = 'gamine_preset';
const CLOUDINARY_CLOUD_NAME = 'dlexb1dx9'; 
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Tạo các styled components thay thế cho Grid
const GridContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    margin: '-8px',
}));

const GridItemHalf = styled('div')(({ theme }) => ({
    padding: '8px',
    boxSizing: 'border-box',
    flex: '0 0 auto',
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        width: '50%',
    },
}));

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
            id={`promotion-tabpanel-${index}`}
            aria-labelledby={`promotion-tab-${index}`}
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

// Format list of items for display in the table
const formatItemsList = (items: string[]) => {
    if (!items.length) return "Không có";
    if (items.length <= 2) return items.join(", ");
    return `${items[0]}, ${items[1]} và ${items.length - 2} khác`;
};

const PromotionManagement: React.FC = () => {
    const location = useLocation();
    const { selectedProductId, selectedCategoryId } = location.state || {};
    
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promotionDetails, setPromotionDetails] = useState<{[key: number]: {products: string[], categories: string[]}}>({}); 
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [tabValue, setTabValue] = useState(0);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discount_percentage: '',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16),
        img_banner: '',
    });
    
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    
    const { enqueueSnackbar } = useSnackbar();

    const [uploadingBanner, setUploadingBanner] = useState(false);

    useEffect(() => {
        // Tải danh mục và sản phẩm trước khi tải khuyến mãi
        const loadInitialData = async () => {
            try {
                await fetchCategories();
                await fetchProducts();
                await fetchPromotions();
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu ban đầu:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();
        
        // Nếu được mở từ trang sản phẩm hoặc danh mục, tự động mở dialog thêm mới
        if (selectedProductId || selectedCategoryId) {
            handleOpenDialog();
        }
    }, []);
    
    useEffect(() => {
        // Nếu được mở từ trang sản phẩm, tự động chọn sản phẩm đó
        if (selectedProductId && products.length > 0) {
            setSelectedProductIds([selectedProductId]);
            setTabValue(1); // Chuyển đến tab sản phẩm
        }
        
        // Nếu được mở từ trang danh mục, tự động chọn danh mục đó
        if (selectedCategoryId && categories.length > 0) {
            setSelectedCategoryIds([selectedCategoryId]);
            setTabValue(2); // Chuyển đến tab danh mục
        }
    }, [selectedProductId, selectedCategoryId, products, categories]);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const response = await getPromotions();
            setPromotions(response.data);
            
            // Đảm bảo đã có dữ liệu sản phẩm và danh mục
            const productsData = products.length ? products : await fetchProducts();
            const categoriesData = categories.length ? categories : await fetchCategories();
            
            // Lấy thông tin chi tiết về sản phẩm và danh mục cho mỗi khuyến mãi
            const details: {[key: number]: {products: string[], categories: string[]}} = {};
            
            for (const promotion of response.data) {
                try {
                    const productResponse = await getPromotionProducts(promotion.promotion_id);
                    const categoryResponse = await getPromotionCategories(promotion.promotion_id);
                    
                    // Lấy tên sản phẩm từ IDs
                    const productNames = productResponse.data?.map((item: any) => {
                        const product = productsData.find((p: any) => p.product_id === item.product_id);
                        return product ? product.name : `Sản phẩm #${item.product_id}`;
                    }) || [];
                    
                    // Lấy tên danh mục từ IDs
                    const categoryNames = categoryResponse.data?.map((item: any) => {
                        const category = categoriesData.find((c: any) => c.category_id === item.category_id);
                        return category ? category.name : `Danh mục #${item.category_id}`;
                    }) || [];
                    
                    details[promotion.promotion_id] = {
                        products: productNames,
                        categories: categoryNames
                    };
                } catch (error) {
                    console.error(`Lỗi khi lấy chi tiết cho khuyến mãi ${promotion.promotion_id}:`, error);
                    details[promotion.promotion_id] = {
                        products: [],
                        categories: []
                    };
                }
            }
            
            setPromotionDetails(details);
        } catch (error) {
            console.error('Không thể lấy dữ liệu khuyến mãi:', error);
            enqueueSnackbar('Không thể lấy danh sách khuyến mãi', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            setCategories(response.data);
            return response.data;
        } catch (error) {
            console.error('Không thể lấy dữ liệu danh mục:', error);
            enqueueSnackbar('Không thể lấy danh sách danh mục', { variant: 'error' });
            return [];
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data);
            return response.data;
        } catch (error) {
            console.error('Không thể lấy dữ liệu sản phẩm:', error);
            enqueueSnackbar('Không thể lấy danh sách sản phẩm', { variant: 'error' });
            return [];
        }
    };

    const handleOpenDialog = async (promotion?: Promotion) => {
        if (promotion) {
            setEditingPromotion(promotion);
            setFormData({
                title: promotion.title,
                description: promotion.description || '',
                discount_percentage: promotion.discount_percentage.toString(),
                start_date: new Date(promotion.start_date).toISOString().slice(0, 16),
                end_date: new Date(promotion.end_date).toISOString().slice(0, 16),
                img_banner: promotion.img_banner || '',
            });
            
            try {
                // Lấy danh sách sản phẩm được áp dụng cho khuyến mãi này
                const productResponse = await getPromotionProducts(promotion.promotion_id);
                if (productResponse.data && Array.isArray(productResponse.data)) {
                    const productIds = productResponse.data.map(item => item.product_id);
                    setSelectedProductIds(productIds);
                } else {
                    setSelectedProductIds([]);
                }
                
                // Lấy danh sách danh mục được áp dụng cho khuyến mãi này
                const categoryResponse = await getPromotionCategories(promotion.promotion_id);
                if (categoryResponse.data && Array.isArray(categoryResponse.data)) {
                    const categoryIds = categoryResponse.data.map(item => item.category_id);
                    setSelectedCategoryIds(categoryIds);
                } else {
                    setSelectedCategoryIds([]);
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin sản phẩm hoặc danh mục áp dụng:', error);
                enqueueSnackbar('Không thể lấy thông tin sản phẩm hoặc danh mục áp dụng', { variant: 'error' });
                setSelectedProductIds([]);
                setSelectedCategoryIds([]);
            }
        } else {
            setEditingPromotion(null);
            setFormData({
                title: '',
                description: '',
                discount_percentage: '',
                start_date: new Date().toISOString().slice(0, 16),
                end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16),
                img_banner: '',
            });
            setSelectedProductIds([]);
            setSelectedCategoryIds([]);
        }
        setOpenDialog(true);
        setTabValue(0);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPromotion(null);
    };

    const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleProductSelectionChange = (event: SelectChangeEvent<number[]>) => {
        const { value } = event.target;
        setSelectedProductIds(typeof value === 'string' ? [] : value as number[]);
    };

    const handleCategorySelectionChange = (event: SelectChangeEvent<number[]>) => {
        const { value } = event.target;
        setSelectedCategoryIds(typeof value === 'string' ? [] : value as number[]);
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            enqueueSnackbar('Vui lòng nhập tiêu đề khuyến mãi', { variant: 'error' });
            return false;
        }
        
        if (!formData.discount_percentage || isNaN(Number(formData.discount_percentage)) || 
            Number(formData.discount_percentage) <= 0 || Number(formData.discount_percentage) > 100) {
            enqueueSnackbar('Vui lòng nhập phần trăm giảm giá hợp lệ (1-100)', { variant: 'error' });
            return false;
        }
        
        if (!formData.start_date || !formData.end_date) {
            enqueueSnackbar('Vui lòng chọn ngày bắt đầu và kết thúc', { variant: 'error' });
            return false;
        }
        
        if (new Date(formData.start_date) >= new Date(formData.end_date)) {
            enqueueSnackbar('Ngày kết thúc phải sau ngày bắt đầu', { variant: 'error' });
            return false;
        }
        
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        try {
            const promotionData: any = {
                title: formData.title,
                description: formData.description || null,
                discount_percentage: Number(formData.discount_percentage),
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                img_banner: formData.img_banner || null,
                product_ids: selectedProductIds,
                category_ids: selectedCategoryIds
            };
            
            if (editingPromotion) {
                // Cập nhật khuyến mãi
                await updatePromotion(editingPromotion.promotion_id, promotionData);
                enqueueSnackbar('Cập nhật khuyến mãi thành công!', { variant: 'success' });
            } else {
                // Tạo khuyến mãi mới
                await createPromotion(promotionData);
                enqueueSnackbar('Tạo khuyến mãi mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchPromotions();
        } catch (error: any) {
            console.error('Lỗi khi lưu khuyến mãi:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu khuyến mãi', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            try {
                await deletePromotion(id);
                enqueueSnackbar('Xóa khuyến mãi thành công!', { variant: 'success' });
                fetchPromotions();
            } catch (error) {
                console.error('Lỗi khi xóa khuyến mãi:', error);
                enqueueSnackbar('Không thể xóa khuyến mãi', { variant: 'error' });
            }
        }
    };

    const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        try {
            setUploadingBanner(true);
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.secure_url) {
                setFormData(prev => ({
                    ...prev,
                    img_banner: data.secure_url
                }));
                enqueueSnackbar('Tải ảnh banner lên thành công!', { variant: 'success' });
            }
        } catch (error) {
            console.error('Lỗi khi tải ảnh banner:', error);
            enqueueSnackbar('Không thể tải ảnh banner lên', { variant: 'error' });
        } finally {
            setUploadingBanner(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Khuyến mãi</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Khuyến mãi
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Phần trăm giảm giá</TableCell>
                                <TableCell>Ngày bắt đầu</TableCell>
                                <TableCell>Ngày kết thúc</TableCell>
                                <TableCell>Sản phẩm áp dụng</TableCell>
                                <TableCell>Danh mục áp dụng</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : promotions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                promotions.map((promotion) => {
                                    const now = new Date();
                                    const startDate = new Date(promotion.start_date);
                                    const endDate = new Date(promotion.end_date);
                                    
                                    let status = "Chưa bắt đầu";
                                    let statusColor = "info";
                                    
                                    if (now >= startDate && now <= endDate) {
                                        status = "Đang diễn ra";
                                        statusColor = "success";
                                    } else if (now > endDate) {
                                        status = "Đã kết thúc";
                                        statusColor = "error";
                                    }

                                    const detail = promotionDetails[promotion.promotion_id] || { products: [], categories: [] };
                                    
                                    return (
                                        <TableRow key={promotion.promotion_id}>
                                            <TableCell>{promotion.promotion_id}</TableCell>
                                            <TableCell>{promotion.title}</TableCell>
                                            <TableCell>{promotion.discount_percentage}%</TableCell>
                                            <TableCell>{formatDate(promotion.start_date)}</TableCell>
                                            <TableCell>{formatDate(promotion.end_date)}</TableCell>
                                            <TableCell>
                                                <Tooltip title={detail.products.join(", ") || "Không có"}>
                                                    <span>{formatItemsList(detail.products)}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={detail.categories.join(", ") || "Không có"}>
                                                    <span>{formatItemsList(detail.categories)}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={status} 
                                                    color={statusColor as any}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenDialog(promotion)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(promotion.promotion_id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Khuyến mãi */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog} 
                    maxWidth="md" 
                    fullWidth
                >
                    <DialogTitle>{editingPromotion ? 'Sửa Khuyến mãi' : 'Thêm Khuyến mãi Mới'}</DialogTitle>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="promotion edit tabs">
                            <Tab label="Thông tin cơ bản" />
                            <Tab label="Sản phẩm áp dụng" />
                            <Tab label="Danh mục áp dụng" />
                        </Tabs>
                    </Box>
                    <DialogContent>
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Tiêu đề khuyến mãi"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleTextFieldChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Mô tả"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleTextFieldChange}
                                    multiline
                                    rows={4}
                                />
                                <TextField
                                    fullWidth
                                    label="Phần trăm giảm giá"
                                    name="discount_percentage"
                                    value={formData.discount_percentage}
                                    onChange={handleTextFieldChange}
                                    type="number"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><PercentIcon /></InputAdornment>,
                                    }}
                                    required
                                />
                                <GridContainer>
                                    <GridItemHalf>
                                        <TextField
                                            fullWidth
                                            label="Ngày bắt đầu"
                                            name="start_date"
                                            type="datetime-local"
                                            value={formData.start_date}
                                            onChange={handleDateChange}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><DateRangeIcon /></InputAdornment>,
                                            }}
                                            required
                                        />
                                    </GridItemHalf>
                                    <GridItemHalf>
                                        <TextField
                                            fullWidth
                                            label="Ngày kết thúc"
                                            name="end_date"
                                            type="datetime-local"
                                            value={formData.end_date}
                                            onChange={handleDateChange}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><DateRangeIcon /></InputAdornment>,
                                            }}
                                            required
                                        />
                                    </GridItemHalf>
                                </GridContainer>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>Ảnh banner</Typography>
                                    
                                    {formData.img_banner ? (
                                        <Box sx={{ position: 'relative', mb: 2 }}>
                                            <img 
                                                src={formData.img_banner} 
                                                alt="Banner Preview" 
                                                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} 
                                            />
                                            <IconButton 
                                                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)' }}
                                                onClick={() => setFormData(prev => ({ ...prev, img_banner: '' }))}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box 
                                            sx={{ 
                                                width: '100%', 
                                                height: '120px', 
                                                border: '1px dashed #ccc', 
                                                borderRadius: '4px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 2,
                                                bgcolor: 'grey.100'
                                            }}
                                        >
                                            <PhotoIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary">Chưa có ảnh banner</Typography>
                                        </Box>
                                    )}
                                    
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={uploadingBanner ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                                        disabled={uploadingBanner}
                                        size="small"
                                    >
                                        {formData.img_banner ? 'Thay đổi ảnh banner' : 'Tải ảnh banner lên'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleUploadBanner}
                                            disabled={uploadingBanner}
                                        />
                                    </Button>
                                    <FormHelperText>
                                        Ảnh banner sẽ được hiển thị cho khuyến mãi này
                                    </FormHelperText>
                                </Box>
                            </Box>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <InventoryIcon sx={{ mr: 1 }} />
                                    Sản phẩm áp dụng khuyến mãi
                                </Typography>
                                
                                <FormControl fullWidth>
                                    <InputLabel id="products-select-label">Sản phẩm</InputLabel>
                                    <Select
                                        labelId="products-select-label"
                                        multiple
                                        value={selectedProductIds}
                                        onChange={handleProductSelectionChange}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const product = products.find(p => p.product_id === value);
                                                    return (
                                                        <Chip key={value} label={product?.name || value} />
                                                    )
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {products.map((product) => (
                                            <MenuItem key={product.product_id} value={product.product_id}>
                                                <Checkbox checked={selectedProductIds.indexOf(product.product_id) > -1} />
                                                <ListItemText primary={product.name} secondary={`${product.price.toLocaleString('vi-VN')}đ`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        Chọn các sản phẩm sẽ được áp dụng khuyến mãi này
                                    </FormHelperText>
                                </FormControl>
                            </Box>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <CategoryIcon sx={{ mr: 1 }} />
                                    Danh mục áp dụng khuyến mãi
                                </Typography>
                                
                                <FormControl fullWidth>
                                    <InputLabel id="categories-select-label">Danh mục</InputLabel>
                                    <Select
                                        labelId="categories-select-label"
                                        multiple
                                        value={selectedCategoryIds}
                                        onChange={handleCategorySelectionChange}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const category = categories.find(c => c.category_id === value);
                                                    return (
                                                        <Chip key={value} label={category?.name || value} />
                                                    )
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category.category_id} value={category.category_id}>
                                                <Checkbox checked={selectedCategoryIds.indexOf(category.category_id) > -1} />
                                                <ListItemText primary={category.name} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        Chọn các danh mục sẽ được áp dụng khuyến mãi này. Tất cả sản phẩm trong danh mục sẽ được giảm giá.
                                    </FormHelperText>
                                </FormControl>
                            </Box>
                        </TabPanel>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button onClick={handleSubmit} variant="contained">Lưu</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default PromotionManagement; 