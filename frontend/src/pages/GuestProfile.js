import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Buttons';

const GuestProfile = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isGuest');
        window.dispatchEvent(new Event('storageChange'));
        navigate('/login');
    };

    return (
        <div className="container">
            <h2>Guest</h2>
            <div className="profile-section">
                <p className="guest-message">Create an account with us to earn achievements!</p>
                <div className="button-group">
                    <Button onClick={handleLogout} className="logout-button">Logout</Button>
                </div>
            </div>
        </div>
    );
};

export default GuestProfile; 