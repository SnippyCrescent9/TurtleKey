import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Function to check token in localStorage
    const checkToken = () => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(token !== null); // Update state if token exists or not
    };

    useEffect(() => {
        // Initial check when the component mounts
        checkToken();

        // Add a 'storage' event listener to detect changes to localStorage
        window.addEventListener('storage', checkToken);

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('storage', checkToken);
        };
    }, []);

    return (
        <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/generate-password">Generate Password</Link>
            <Link to="/rate-password">Rate My Password</Link>
            <Link to="/login">{isLoggedIn ? 'Profile' : 'Log In'}</Link>
        </nav>
    );
};

export default Navbar;
