import React from 'react';

const Input = ({ type = 'text', value, onChange, placeholder, min, max }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                marginRight: '10px'
            }}
        />
    );
};

export default Input;