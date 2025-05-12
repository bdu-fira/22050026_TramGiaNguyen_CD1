import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AuthProvider, useAuth } from './services/AuthContext';
import activityTracker from './services/ActivityTracker';

// Import pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Products from './pages/Products';
import SubProduct from './pages/SubProduct';
import ProductDetail from './pages/ProductDetail';
import News from './pages/News';
import Careers from './pages/Careers';
import CustomerSupport from './pages/CustomerSupport';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import LoginRegister from './pages/LoginRegister';
import Cart from './pages/Cart';
import Promotions from './pages/Promotions';
import ProfilePage from './pages/ProfilePage';
import MyOrders from './pages/MyOrders';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';

// ScrollToTop component - cuộn lên đầu trang khi chuyển trang
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Track page view if user is authenticated
    if (isAuthenticated) {
      activityTracker.trackPageView(pathname);
    }
  }, [pathname, isAuthenticated]);

  return null;
};

// Wrapper component to ensure page-container is applied to all pages
const PageWrapper = ({ component: Component }) => {
  // Home page doesn't need the page-container as it has its own styling
  if (Component === Home) {
    return <Component />;
  }
  
  // For all other pages, apply the page-container class
  return (
    <div className="page-container">
      <Component />
    </div>
  );
};

// AppContent component để đặt ScrollToTop bên trong Router context
const AppContent = () => {
  return (
    <>
      <Header />
      <ScrollToTop />
      <Routes>
        {/* Main Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<PageWrapper component={About} />} />
        <Route path="/contact" element={<PageWrapper component={Contact} />} />
        
        {/* Product Pages */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<PageWrapper component={SubProduct} />} />
        <Route path="/products/category/:categoryName" element={<Products />} />
        <Route path="/subproduct" element={<PageWrapper component={SubProduct} />} />
        <Route path="/product-detail/:productId" element={<PageWrapper component={ProductDetail} />} />
        
        {/* User Account Pages */}
        <Route path="/login-register" element={<PageWrapper component={LoginRegister} />} />
        <Route path="/profile" element={<PageWrapper component={ProfilePage} />} />
        <Route path="/orders" element={<PageWrapper component={MyOrders} />} />
        <Route path="/orders/:orderId" element={<PageWrapper component={MyOrders} />} />
        
        {/* Shopping Pages */}
        <Route path="/cart" element={<PageWrapper component={Cart} />} />
        <Route path="/checkout" element={<PageWrapper component={Cart} />} />
        <Route path="/order-confirmation/:orderId" element={<PageWrapper component={Cart} />} />
        <Route path="/promotions" element={<PageWrapper component={Promotions} />} />
        
        {/* Blog and News */}
        <Route path="/news" element={<PageWrapper component={News} />} />
        <Route path="/news/:blogId" element={<PageWrapper component={News} />} />
        
        {/* Informational Pages */}
        <Route path="/careers" element={<PageWrapper component={Careers} />} />
        <Route path="/customer-support" element={<PageWrapper component={CustomerSupport} />} />
        <Route path="/privacy-policy" element={<PageWrapper component={PrivacyPolicy} />} />
        <Route path="/terms-conditions" element={<PageWrapper component={TermsConditions} />} />
        <Route path="/faq" element={<PageWrapper component={CustomerSupport} />} />
      </Routes>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
