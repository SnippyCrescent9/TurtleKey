import React, { useState, useEffect } from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const [strength, setStrength] = useState('');
  
  useEffect(() => {
    const ratePassword = () => {
      if (password.length === 0) {
        return null;
      }
      
      let strengthValue = 0;

      if (password.length >= 8) strengthValue += 1;
      if (/[A-Z]/.test(password)) strengthValue += 2;
      if (/[a-z]/.test(password)) strengthValue += 1;
      if (/[0-9]/.test(password)) strengthValue += 2;
      if (/[\W_]/.test(password)) strengthValue += 2;

      if (strengthValue <= 4) setStrength('Weak');
      else if (strengthValue === 5) setStrength('Moderate');
      else if (strengthValue === 6) setStrength('Strong');
      else if (strengthValue === 8) setStrength('Very Strong');
    };

    ratePassword();
  }, [password]); // Trigger when password changes
  
  // Styling for the strength levels
  const getStrengthColor = () => {
    switch (strength) {
      case 'Weak':
        return 'red';
      case 'Moderate':
        return 'orange';
      case 'Strong':
        return 'green';
      case 'Very Strong':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <div>
      <p>Password Strength: {strength}</p>
      <div style={{ height: '10px', backgroundColor: getStrengthColor(), width: '20%' }} />
    </div>
  );
};

export default PasswordStrengthMeter;
