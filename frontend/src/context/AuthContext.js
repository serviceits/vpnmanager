import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Проверка токена при загрузке приложения
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get('http://10.10.5.148:5000/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUser(response.data.user); 
                    
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } 
            setLoading(false);
            
        };

        fetchUser();
    }, []);

    // Функция выхода
    const logout = () => {
        localStorage.removeItem('token'); // Удаляем токен
        setUser(null); // Очищаем состояние пользователя
        window.location.href = '/login'; // Перенаправляем на страницу входа
    };

    if (loading) {
        return <div>Loading...</div>; // Отображаем индикатор загрузки, пока проверяется токен
    }
    console.log(user); 
    
    return (
        <AuthContext.Provider value={{ user, logout }}>
            {children} 
        </AuthContext.Provider>
    );
};