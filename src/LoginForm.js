import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from './api'; // Import the configured Axios instance

const LoginForm = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/api/auth/login', { username, password });
      if (response.data.message === 'Logged in successfully') {
        // Store tokens in localStorage
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        // Update the Authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        console.log('Login Success - Access Token:', response.data.access_token);  // Debugging
        onLoginSuccess();
      } else {
        console.error('Login error: Invalid response', response.data);  // Debugging
      }
    } catch (error) {
      console.error('Login error:', error);  // Debugging
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleLogin}>
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      {error && (
        <Typography color="error" variant="body2" paragraph>
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Login
      </Button>
    </Box>
  );
};

export default LoginForm;
