import React from 'react';
import { useNavigate } from 'react-router-dom';

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
        <div className="auth-content">
            <div className="auth-card">
                <h2>Guest Profile</h2>
                <div className="profile-section">
                    <p className="guest-message">Create an account with us to earn achievements!</p>
                    <button onClick={handleLogout} className="logout-button">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuestProfile; 