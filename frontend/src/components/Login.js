import React, { useState } from 'react';
import axios from 'axios';
import styles from './styles/Login.module.css'; // Импортируем стили

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://10.10.5.16:5000/api/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            window.location.href = '/';
        } catch (err) {
            alert('Invalid credentials');
        }
    };

    return (
        <div className={styles.container}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;