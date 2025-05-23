import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import UploadTestPage from './components/UploadTestPage';
import SendMessagePage from './components/SendMessagePage';
import CalendarPage from './components/CalendarPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route
                        path="/user-management"
                        element={<PrivateRoute><UserManagement /></PrivateRoute>}
                    />
                    <Route path="/send-message" element={<SendMessagePage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/upload-test" element={<UploadTestPage />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;