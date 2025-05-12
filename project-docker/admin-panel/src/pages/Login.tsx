import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types';

const Login: React.FC = () => {
    const { login, loading } = useAuth();
    const [credentials, setCredentials] = useState<LoginRequest>({
        username: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        try {
            await login(credentials);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                        Đăng nhập quản trị
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Tên đăng nhập hoặc email"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={credentials.username}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Mật khẩu"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={credentials.password}
                            onChange={handleChange}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login; 