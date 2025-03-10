import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles.css';

const ValidateCode = () => {
    const [code, setCode] = useState('');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/validate-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Code validated successfully!');
                // Navigate to reset password page after 1 second
                setTimeout(() => {
                    navigate('/reset-password', { state: { email } });
                }, 1000);
            } else {
                setMessage(data.message || 'Invalid code. Please try again.');
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
                <h2>Enter Reset Code</h2>
                <p className="instruction-text">
                    Please enter the 6-character code sent to your email.
                </p>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label htmlFor="code">Reset Code</label>
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            required
                            placeholder="Enter 6-character code"
                            pattern="[A-Z0-9]{6}"
                            title="6 characters code (letters and numbers only)"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="auth-button">
                        {isLoading ? 'Validating...' : 'Validate Code'}
                    </button>
                    {message && <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
                    <button 
                        type="button" 
                        onClick={() => navigate('/forgot-password')} 
                        className="link-button"
                    >
                        Request New Code
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ValidateCode; 