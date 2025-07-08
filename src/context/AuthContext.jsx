import axios from 'axios';
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
  const SOCKET_URL = import.meta.env.VITE_BACKEND_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Effect for managing Socket.IO connection
  useEffect(() => {
    if (token && !socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        query: { token },
        transports: ['websocket', 'polling'] 
      });

      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected:', socketRef.current.id);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket.IO disconnected');
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
      });

    } else if (!token && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, SOCKET_URL]);

  // Set up Axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("Axios default Authorization header set:", axios.defaults.headers.common['Authorization']);

    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log("Axios default Authorization header cleared.");
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed.' };
    }
  };

  const register = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, { email, password });
      return { success: true, message: res.data.message };
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (socketRef.current) {
      socketRef.current.disconnect(); // Explicitly disconnect socket on logout
      socketRef.current = null;
    }
  };

  const authContextValue = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
    API_URL,
    socket: socketRef.current
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
