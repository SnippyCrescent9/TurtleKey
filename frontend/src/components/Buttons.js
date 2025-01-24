import React from 'react';

const Button = ({ onClick, children, type='button', disabled=false}) => {
    return (
        <button 
            onClick={onClick} 
            type={type} 
            disabled={disabled} 
            style={{
                padding: '10px 20px',
                backgroundColor: disabled ? '#ccc' : '#007BFF',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: disabled ? 'not-allowed' : 'pointer'
            }}
        >
            {children}
        </button>
    );
};

export default Button;