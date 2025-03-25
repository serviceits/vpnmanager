import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = () => {
    const { user } = useContext(AuthContext);
    console.log('User in PrivateRoute:', user);
    if (user === null) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        return <Navigate to="/login" replace />;
    }

    if (user === undefined) {
        // Если состояние еще не определено (например, загружается), показываем индикатор загрузки
        return <div>Loading...</div>;
    }

    // Если пользователь авторизован, рендерим защищенный маршрут
    return <Outlet />;
};

export default PrivateRoute;