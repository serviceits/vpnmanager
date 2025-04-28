import React, { useState } from 'react';
import axios from 'axios';

const AddVPNConnection = () => {
    const [formData, setFormData] = useState({
        connection_name: '',
        protocol_type: 'pptp', // По умолчанию PPTP
        vpn_server_address: '',
        username: '',
        password: '',
        connection_number: '',
        secret_key: '',
        certificate: '',
        config_file: '',
        company_name: '',
        rdp_server_address: '',
        rdp_domain: '',
        rdp_username: '',
        rdp_password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/api/vpn/add`, formData);
            alert('Connection added successfully');
            console.log(response.data);
        } catch (error) {
            console.error('Error adding connection:', error);
            alert('Failed to add connection');
        }
    };

    return (
        <div>
            <h2>Add New VPN Connection</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Connection Name:</label>
                    <input
                        type="text"
                        name="connection_name"
                        value={formData.connection_name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Protocol Type:</label>
                    <select
                        name="protocol_type"
                        value={formData.protocol_type}
                        onChange={handleChange}
                        required
                    >
                        <option value="pptp">PPTP</option>
                        <option value="l2tp">L2TP</option>
                        <option value="openvpn">OpenVPN</option>
                    </select>
                </div>
                <div>
                    <label>VPN Server Address:</label>
                    <input
                        type="text"
                        name="vpn_server_address"
                        value={formData.vpn_server_address}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Connection Number:</label>
                    <input
                        type="text"
                        name="connection_number"
                        value={formData.connection_number}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Secret Key:</label>
                    <input
                        type="text"
                        name="secret_key"
                        value={formData.secret_key}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Certificate:</label>
                    <input
                        type="text"
                        name="certificate"
                        value={formData.certificate}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Config File:</label>
                    <input
                        type="text"
                        name="config_file"
                        value={formData.config_file}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Company Name:</label>
                    <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>RDP Server Address:</label>
                    <input
                        type="text"
                        name="rdp_server_address"
                        value={formData.rdp_server_address}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>RDP Domain:</label>
                    <input
                        type="text"
                        name="rdp_domain"
                        value={formData.rdp_domain}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>RDP Username:</label>
                    <input
                        type="text"
                        name="rdp_username"
                        value={formData.rdp_username}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>RDP Password:</label>
                    <input
                        type="password"
                        name="rdp_password"
                        value={formData.rdp_password}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit">Add Connection</button>
            </form>
        </div>
    );
};

export default AddVPNConnection;