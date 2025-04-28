import React, { useContext, useState } from 'react';
import axios from 'axios';
import styles from './styles/Login.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const { user, setUser } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    console.log('REACT_APP_SERVER:', process.env.REACT_APP_SERVER);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!process.env.REACT_APP_SERVER) {
                throw new Error('REACT_APP_SERVER is not defined in .env');
            }
            const apiUrl = `${process.env.REACT_APP_SERVER}/api/auth/login`;
            console.log('Sending request to:', apiUrl);
            const response = await axios.post(apiUrl, { username, password });
            localStorage.setItem('token', response.data.token);
            window.location.href = '/';
        } catch (err) {
            console.error('Login error:', err);
            alert('Invalid credentials');
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h2>Вход</h2>
                {error && <div className={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            placeholder="Имя пользователя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                disabled={loading}
                            />
                            <span
                                className={styles.eyeIcon}
                                onClick={toggleShowPassword}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && toggleShowPassword()}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button> 
                </form>
            </div>
        </div>
    );
};

export default Login;