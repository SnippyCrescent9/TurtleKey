import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('If an account exists with this email, a reset code has been sent.');
                // Navigate to code validation page after 2 seconds
                setTimeout(() => {
                    navigate('/validate-code', { state: { email } });
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
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="auth-button">
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                    {message && <p className={`message ${message.includes('error') ? 'error' : 'success'}`}>{message}</p>}
                    <button 
                        type="button" 
                        onClick={() => navigate('/login')} 
                        className="link-button"
                    >
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
