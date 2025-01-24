import React from 'react';

const Home = () => {
  console.log("Home component rendered!");
  return (
    <div>
      <h2>Home Page</h2>
      <h3 id="slogan">Safeguard Your Digital Life with TurtleKey</h3>
      <p>Welcome to TurtleKey! TurtleKey helps you to generate, appraise and manage strong passwords effortlessly. Stay seccure with industry-standard encryption and proactive security features to make password management more convenient for you.</p>
      <h3>Key features</h3>
      <p id="features">
        <ul>
          <li>Secure Password Generation</li>
          <li>Real-time Strength Rating</li>
          <li>Encrypted Storage(coming soon!)</li>
          <li>Open Source</li>
        </ul>
      </p>
    </div>
  );
};

export default Home;