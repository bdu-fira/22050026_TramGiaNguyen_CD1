import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, 
    TextField, Chip, Tooltip, Card, CardMedia, CardContent,
    Tab, Tabs, CircularProgress, Container, Grid, Stack
} from '@mui/material';
import { GridProps } from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML, AtomicBlockUtils } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { getBlogs, getBlog, createBlog, updateBlog, deleteBlog } from '../services/api';
import { Blog, BlogImage } from '../types';
import { useSnackbar } from 'notistack';
import Layout from '../components/Layout';
import axios from 'axios';

// Cloudinary configuration
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
            id={`blog-tabpanel-${index}`}
            aria-labelledby={`blog-tab-${index}`}
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

// Format date for display
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const BlogManagement: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    
    // Form data với EditorState
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    
    // Images
    const [uploadedImages, setUploadedImages] = useState<{file: File, cloudinaryUrl: string}[]>([]);
    const [selectedImages, setSelectedImages] = useState<BlogImage[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number | null>(null);
    
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentFieldRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await getBlogs();
            setBlogs(response.data);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            enqueueSnackbar('Không thể lấy danh sách bài viết', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Hàm chuyển đổi từ HTML sang EditorState
    const createEditorStateFromHTML = (html: string) => {
        if (!html) return EditorState.createEmpty();
        
        const blocksFromHTML = htmlToDraft(html);
        const contentState = ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap
        );
        return EditorState.createWithContent(contentState);
    };

    // Hàm chuyển đổi từ EditorState sang HTML
    const getHTMLFromEditorState = (editorState: any) => {
        return draftToHtml(convertToRaw(editorState.getCurrentContent()));
    };

    const handleOpenDialog = (blog?: Blog) => {
        if (blog) {
            setEditingBlog(blog);
            setFormData({
                title: blog.title,
                content: blog.content,
            });
            setEditorState(createEditorStateFromHTML(blog.content));
            
            // Lưu trữ các hình ảnh hiện có của bài viết
            const existingImages = blog.images || [];
            setSelectedImages(existingImages);
            
            // Tạo danh sách uploadedImages từ selectedImages để hiển thị trong phần chèn nhanh
            const uploadedImgs = existingImages.map(img => ({
                file: new File([], img.image_url.split('/').pop() || 'image.jpg', { type: 'image/jpeg' }),
                cloudinaryUrl: img.image_url
            }));
            setUploadedImages(uploadedImgs);
            
            // Đặt primary image index
            const primaryImage = existingImages.find(img => img.is_primary);
            setPrimaryImageIndex(primaryImage ? existingImages.indexOf(primaryImage) : null);
        } else {
            setEditingBlog(null);
            setFormData({
                title: '',
                content: '',
            });
            setEditorState(EditorState.createEmpty());
            setSelectedImages([]);
            setUploadedImages([]);
            setPrimaryImageIndex(null);
        }
        setOpenDialog(true);
        setTabValue(0);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingBlog(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            content: value
        }));
        
        // Lưu vị trí con trỏ hiện tại
        if (e.target instanceof HTMLTextAreaElement) {
            setCursorPosition(e.target.selectionStart);
        }
    };

    // Upload image to Cloudinary
    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        try {
            setUploading(true);
            const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
            setUploading(false);
            return response.data.secure_url;
        } catch (error) {
            setUploading(false);
            console.error('Error uploading to Cloudinary:', error);
            enqueueSnackbar('Lỗi khi tải ảnh lên Cloudinary', { variant: 'error' });
            throw new Error('Failed to upload image to Cloudinary');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            try {
                setUploading(true);
                const filesArray = Array.from(e.target.files);
                
                // Upload each file to Cloudinary
                const uploadPromises = filesArray.map(async (file) => {
                    const cloudinaryUrl = await uploadToCloudinary(file);
                    return { file, cloudinaryUrl };
                });
                
                const uploadedResults = await Promise.all(uploadPromises);
                setUploadedImages(prev => [...prev, ...uploadedResults]);
                
                enqueueSnackbar('Tải ảnh lên thành công!', { variant: 'success' });
            } catch (error) {
                console.error('Error uploading images:', error);
                enqueueSnackbar('Lỗi khi tải ảnh lên', { variant: 'error' });
            } finally {
                setUploading(false);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        // Lấy thông tin hình ảnh cần xóa
        const imageToRemove = uploadedImages[index];
        
        // Xóa khỏi uploadedImages
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
        
        // Xóa khỏi selectedImages nếu cũng có ở đó
        const selectedIndex = selectedImages.findIndex(img => img.image_url === imageToRemove.cloudinaryUrl);
        if (selectedIndex !== -1) {
            setSelectedImages(prev => prev.filter((_, i) => i !== selectedIndex));
        }
        
        // Update primary image index if needed
        if (primaryImageIndex === index) {
            setPrimaryImageIndex(null);
        } else if (primaryImageIndex !== null && primaryImageIndex > index) {
            setPrimaryImageIndex(primaryImageIndex - 1);
        }
        
        console.log('Đã xóa hình ảnh tải lên:', imageToRemove.cloudinaryUrl);
    };

    const handleRemoveExistingImage = (index: number) => {
        // Lấy thông tin hình ảnh cần xóa
        const imageToRemove = selectedImages[index];
        
        // Xóa khỏi mảng selectedImages
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        
        // Xóa khỏi mảng uploadedImages nếu có
        const uploadedIndex = uploadedImages.findIndex(img => img.cloudinaryUrl === imageToRemove.image_url);
        if (uploadedIndex !== -1) {
            setUploadedImages(prev => prev.filter((_, i) => i !== uploadedIndex));
        }
        
        // Update primary image index if needed
        if (primaryImageIndex === uploadedIndex) {
            setPrimaryImageIndex(null);
        } else if (primaryImageIndex !== null && primaryImageIndex > uploadedIndex && uploadedIndex !== -1) {
            setPrimaryImageIndex(primaryImageIndex - 1);
        }
        
        console.log(`Đã xóa hình ảnh ID ${imageToRemove.image_id}`);
    };

    const handleSetPrimaryImage = (index: number, isUploaded: boolean = false) => {
        if (isUploaded) {
            // Uploaded images
            setPrimaryImageIndex(index);
        } else {
            // Existing images
            setPrimaryImageIndex(uploadedImages.length + index);
        }
    };

    // Hàm chèn hình ảnh vào Editor
    const insertImageToEditor = (imageUrl: string) => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity(
            'IMAGE',
            'IMMUTABLE',
            { src: imageUrl, alt: 'Blog image', height: 'auto', width: '100%' }
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
        
        setEditorState(AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' '));
    };

    // Hàm xử lý khi Editor thay đổi
    const handleEditorStateChange = (newEditorState: any) => {
        setEditorState(newEditorState);
        // Cập nhật formData.content để tương thích với code hiện tại
            setFormData(prev => ({
                ...prev,
            content: getHTMLFromEditorState(newEditorState)
        }));
    };

    const handleSubmit = async () => {
        // Validate data
        if (!formData.title || !editorState.getCurrentContent().hasText()) {
            enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'error' });
            return;
        }
        
        try {
            // Chuyển đổi từ EditorState sang HTML
            const htmlContent = getHTMLFromEditorState(editorState);
            
            // Prepare blog data
            const blogData: any = {
                title: formData.title,
                content: htmlContent,
                images: []
            };
            
            // Thêm hình ảnh mới đã tải lên (chưa có trong danh sách selectedImages)
            const uploadedImageUrls = uploadedImages.map(img => img.cloudinaryUrl);
            
            // Chỉ thêm những hình ảnh đã tải lên mà không có trong selectedImages
                uploadedImages.forEach((img, index) => {
                const isExisting = selectedImages.some(existing => existing.image_url === img.cloudinaryUrl);
                if (!isExisting) {
                    blogData.images.push({
                        image_url: img.cloudinaryUrl,
                        is_primary: primaryImageIndex === index
                });
            }
            });
            
            // Thêm hình ảnh hiện có (selectedImages) mà vẫn được giữ lại (không bị xóa)
            if (selectedImages.length > 0) {
                selectedImages.forEach((image, index) => {
                    // Tính chỉ số thực tế trong mảng uploadedImages
                    const uploadedIndex = uploadedImages.findIndex(img => img.cloudinaryUrl === image.image_url);
                    
                    blogData.images.push({
                        image_id: image.image_id,
                        image_url: image.image_url,
                        is_primary: primaryImageIndex === uploadedIndex
                    });
                });
            }
            
            console.log('Gửi dữ liệu lên server:', blogData);
            
            if (editingBlog) {
                // Update blog
                await updateBlog(editingBlog.blog_id, blogData);
                enqueueSnackbar('Cập nhật bài viết thành công!', { variant: 'success' });
            } else {
                // Create new blog
                await createBlog(blogData);
                enqueueSnackbar('Tạo bài viết mới thành công!', { variant: 'success' });
            }
            
            handleCloseDialog();
            fetchBlogs();
        } catch (error: any) {
            console.error('Error saving blog:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
                enqueueSnackbar(`Lỗi: ${JSON.stringify(error.response.data)}`, { variant: 'error' });
            } else {
                enqueueSnackbar('Lỗi khi lưu dữ liệu bài viết', { variant: 'error' });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            try {
                await deleteBlog(id);
                enqueueSnackbar('Xóa bài viết thành công!', { variant: 'success' });
                fetchBlogs();
            } catch (error) {
                console.error('Error deleting blog:', error);
                enqueueSnackbar('Không thể xóa bài viết', { variant: 'error' });
            }
        }
    };

    const handlePreview = (blog: Blog) => {
        setPreviewBlog(blog);
        setOpenPreviewDialog(true);
    };

    // Cấu hình trình soạn thảo
    const toolbar = {
        options: ['inline', 'blockType', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'image', 'remove', 'history'],
        inline: {
            options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'],
            bold: { className: 'bordered-option-classname' },
            italic: { className: 'bordered-option-classname' },
            underline: { className: 'bordered-option-classname' },
            strikethrough: { className: 'bordered-option-classname' },
            monospace: { className: 'bordered-option-classname' },
        },
        blockType: {
            options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
            className: 'bordered-option-classname',
        },
        list: {
            options: ['unordered', 'ordered'],
            unordered: { className: 'bordered-option-classname' },
            ordered: { className: 'bordered-option-classname' },
        },
        textAlign: {
            options: ['left', 'center', 'right', 'justify'],
            left: { className: 'bordered-option-classname' },
            center: { className: 'bordered-option-classname' },
            right: { className: 'bordered-option-classname' },
            justify: { className: 'bordered-option-classname' },
        },
        colorPicker: {
            className: 'bordered-option-classname',
            popupClassName: 'rdw-colorpicker-modal',
        },
        link: {
            options: ['link', 'unlink'],
            link: { className: 'bordered-option-classname' },
            unlink: { className: 'bordered-option-classname' },
            defaultTargetOption: '_blank',
            showOpenOptionOnHover: true,
            popupClassName: 'rdw-link-modal',
            linkCallback: undefined
        },
        embedded: {
            className: 'bordered-option-classname',
            popupClassName: 'rdw-embedded-modal',
            defaultSize: {
                height: 'auto',
                width: '100%',
            },
        },
        image: {
            className: 'bordered-option-classname',
            popupClassName: 'rdw-image-modal',
            urlEnabled: true,
            uploadEnabled: true,
            alignmentEnabled: true,
            uploadCallback: async (file: File) => {
                try {
                    setUploading(true);
                    console.log('Uploading image to Cloudinary...', file.name);
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    
                    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    setUploading(false);
                    
                    if (data.secure_url) {
                        // Thêm vào danh sách ảnh đã tải lên
                        setUploadedImages(prev => [...prev, { file, cloudinaryUrl: data.secure_url }]);
                        enqueueSnackbar('Tải ảnh lên thành công!', { variant: 'success' });
                        console.log('Image uploaded successfully:', data.secure_url);
                        return { data: { link: data.secure_url } };
                    }
                    throw new Error('Upload failed');
                } catch (error) {
                    setUploading(false);
                    console.error('Error uploading image:', error);
                    enqueueSnackbar('Lỗi khi tải ảnh lên', { variant: 'error' });
                    throw error;
                }
            },
            previewImage: true,
            inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
            alt: { present: true, mandatory: false },
            defaultSize: {
                height: 'auto',
                width: '100%',
            },
        },
        remove: { className: 'bordered-option-classname' },
        history: {
            undo: { className: 'bordered-option-classname' },
            redo: { className: 'bordered-option-classname' },
        },
    };

    return (
        <Layout>
            <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    Quản lý bài viết
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleOpenDialog()}
                        sx={{ mb: 3 }}
                        color="primary"
                        size="large"
                >
                    Tạo bài viết mới
                </Button>
                
                    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                    <Table>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tiêu đề</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Hình ảnh</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ngày tạo</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                <CircularProgress />
                                            </Box>
                                        </TableCell>
                                </TableRow>
                            ) : blogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                blogs.map((blog) => (
                                        <TableRow key={blog.blog_id} hover>
                                        <TableCell>{blog.blog_id}</TableCell>
                                            <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {blog.title}
                                            </TableCell>
                                        <TableCell>
                                            {blog.images?.length ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {blog.images.slice(0, 3).map((image, index) => (
                                                        <Box 
                                                            key={image.image_id}
                                                            component="img"
                                                            src={image.image_url}
                                                            alt={`Image ${index + 1}`}
                                                            sx={{ 
                                                                width: 50, 
                                                                height: 50, 
                                                                objectFit: 'cover',
                                                                    border: image.is_primary ? '2px solid blue' : 'none',
                                                                    borderRadius: '4px'
                                                            }}
                                                        />
                                                    ))}
                                                    {blog.images.length > 3 && (
                                                        <Chip 
                                                            label={`+${blog.images.length - 3}`} 
                                                            size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            ) : (
                                                <Chip 
                                                    icon={<ImageIcon />} 
                                                    label="Không có hình ảnh" 
                                                    size="small"
                                                    color="default"
                                                        variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(blog.created_at)}</TableCell>
                                        <TableCell align="right">
                                                <Tooltip title="Xem trước">
                                                    <IconButton onClick={() => handlePreview(blog)} size="small">
                                                <VisibilityIcon />
                                            </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Sửa">
                                                    <IconButton onClick={() => handleOpenDialog(blog)} size="small">
                                                <EditIcon />
                                            </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa">
                                                    <IconButton onClick={() => handleDelete(blog.blog_id)} size="small" color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                                </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                </Box>

                {/* Dialog Thêm/Sửa Blog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                    <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        {editingBlog ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                    </DialogTitle>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Nội dung" />
                            <Tab label="Hình ảnh" />
                        </Tabs>
                    </Box>
                    <DialogContent>
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Tiêu đề"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    margin="normal"
                                    required
                                    sx={{ mb: 3 }}
                                    variant="outlined"
                                />
                                
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                    Nội dung
                                </Typography>
                                
                                <Paper variant="outlined" sx={{ mb: 1, position: 'relative' }}>
                                    <Box sx={{ p: 0 }}>
                                        {uploading && (
                                            <Box sx={{ 
                                                position: 'absolute', 
                                                top: '50%', 
                                                left: '50%', 
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 1000,
                                                bgcolor: 'rgba(255,255,255,0.8)',
                                                padding: 2,
                                                borderRadius: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                boxShadow: 3
                                            }}>
                                                <CircularProgress size={40} />
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    Đang tải hình ảnh lên...
                                    </Typography>
                                            </Box>
                                        )}
                                        <Editor
                                            editorState={editorState}
                                            onEditorStateChange={handleEditorStateChange}
                                            wrapperClassName="editor-wrapper"
                                            editorClassName="editor-main"
                                            toolbarClassName="editor-toolbar"
                                            toolbar={toolbar}
                                            onFocus={() => {
                                                console.log('Editor focused');
                                                    }}
                                                />
                                            </Box>
                                </Paper>
                                
                                {/* Custom CSS cho Editor */}
                                <style dangerouslySetInnerHTML={{__html: `
                                    .editor-wrapper {
                                        border: 1px solid #f1f1f1;
                                        padding: 0;
                                        border-radius: 4px;
                                    }
                                    .editor-toolbar {
                                        border-bottom: 1px solid #f1f1f1;
                                        background-color: #f9f9f9;
                                        padding: 6px !important;
                                    }
                                    .editor-main {
                                        padding: 10px 14px;
                                        min-height: 300px;
                                        font-family: 'Arial', sans-serif;
                                        font-size: 16px;
                                        line-height: 1.6;
                                    }
                                    .editor-main img {
                                        max-width: 100%;
                                        display: block;
                                        margin: 10px auto;
                                        border-radius: 4px;
                                    }
                                    .bordered-option-classname {
                                        border: 1px solid #F1F1F1;
                                        padding: 5px;
                                        min-width: 25px;
                                        height: 20px;
                                        border-radius: 2px;
                                        margin: 0 4px;
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        cursor: pointer;
                                        background: white;
                                        text-transform: capitalize;
                                    }
                                    .bordered-option-classname:hover {
                                        box-shadow: 1px 1px 0px #BFBDBD;
                                    }
                                    .bordered-option-classname:active {
                                        box-shadow: 1px 1px 0px #BFBDBD inset;
                                    }
                                    .rdw-option-active {
                                        box-shadow: 1px 1px 0px #BFBDBD inset;
                                        background-color: #f1f1f1;
                                    }
                                    
                                    /* Làm nổi bật nút upload */
                                    .rdw-option-wrapper[aria-label="Image"] {
                                        background-color: #f0f8ff;
                                        border-color: #b8d0e8;
                                    }
                                    
                                    .rdw-option-wrapper[aria-label="Image"]:hover {
                                        background-color: #e0f0ff;
                                        border-color: #a0c0e0;
                                        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                                    }
                                    
                                    /* Image modal customization */
                                    .rdw-image-modal {
                                        position: absolute;
                                        top: 35px;
                                        left: 5px;
                                        display: flex;
                                        flex-direction: column;
                                        width: 325px;
                                        border: 1px solid #F1F1F1;
                                        padding: 15px;
                                        border-radius: 2px;
                                        z-index: 100;
                                        background: white;
                                        box-shadow: 3px 3px 5px #BFBDBD;
                                    }
                                    
                                    .rdw-image-modal-header {
                                        padding: 10px;
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 15px;
                                        margin: 10px 0;
                                    }
                                    
                                    .rdw-image-modal-header-option {
                                        width: 33%;
                                        text-align: center;
                                        cursor: pointer;
                                        padding: 5px;
                                        border-bottom: 2px solid transparent;
                                        font-weight: bold;
                                    }
                                    
                                    .rdw-image-modal-header-option-highlighted {
                                        border-bottom: 2px solid #2196F3;
                                        color: #2196F3;
                                    }
                                    
                                    .rdw-image-modal-upload-option {
                                        width: 100%;
                                        color: #333;
                                        cursor: pointer;
                                        display: flex;
                                        padding: 10px;
                                        border: 1px solid #f1f1f1;
                                        border-radius: 2px;
                                        margin: 5px 0;
                                        text-align: center;
                                        align-items: center;
                                        justify-content: center;
                                    }
                                    
                                    .rdw-image-modal-upload-option-highlighted {
                                        background-color: #f1f1f1;
                                    }
                                    
                                    .rdw-image-modal-upload-option-label {
                                        font-size: 15px;
                                        text-align: center;
                                    }
                                    
                                    .rdw-image-modal-upload-option-input {
                                        width: 0.1px;
                                        height: 0.1px;
                                        opacity: 0;
                                        overflow: hidden;
                                        position: absolute;
                                        z-index: -1;
                                    }
                                    
                                    .rdw-image-modal-btn {
                                        margin: 5px 0;
                                        background: #f1f1f1;
                                        border: none;
                                        color: #333;
                                        padding: 10px;
                                        border-radius: 2px;
                                        cursor: pointer;
                                        font-size: 14px;
                                    }
                                    
                                    .rdw-image-modal-btn:hover {
                                        background: #e8e8e8;
                                    }
                                    
                                    .rdw-image-modal-btn:disabled {
                                        background: #ece9e9;
                                        color: #999;
                                        cursor: not-allowed;
                                    }
                                `}} />
                            </Box>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Tải lên hình ảnh
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    disabled={uploading}
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={uploading ? <CircularProgress size={20} /> : <AddPhotoAlternateIcon />}
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ mb: 3 }}
                                    disabled={uploading}
                                    fullWidth
                                >
                                    {uploading ? 'Đang tải lên...' : 'Chọn hình ảnh'}
                                </Button>
                                
                                {/* Hiển thị tất cả hình ảnh đã tải lên */}
                                {uploadedImages.length > 0 && (
                                    <Box sx={{ mt: 3, mb: 4 }}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                                            Tất cả hình ảnh ({uploadedImages.length})
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" spacing={2}>
                                            {uploadedImages.map((img, index) => (
                                                <Box 
                                                    key={`uploaded-${index}`}
                                                    sx={{ width: { xs: '100%', sm: '47%', md: '23%' }, mb: 2 }}
                                                >
                                                    <Card 
                                                        variant="outlined"
                                                        sx={{
                                                            borderColor: primaryImageIndex === index ? 'primary.main' : 'inherit',
                                                            borderWidth: primaryImageIndex === index ? 2 : 1,
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {primaryImageIndex === index && (
                                                            <Box 
                                                                sx={{ 
                                                                    position: 'absolute', 
                                                                    top: 0, 
                                                                    right: 0, 
                                                                    bgcolor: 'primary.main',
                                                                    color: 'white',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderBottomLeftRadius: 8,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                Ảnh chính
                                                            </Box>
                                                        )}
                                                        <CardMedia
                                                            component="img"
                                                            height="140"
                                                            image={img.cloudinaryUrl}
                                                            alt={`Uploaded ${index + 1}`}
                                                            sx={{ objectFit: 'cover' }}
                                                        />
                                                        <CardContent sx={{ p: 1 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Tooltip title="Đặt làm ảnh chính">
                                                                    <IconButton 
                                                                        size="small"
                                                                        color={primaryImageIndex === index ? "primary" : "default"}
                                                                        onClick={() => handleSetPrimaryImage(index, true)}
                                                                    >
                                                                        <ImageIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Chèn vào nội dung">
                                                                    <IconButton 
                                                                        size="small"
                                                                        color="info"
                                                                        onClick={() => {
                                                                            insertImageToEditor(img.cloudinaryUrl);
                                                                            setTabValue(0); // Chuyển về tab nội dung sau khi chèn
                                                                            enqueueSnackbar('Đã chèn hình ảnh vào nội dung', { variant: 'success' });
                                                                        }}
                                                                    >
                                                                        <InsertPhotoIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Xóa">
                                                                    <IconButton 
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleRemoveImage(index)}
                                                                    >
                                                                        <DeleteOutlineIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Box>
                                            ))}
                                        </Stack>
                                        </Box>
                                )}
                                
                                {uploadedImages.length === 0 && (
                                    <Box sx={{ textAlign: 'center', my: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                        <Typography color="text.secondary">Chưa có hình ảnh nào được tải lên</Typography>
                                    </Box>
                                )}
                            </Box>
                        </TabPanel>
                    </DialogContent>
                    <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                        <Button onClick={handleCloseDialog} variant="outlined">Hủy</Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained" 
                            color="primary"
                            disabled={uploading}
                        >
                            {uploading ? 'Đang xử lý...' : 'Lưu'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog xem trước */}
                <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        Xem trước: {previewBlog?.title}
                    </DialogTitle>
                    <DialogContent sx={{ padding: 3 }}>
                        {previewBlog && (
                            <Box sx={{ 
                                bgcolor: 'white', 
                                borderRadius: 1,
                                p: 2,
                                '& img': {
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '4px',
                                    margin: '15px 0'
                                },
                                '& p': {
                                    margin: '1em 0',
                                    lineHeight: 1.6
                                },
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    marginTop: '1.5em',
                                    marginBottom: '0.5em'
                                },
                                '& ul, & ol': {
                                    marginLeft: '20px',
                                    marginBottom: '1em'
                                }
                            }}>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {previewBlog.title}
                                </Typography>
                                
                                {previewBlog.images && previewBlog.images.find(img => img.is_primary) && (
                                    <Box 
                                        component="img"
                                        src={previewBlog.images.find(img => img.is_primary)?.image_url}
                                        alt="Primary image"
                                        sx={{ 
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '400px',
                                            objectFit: 'contain',
                                            mb: 3,
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                )}
                                
                                <Box 
                                    dangerouslySetInnerHTML={{ __html: previewBlog.content }}
                                    sx={{ 
                                        pb: 2,
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.6,
                                        fontSize: '1rem',
                                        color: 'text.primary'
                                    }}
                                />
                                
                                <Box sx={{ mt: 3, textAlign: 'right', color: 'text.secondary' }}>
                                    <Typography variant="caption">
                                        Ngày đăng: {formatDate(previewBlog.created_at)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenPreviewDialog(false)}>Đóng</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Layout>
    );
};

export default BlogManagement; 