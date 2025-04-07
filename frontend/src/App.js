import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext'; 
import UploadTestPage from './components/UploadTestPage';

function App() {
    return (
        <AuthProvider>
            <Router> 
                <Routes >
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/"
                        element={
                            // <PrivateRoute>
                                <Dashboard />
                            // </PrivateRoute>
                        }
                    />
                    <Route path="/upload-test" element={<UploadTestPage />} />
                </Routes> 
            </Router>
        </AuthProvider>
    );
}

export default App;