import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const isGuestUser = localStorage.getItem('isGuest') === 'true';
        setIsLoggedIn(!!token);
        setIsGuest(isGuestUser);
    };

    useEffect(() => {
        // Initial check
        checkAuthStatus();

        // Listen for storage changes
        window.addEventListener('storage', checkAuthStatus);
        
        // Listen for custom storage change event
        window.addEventListener('storageChange', checkAuthStatus);

        // Cleanup
        return () => {
            window.removeEventListener('storage', checkAuthStatus);
            window.removeEventListener('storageChange', checkAuthStatus);
        };
    }, []);

    return (
        <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/generate-password">Generate Password</Link>
            <Link to="/rate-password">Password Rater</Link>
            {isLoggedIn ? (
                isGuest ? (
                    <Link to="/guest-profile">Guest</Link>
                ) : (
                    <Link to="/profile">Profile</Link>
                )
            ) : (
                <Link to="/login">Login</Link>
            )}
        </nav>
    );
};

export default Navbar;
