import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Card, CardContent, InputAdornment } from '@mui/material';
import { Grid } from '@mui/material';
import Layout from '../components/Layout';
import { getSocialMediaUrls, updateSocialMediaUrls } from '../services/api';
import { SocialMediaUrls } from '../types';
import { useSnackbar } from 'notistack';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TagIcon from '@mui/icons-material/Tag';

const SocialMediaURLsManagement: React.FC = () => {
    const [urls, setUrls] = useState<SocialMediaUrls | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        facebook: '',
        instagram: '',
        twitter: '',
        discord: '',
        youtube: ''
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchSocialMediaUrls();
    }, []);

    const fetchSocialMediaUrls = async () => {
        try {
            setLoading(true);
            const response = await getSocialMediaUrls();
            setUrls(response.data);
            setFormData({
                facebook: response.data.facebook || '',
                instagram: response.data.instagram || '',
                twitter: response.data.twitter || '',
                discord: response.data.discord || '',
                youtube: response.data.youtube || ''
            });
        } catch (error) {
            console.error('Không thể lấy dữ liệu URLs mạng xã hội:', error);
            enqueueSnackbar('Không thể lấy thông tin URLs mạng xã hội', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await updateSocialMediaUrls(formData);
            enqueueSnackbar('Cập nhật URLs mạng xã hội thành công', { variant: 'success' });
            fetchSocialMediaUrls();
        } catch (error) {
            console.error('Lỗi khi cập nhật URLs mạng xã hội:', error);
            enqueueSnackbar('Không thể cập nhật URLs mạng xã hội', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const isValidUrl = (url: string) => {
        if (!url) return true; // Empty URLs are valid
        
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    const isFormValid = () => {
        return (
            isValidUrl(formData.facebook) &&
            isValidUrl(formData.instagram) &&
            isValidUrl(formData.twitter) &&
            isValidUrl(formData.discord) &&
            isValidUrl(formData.youtube)
        );
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Quản lý URLs Mạng Xã Hội</Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Paper sx={{ p: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
                                <Box gridColumn="span 12">
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        Cập nhật các đường dẫn (URLs) đến trang mạng xã hội của bạn. Các URLs này sẽ được hiển thị trên trang web khách hàng.
                                    </Typography>
                                </Box>
                                
                                <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                    <TextField
                                        fullWidth
                                        label="Facebook"
                                        name="facebook"
                                        value={formData.facebook}
                                        onChange={handleInputChange}
                                        placeholder="https://facebook.com/yourpage"
                                        helperText={!isValidUrl(formData.facebook) ? "URL không hợp lệ" : ""}
                                        error={!isValidUrl(formData.facebook)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <FacebookIcon style={{ color: '#1877F2' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                
                                <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                    <TextField
                                        fullWidth
                                        label="Instagram"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleInputChange}
                                        placeholder="https://instagram.com/yourpage"
                                        helperText={!isValidUrl(formData.instagram) ? "URL không hợp lệ" : ""}
                                        error={!isValidUrl(formData.instagram)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <InstagramIcon style={{ color: '#E1306C' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                
                                <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                    <TextField
                                        fullWidth
                                        label="X (Twitter)"
                                        name="twitter"
                                        value={formData.twitter}
                                        onChange={handleInputChange}
                                        placeholder="https://twitter.com/yourpage"
                                        helperText={!isValidUrl(formData.twitter) ? "URL không hợp lệ" : ""}
                                        error={!isValidUrl(formData.twitter)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <TwitterIcon style={{ color: '#1DA1F2' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                
                                <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                    <TextField
                                        fullWidth
                                        label="Discord"
                                        name="discord"
                                        value={formData.discord}
                                        onChange={handleInputChange}
                                        placeholder="https://discord.gg/yourinvite"
                                        helperText={!isValidUrl(formData.discord) ? "URL không hợp lệ" : ""}
                                        error={!isValidUrl(formData.discord)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <TagIcon style={{ color: '#7289DA' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                
                                <Box gridColumn={{ xs: "span 12", md: "span 6" }}>
                                    <TextField
                                        fullWidth
                                        label="YouTube"
                                        name="youtube"
                                        value={formData.youtube}
                                        onChange={handleInputChange}
                                        placeholder="https://youtube.com/yourchannel"
                                        helperText={!isValidUrl(formData.youtube) ? "URL không hợp lệ" : ""}
                                        error={!isValidUrl(formData.youtube)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <YouTubeIcon style={{ color: '#FF0000' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                
                                <Box gridColumn="span 12">
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        disabled={saving || !isFormValid()}
                                        sx={{ mt: 2 }}
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                        
                        {urls && urls.updated_at && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Cập nhật lần cuối: {new Date(urls.updated_at).toLocaleString()}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                )}
                
                <Card sx={{ mt: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Xem trước
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Dưới đây là giao diện xem trước các biểu tượng mạng xã hội của bạn:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            {formData.facebook && (
                                <a href={formData.facebook} target="_blank" rel="noopener noreferrer">
                                    <FacebookIcon style={{ color: '#1877F2', fontSize: 30 }} />
                                </a>
                            )}
                            
                            {formData.instagram && (
                                <a href={formData.instagram} target="_blank" rel="noopener noreferrer">
                                    <InstagramIcon style={{ color: '#E1306C', fontSize: 30 }} />
                                </a>
                            )}
                            
                            {formData.twitter && (
                                <a href={formData.twitter} target="_blank" rel="noopener noreferrer">
                                    <TwitterIcon style={{ color: '#1DA1F2', fontSize: 30 }} />
                                </a>
                            )}
                            
                            {formData.discord && (
                                <a href={formData.discord} target="_blank" rel="noopener noreferrer">
                                    <TagIcon style={{ color: '#7289DA', fontSize: 30 }} />
                                </a>
                            )}
                            
                            {formData.youtube && (
                                <a href={formData.youtube} target="_blank" rel="noopener noreferrer">
                                    <YouTubeIcon style={{ color: '#FF0000', fontSize: 30 }} />
                                </a>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Layout>
    );
};

export default SocialMediaURLsManagement; 