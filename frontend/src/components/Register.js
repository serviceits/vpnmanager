import React, { useState } from 'react';
import axios from 'axios';
import styles from './styles/Register.module.css'; // Импортируем стили

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://10.10.5.148:5000/api/auth/register', { username, password });
            alert('Registration successful');
            window.location.href = '/login';
        } catch (err) {
            alert('Error during registration');
        }
    };

    return (
        <div className={styles.container}>
            <h2>Register</h2>
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
                    Register
                </button>
            </form>
        </div>
    );
};

export default Register;