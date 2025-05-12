import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Tooltip,
  IconButton
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import Layout from '../components/Layout';
import { getNewsletterSubscribers } from '../services/api';
import { useSnackbar } from 'notistack';

// Define newsletter subscriber interface
interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

const NewsletterSubscribersManagement: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const { enqueueSnackbar } = useSnackbar();
  const rowsPerPage = 10;

  // Fetch subscribers data
  const fetchSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNewsletterSubscribers();
      setSubscribers(response.data);
      setTotalPages(Math.ceil(response.data.length / rowsPerPage));
    } catch (err) {
      console.error("Error fetching newsletter subscribers:", err);
      setError("Không thể tải danh sách người đăng ký. Vui lòng thử lại sau.");
      enqueueSnackbar('Không thể tải danh sách người đăng ký', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Handle pagination
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Calculate current page of subscribers
  const currentSubscribers = subscribers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Export to CSV functionality
  const exportToCSV = () => {
    try {
      // Create CSV content
      const csvContent = [
        // Header row
        ["ID", "Email", "Ngày đăng ký"].join(","),
        // Data rows
        ...subscribers.map(sub => [
          sub.id,
          sub.email,
          new Date(sub.created_at).toLocaleString('vi-VN')
        ].join(","))
      ].join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      enqueueSnackbar('Xuất file CSV thành công!', { variant: 'success' });
    } catch (error) {
      console.error('Lỗi khi xuất file CSV:', error);
      enqueueSnackbar('Không thể xuất file CSV', { variant: 'error' });
    }
  };

  const handleRefresh = () => {
    fetchSubscribers();
    enqueueSnackbar('Đã làm mới danh sách người đăng ký', { variant: 'info' });
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Quản Lý Đăng Ký Nhận Bản Tin</Typography>
          <Box>
            <Tooltip title="Làm mới danh sách">
              <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<CloudDownloadIcon />} 
              onClick={exportToCSV}
              disabled={loading || subscribers.length === 0}
            >
              Xuất CSV
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>STT</TableCell>
                <TableCell>Email</TableCell>
                <TableCell width={200}>Ngày đăng ký</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    Chưa có người dùng đăng ký nhận bản tin
                  </TableCell>
                </TableRow>
              ) : (
                currentSubscribers.map((subscriber, index) => (
                  <TableRow key={subscriber.id} hover>
                    <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{subscriber.email}</TableCell>
                    <TableCell>
                      {new Date(subscriber.created_at).toLocaleString('vi-VN')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && subscribers.length > 0 && (
          <Box display="flex" justifyContent="center">
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange}
              color="primary" 
              showFirstButton 
              showLastButton
            />
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default NewsletterSubscribersManagement; 