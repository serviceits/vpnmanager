import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Для user-management проверяем роль admin
    if (window.location.pathname === '/user-management' && user.userrole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PrivateRoute;