import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if a token is present in localStorage
        const token = localStorage.getItem('token');
        setIsLoggedIn(token !== null); // Explicitly check if token exists
    }, []);

    return (
        <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/generate-password">Generate Password</Link>
            <Link to="/rate-password">Rate My Password</Link>
            {isLoggedIn ? (
                <Link to="/profile">Profile</Link>
            ) : (
                <Link to="/login">Log In</Link>
            )}
        </nav>
    );
};

export default Navbar;
