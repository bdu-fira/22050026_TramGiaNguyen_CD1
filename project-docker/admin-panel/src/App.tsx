import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DiscountIcon from '@mui/icons-material/Discount';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArticleIcon from '@mui/icons-material/Article';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import GavelIcon from '@mui/icons-material/Gavel';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import LinkIcon from '@mui/icons-material/Link';
import MailIcon from '@mui/icons-material/Mail';

import { AuthProvider } from './contexts/AuthContext';
import PermissionRoute from './components/PermissionRoute';
import SessionTimeoutDialog from './components/SessionTimeoutDialog';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminManagement from './pages/AdminManagement';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import ProductManagement from './pages/ProductManagement';
import PromotionManagement from './pages/PromotionManagement';
import OrderManagement from './pages/OrderManagement';
import BlogManagement from './pages/BlogManagement';
import SocialMediaURLsManagement from './pages/SocialMediaURLsManagement';
import FAQManagement from './pages/FAQManagement';
import PrivacyPolicyManagement from './pages/PrivacyPolicyManagement';
import TermsAndConditionsManagement from './pages/TermsAndConditionsManagement';
import CareerManagement from './pages/CareerManagement';
import NewsletterSubscribersManagement from './pages/NewsletterSubscribersManagement';

// Pages that will be created
// import BlogManagement from './pages/BlogManagement';
// import FaqManagement from './pages/FaqManagement';
// import ContactManagement from './pages/ContactManagement';
// import CareerManagement from './pages/CareerManagement';

// Tạo theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Define menu items for the sidebar
export const MENU_ITEMS = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: <AdminPanelSettingsIcon />,
  },
  {
    path: '/admins',
    name: 'Quản lý Admin',
    icon: <AdminPanelSettingsIcon />,
  },
  {
    path: '/users',
    name: 'Quản lý người dùng',
    icon: <PeopleIcon />,
  },
  {
    path: '/categories',
    name: 'Quản lý danh mục',
    icon: <CategoryIcon />,
  },
  {
    path: '/products',
    name: 'Quản lý sản phẩm',
    icon: <Inventory2Icon />,
  },
  {
    path: '/promotions',
    name: 'Quản lý khuyến mãi',
    icon: <DiscountIcon />,
  },
  {
    path: '/orders',
    name: 'Quản lý đơn hàng',
    icon: <ShoppingCartIcon />,
  },
  {
    path: '/blogs',
    name: 'Quản lý bài viết',
    icon: <ArticleIcon />,
  },
  {
    path: '/social-media',
    name: 'Quản lý Mạng Xã Hội',
    icon: <LinkIcon />,
  },
  {
    path: '/newsletter',
    name: 'Quản lý Đăng ký Bản tin',
    icon: <MailIcon />,
  },
  {
    path: '/faqs',
    name: 'Quản lý FAQ',
    icon: <QuestionAnswerIcon />,
  },
  {
    path: '/privacy',
    name: 'Quản lý Chính sách Bảo mật',
    icon: <PrivacyTipIcon />,
  },
  {
    path: '/terms',
    name: 'Quản lý Điều khoản Sử dụng',
    icon: <GavelIcon />,
  },
  {
    path: '/careers',
    name: 'Quản lý tuyển dụng',
    icon: <WorkIcon />,
  },
  // {
  //   path: '/contacts',
  //   name: 'Quản lý liên hệ',
  //   icon: <EmailIcon />,
  // },
  // {
  //   path: '/careers',
  //   name: 'Quản lý tuyển dụng',
  //   icon: <WorkIcon />,
  // },
  // {
  //   path: '/terms',
  //   name: 'Quản lý điều khoản',
  //   icon: <GavelIcon />,
  // },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Router>
          <AuthProvider>
            <SessionTimeoutDialog warningTime={60000} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <PermissionRoute pageName="Dashboard">
                  <Dashboard />
                </PermissionRoute>
              } />
              <Route path="/admins" element={
                <PermissionRoute pageName="Quản lý Admin">
                  <AdminManagement />
                </PermissionRoute>
              } />
              <Route path="/users" element={
                <PermissionRoute pageName="Quản lý người dùng">
                  <UserManagement />
                </PermissionRoute>
              } />
              <Route path="/categories" element={
                <PermissionRoute pageName="Quản lý danh mục">
                  <CategoryManagement />
                </PermissionRoute>
              } />
              <Route path="/products" element={
                <PermissionRoute pageName="Quản lý sản phẩm">
                  <ProductManagement />
                </PermissionRoute>
              } />
              <Route path="/promotions" element={
                <PermissionRoute pageName="Quản lý khuyến mãi">
                  <PromotionManagement />
                </PermissionRoute>
              } />
              <Route path="/orders" element={
                <PermissionRoute pageName="Quản lý đơn hàng">
                  <OrderManagement />
                </PermissionRoute>
              } />
              <Route path="/blogs" element={
                <PermissionRoute pageName="Quản lý bài viết">
                  <BlogManagement />
                </PermissionRoute>
              } />
              <Route path="/social-media" element={
                <PermissionRoute pageName="Quản lý mạng xã hội">
                  <SocialMediaURLsManagement />
                </PermissionRoute>
              } />
              <Route path="/newsletter" element={
                <PermissionRoute pageName="Quản lý Đăng ký Bản tin">
                  <NewsletterSubscribersManagement />
                </PermissionRoute>
              } />
              <Route path="/faqs" element={
                <PermissionRoute pageName="Quản lý FAQ">
                  <FAQManagement />
                </PermissionRoute>
              } />
              <Route path="/privacy" element={
                <PermissionRoute pageName="Quản lý chính sách bảo mật">
                  <PrivacyPolicyManagement />
                </PermissionRoute>
              } />
              <Route path="/terms" element={
                <PermissionRoute pageName="Quản lý điều khoản sử dụng">
                  <TermsAndConditionsManagement />
                </PermissionRoute>
              } />
              <Route path="/careers" element={
                <PermissionRoute pageName="Quản lý tuyển dụng">
                  <CareerManagement />
                </PermissionRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
