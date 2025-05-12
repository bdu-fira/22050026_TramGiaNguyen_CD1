import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemIcon, ListItemText,
    Divider, IconButton, Typography, Container, Avatar, Menu, MenuItem, Tooltip, ListItemButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { MENU_ITEMS } from '../App';
import { useAuth } from '../contexts/AuthContext';

// Ánh xạ giữa path và tên trang để kiểm tra quyền
const PATH_TO_PAGE_NAME: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/admins': 'Quản lý Admin',
    '/users': 'Quản lý người dùng',
    '/categories': 'Quản lý danh mục',
    '/products': 'Quản lý sản phẩm',
    '/promotions': 'Quản lý khuyến mãi',
    '/orders': 'Quản lý đơn hàng',
    '/blogs': 'Quản lý bài viết',
    '/social-media': 'Quản lý mạng xã hội',
    '/faqs': 'Quản lý FAQ',
    '/privacy': 'Quản lý chính sách bảo mật',
    '/terms': 'Quản lý điều khoản sử dụng'
};

const drawerWidth = 240;

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { admin, logout, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Lọc menu items theo quyền của người dùng
    const filteredMenuItems = MENU_ITEMS.filter(item => {
        const pageName = PATH_TO_PAGE_NAME[item.path];
        if (!pageName) return true; // Nếu không tìm thấy tên trang, vẫn hiển thị (để an toàn)
        return hasPermission(pageName, 'read');
    });

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Admin Panel
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {filteredMenuItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                            sx={{
                                backgroundColor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                },
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.name} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {MENU_ITEMS.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Tài khoản">
                            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                                <Avatar alt={admin?.username} />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem disabled>
                                <Typography variant="body2">{admin?.username}</Typography>
                            </MenuItem>
                            <MenuItem disabled>
                                <Typography variant="body2">Vai trò: {admin?.role}</Typography>
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Đăng xuất" />
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, marginTop: '64px' }}
            >
                <Container maxWidth="lg">{children}</Container>
            </Box>
        </Box>
    );
};

export default Layout; 