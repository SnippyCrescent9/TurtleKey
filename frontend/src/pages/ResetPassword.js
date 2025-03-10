import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    // Redirect to forgot password if no email is provided
    if (!email) {
        navigate('/forgot-password');
        return null;
    }

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,20})/;
        return regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        // Validate password requirements
        if (!validatePassword(password)) {
            setMessage('Password must be 8-20 characters long and contain at least one capital letter, one number, and one special character.');
            setIsLoading(false);
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, confirmPassword }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Password reset successfully!');
                // Navigate to login page after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                        />
                        <small className="password-requirements">
                            Password must be 8-20 characters long and contain at least:
                            <ul>
                                <li>One capital letter</li>
                                <li>One number</li>
                                <li>One special character (!@#$%^&*)</li>
                            </ul>
                        </small>
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="auth-button">
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    {message && <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
