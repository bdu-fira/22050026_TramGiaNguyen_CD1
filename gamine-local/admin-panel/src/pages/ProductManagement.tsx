import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, 
    TextField, MenuItem, Select, FormControl, InputLabel, Chip, Avatar, 
    FormHelperText, CircularProgress, InputAdornment, Tooltip, Tab, Tabs, SelectChangeEvent,
    List, ListItem, ListItemText, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PercentIcon from '@mui/icons-material/Percent';
import Layout from '../components/Layout';
import { 
    getProducts, createProduct, updateProduct, deleteProduct, getCategories,
    getProductPromotions, getProductDiscountedPrice, isPromotionActive
} from '../services/api';
import { Product, Category, ProductImage, ProductDetail, Promotion } from '../types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = 'gamine_preset'; // Preset cho ứng dụng của bạn - cần tạo trong Cloudinary dashboard
const CLOUDINARY_CLOUD_NAME = 'dlexb1dx9'; // Cloud name miễn phí của Cloudinary
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Tạo các styled components thay thế cho Grid
const GridContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    margin: '-8px', // Bù lại padding của GridItem
}));

const GridItem = styled('div')(({ theme }) => ({
    padding: '8px',
    boxSizing: 'border-box',
    flex: '0 0 auto',
}));

// GridItem với kích thước 6/12 cho màn hình trung bình trở lên, 12/12 cho màn hình nhỏ
const GridItemHalf = styled(GridItem)(({ theme }) => ({
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
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
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

const ProductManagement: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Promotion dialog
    const [openPromotionDialog, setOpenPromotionDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productPromotions, setProductPromotions] = useState<Promotion[]>([]);
    const [loadingPromotions, setLoadingPromotions] = useState(false);
    const [promoTabValue, setPromoTabValue] = useState(0);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category: '',
        specification: ''
    });
    
    const [images, setImages] = useState<ProductImage[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await getProducts();
            // Lấy danh sách sản phẩm cơ bản
            const productsList = response.data;
            
            // Lấy thông tin khuyến mãi và tính giá cho từng sản phẩm
            const productsWithDiscounts = await Promise.all(
                productsList.map(async (product: Product) => {
                    try {
                        // Lấy thông tin khuyến mãi cho sản phẩm
                        const promotionsResponse = await getProductPromotions(product.product_id);
                        if (promotionsResponse.data && Array.isArray(promotionsResponse.data)) {
                            // Lọc ra các khuyến mãi đang active
                            const activePromotions = promotionsResponse.data.filter(promo => isPromotionActive(promo));
                            
                            // Nếu có khuyến mãi active, tìm khuyến mãi có discount cao nhất
                            if (activePromotions.length > 0) {
                                const maxDiscount = Math.max(...activePromotions.map(promo => promo.discount_percentage));
                                
                                // Tính giá khuyến mãi dựa trên phần trăm giảm giá
                                const discountAmount = (product.price * maxDiscount) / 100;
                                const discountedPrice = product.price - discountAmount;
                                
                                // Cập nhật thông tin sản phẩm
                                return {
                                    ...product,
                                    discounted_price: Number(discountedPrice.toFixed(2)),
                                    discount_percentage: maxDiscount,
                                    has_active_promotion: true
                                };
                            }
                        }
                        
                        // Trường hợp không có khuyến mãi
                        return {
                            ...product,
                            discounted_price: product.price,
                            discount_percentage: 0,
                            has_active_promotion: false
                        };
                    } catch (error) {
                        console.error(`Lỗi khi lấy thông tin khuyến mãi cho sản phẩm ${product.product_id}:`, error);
                        return product;
                    }
                })
            );
            
            setProducts(productsWithDiscounts);
        } catch (error) {
            console.error('Không thể lấy dữ liệu sản phẩm:', error);
            enqueueSnackbar('Không thể lấy danh sách sản phẩm', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu danh mục:', error);
            enqueueSnackbar('Không thể lấy danh sách danh mục', { variant: 'error' });
        }
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                stock_quantity: product.stock_quantity.toString(),
                category: product.category.toString(),
                specification: product.detail?.specification || ''
            });
            setImages(product.images || []);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock_quantity: '',
                category: '',
                specification: ''
            });
            setImages([]);
        }
        setOpenDialog(true);
        setTabValue(0); // Reset to first tab when opening dialog
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingProduct(null);
        setImages([]);
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
                const newImage: ProductImage = {
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

    const validateForm = () => {
        if (!formData.name.trim()) {
            enqueueSnackbar('Vui lòng nhập tên sản phẩm', { variant: 'error' });
            return false;
        }
        
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            enqueueSnackbar('Vui lòng nhập giá sản phẩm hợp lệ', { variant: 'error' });
            return false;
        }
        
        if (!formData.stock_quantity || isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
            enqueueSnackbar('Vui lòng nhập số lượng tồn kho hợp lệ', { variant: 'error' });
            return false;
        }
        
        if (!formData.category) {
            enqueueSnackbar('Vui lòng chọn danh mục sản phẩm', { variant: 'error' });
            return false;
        }
        
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        try {
            const productData: any = {
                name: formData.name,
                description: formData.description || null,
                price: Number(formData.price),
                stock_quantity: Number(formData.stock_quantity),
                category: Number(formData.category),
                images: images.map(img => ({
                    image_url: img.image_url,
                    is_primary: img.is_primary
                })),
                detail: {
                    specification: formData.specification || null
                }
            };
            
            if (editingProduct) {
                // Cập nhật sản phẩm
                await updateProduct(editingProduct.product_id, productData);
                enqueueSnackbar('Cập nhật sản phẩm thành công!', { variant: 'success' });
            } else {
                // Tạo sản phẩm mới
                await createProduct(productData);
                enqueueSnackbar('Tạo sản phẩm mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchProducts();
        } catch (error: any) {
            console.error('Lỗi khi lưu sản phẩm:', error);
            if (error.response) {
                console.error('Lỗi response:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu sản phẩm', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await deleteProduct(id);
                enqueueSnackbar('Xóa sản phẩm thành công!', { variant: 'success' });
                fetchProducts();
            } catch (error) {
                console.error('Lỗi khi xóa sản phẩm:', error);
                enqueueSnackbar('Không thể xóa sản phẩm', { variant: 'error' });
            }
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleOpenPromotionDialog = async (product: Product) => {
        setSelectedProduct(product);
        setOpenPromotionDialog(true);
        setPromoTabValue(0);
        await fetchProductPromotions(product.product_id);
    };
    
    const handleClosePromotionDialog = () => {
        setOpenPromotionDialog(false);
        setSelectedProduct(null);
        setProductPromotions([]);
    };
    
    const fetchProductPromotions = async (productId: number) => {
        try {
            setLoadingPromotions(true);
            const response = await getProductPromotions(productId);
            setProductPromotions(response.data);
        } catch (error) {
            console.error('Không thể lấy danh sách khuyến mãi của sản phẩm:', error);
            enqueueSnackbar('Không thể lấy danh sách khuyến mãi', { variant: 'error' });
        } finally {
            setLoadingPromotions(false);
        }
    };
    
    const handleAddPromotion = () => {
        navigate('/promotions', { state: { selectedProductId: selectedProduct?.product_id } });
        handleClosePromotionDialog();
    };
    
    const handlePromoTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setPromoTabValue(newValue);
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý Sản phẩm</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                    >
                        Thêm Sản phẩm
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Hình ảnh</TableCell>
                                <TableCell>Tên sản phẩm</TableCell>
                                <TableCell>Danh mục</TableCell>
                                <TableCell>Giá</TableCell>
                                <TableCell>Tồn kho</TableCell>
                                <TableCell>Đã bán</TableCell>
                                <TableCell>Khuyến mãi</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.product_id}>
                                        <TableCell>{product.product_id}</TableCell>
                                        <TableCell>
                                            {product.images && product.images.length > 0 ? (
                                                <Avatar 
                                                    src={product.images.find(img => img.is_primary)?.image_url || product.images[0].image_url} 
                                                    alt={product.name}
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
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.category_name}</TableCell>
                                        <TableCell>
                                            {product.has_active_promotion && product.discounted_price !== product.price ? (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            textDecoration: 'line-through',
                                                            color: 'text.secondary'
                                                        }}
                                                    >
                                                        {formatPrice(product.price)}
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{ color: 'error.main', fontWeight: 'bold' }}
                                                    >
                                                        {formatPrice(product.discounted_price ?? product.price)}
                                                        {product.discount_percentage && (
                                                            <Typography 
                                                                component="span" 
                                                                sx={{ ml: 1, fontSize: '0.85rem', color: 'error.main' }}
                                                            >
                                                                (-{product.discount_percentage}%)
                                                            </Typography>
                                                        )}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                formatPrice(product.price)
                                            )}
                                        </TableCell>
                                        <TableCell>{product.stock_quantity}</TableCell>
                                        <TableCell>{product.sold_quantity}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Xem khuyến mãi">
                                                <IconButton 
                                                    onClick={() => handleOpenPromotionDialog(product)}
                                                    color={product.has_active_promotion ? "error" : "primary"}
                                                >
                                                    <LocalOfferIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(product)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(product.product_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog Thêm/Sửa Sản phẩm */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog} 
                    maxWidth="md" 
                    fullWidth
                >
                    <DialogTitle>{editingProduct ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</DialogTitle>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="product edit tabs">
                            <Tab label="Thông tin cơ bản" />
                            <Tab label="Hình ảnh" />
                            <Tab label="Thông số kỹ thuật" />
                        </Tabs>
                    </Box>
                    <DialogContent>
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Tên sản phẩm"
                                    name="name"
                                    value={formData.name}
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
                                <GridContainer>
                                    <GridItemHalf>
                                        <TextField
                                            fullWidth
                                            label="Giá (VNĐ)"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleTextFieldChange}
                                            type="number"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                                            }}
                                            required
                                        />
                                    </GridItemHalf>
                                    <GridItemHalf>
                                        <TextField
                                            fullWidth
                                            label="Số lượng tồn kho"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleTextFieldChange}
                                            type="number"
                                            required
                                        />
                                    </GridItemHalf>
                                </GridContainer>
                                <FormControl fullWidth required>
                                    <InputLabel id="category-select-label">Danh mục</InputLabel>
                                    <Select
                                        labelId="category-select-label"
                                        value={formData.category}
                                        label="Danh mục"
                                        name="category"
                                        onChange={handleSelectChange}
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category.category_id} value={category.category_id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Hình ảnh sản phẩm
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
                                                alt="Product"
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
                        
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <DescriptionIcon sx={{ mr: 1 }} />
                                    Thông số kỹ thuật sản phẩm
                                </Typography>
                                
                                <TextField
                                    fullWidth
                                    label="Thông số kỹ thuật"
                                    name="specification"
                                    value={formData.specification}
                                    onChange={handleTextFieldChange}
                                    multiline
                                    rows={10}
                                    placeholder="Nhập thông số kỹ thuật của sản phẩm..."
                                    helperText="Bạn có thể sử dụng định dạng Markdown"
                                />
                            </Box>
                        </TabPanel>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button onClick={handleSubmit} variant="contained">Lưu</Button>
                    </DialogActions>
                </Dialog>
                
                {/* Dialog Xem Khuyến mãi của Sản phẩm */}
                <Dialog open={openPromotionDialog} onClose={handleClosePromotionDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        Khuyến mãi cho sản phẩm: {selectedProduct?.name}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={promoTabValue} onChange={handlePromoTabChange}>
                                <Tab label="Khuyến mãi đang áp dụng" />
                            </Tabs>
                        </Box>
                        <TabPanel value={promoTabValue} index={0}>
                            {loadingPromotions ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <Typography>Đang tải khuyến mãi...</Typography>
                                </Box>
                            ) : productPromotions.length === 0 ? (
                                <Box sx={{ my: 2 }}>
                                    <Typography>Chưa có khuyến mãi nào cho sản phẩm này</Typography>
                                </Box>
                            ) : (
                                <List>
                                    {productPromotions.map((promotion, index) => (
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
                                            {index < productPromotions.length - 1 && <Divider />}
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

export default ProductManagement; 