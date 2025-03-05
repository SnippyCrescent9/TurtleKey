import React from 'react';

const Home = () => {
  console.log("Home component rendered!");
  return (
    <div className="home-content">
      <h2>Welcome to TurtleKey</h2>
      <div className="welcome-section">
        <h3 id="slogan">Safeguard Your Digital Life with TurtleKey</h3>
        <p>Welcome to TurtleKey! TurtleKey helps you to generate, appraise and manage strong passwords effortlessly. Stay secure with industry-standard encryption and proactive security features to make password management more convenient for you.</p>
      </div>
      <div className="features-section">
        <div id="features">
          <h3>Key Features</h3>
          <ul>
            <li>Secure Password Generation</li>
            <li>Real-time Strength Rating</li>
            <li>Encrypted Storage (coming soon!)</li>
            <li>Open Source</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;