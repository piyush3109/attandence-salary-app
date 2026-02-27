import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check cookies for an existing session from MongoDB backend
        const userInfo = Cookies.get('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                setUser(parsed);
            } catch (e) {
                Cookies.remove('userInfo');
                Cookies.remove('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            // MongoDB-based login via backend API
            const { data } = await api.post('/auth/login', { identifier, password });

            const userData = {
                _id: data._id,
                email: data.email,
                username: data.username,
                role: data.role,
                profilePhoto: data.profilePhoto || '',
                theme: data.theme,
                token: data.token,
                isEmployee: data.isEmployee
            };

            setUser(userData);
            Cookies.set('token', userData.token, { expires: 30 });
            Cookies.set('userInfo', JSON.stringify(userData), { expires: 30 });
            navigate('/');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed - Check your credentials'
            };
        }
    };

    const logout = async () => {
        setUser(null);
        Cookies.remove('token');
        Cookies.remove('userInfo');
        navigate('/login');
    };

    const register = async (formData) => {
        try {
            const { data } = await api.post('/auth/register', formData);

            const userData = {
                _id: data._id,
                email: data.email,
                username: data.username,
                role: data.role,
                profilePhoto: data.profilePhoto || '',
                theme: data.theme,
                token: data.token,
                isEmployee: data.isEmployee
            };

            setUser(userData);
            Cookies.set('token', userData.token, { expires: 30 });
            Cookies.set('userInfo', JSON.stringify(userData), { expires: 30 });
            navigate('/');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            register,
            isEmployee: user?.role === 'employee' || user?.isEmployee === true,
            isAdmin: user?.role === 'admin' || user?.role === 'manager' || user?.role === 'hr' || user?.role === 'ceo',
            isAuthority: user?.role === 'admin' || user?.role === 'manager' || user?.role === 'hr' || user?.role === 'ceo'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
