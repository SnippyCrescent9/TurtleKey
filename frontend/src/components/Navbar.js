import React from 'react';
import {Link} from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/generate-password">Generate Password</Link>
            <Link to="/rate-password">Rate My Password</Link>
            <Link to="/login">Log In</Link>
        </nav>
    );
}
export default Navbar;