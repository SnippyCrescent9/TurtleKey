import React from 'react';

const MissingCriteria = ({criteria}) => {
    if (criteria.length === 0) return null;

    return (
        <p style={{color: 'red'}}>
            Missing: {criteria.join(', ')};
        </p>
    );
};

export default MissingCriteria;