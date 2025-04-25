import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

const AuthLogic = ({ setUser, setLoading, setAuthActions }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('Token in AuthLogic:', token);
        if (token) {
            axios
                .get('http://10.10.5.16:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((response) => {
                    console.log('User data loaded:', response.data.user);
                    setUser({
                        ...response.data.user,
                        permissions: response.data.user.permissions || {
                            can_create_connections: false,
                            can_edit_connections: false,
                            can_delete_connections: false,
                            can_create_users: false,
                        },
                    });
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error loading user:', error);
                    localStorage.removeItem('token');
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [setUser, setLoading]);

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://10.10.5.16:5000/api/auth/login', {
                username,
                password,
            });
            console.log('Login response:', response.data);
            localStorage.setItem('token', response.data.token);
            setUser({
                ...response.data.user,
                permissions: response.data.user.permissions || {
                    can_create_connections: false,
                    can_edit_connections: false,
                    can_delete_connections: false,
                    can_create_users: false,
                },
            });
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    useEffect(() => {
        setAuthActions({ login, logout });
    }, [setAuthActions]);

    return null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authActions, setAuthActions] = useState({ login: () => {}, logout: () => {} });

    return (
        <AuthContext.Provider value={{ user, ...authActions, loading }}>
            {children}
            <AuthLogic setUser={setUser} setLoading={setLoading} setAuthActions={setAuthActions} />
        </AuthContext.Provider>
    );
};