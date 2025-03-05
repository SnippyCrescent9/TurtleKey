import React from 'react';

const About = () => {
  console.log("About component rendered!");
  return (
    <div className="about-content">
      <h2>About TurtleKey</h2>
      <div className="mission-section">
        <h3 id="mission">Our Mission</h3>
        <p>TurtleKey was created to provide easy-to-use password management tools to encourage individuals to implement more secure passwords for their digital protection. TurtleKey's goal is to inform everyone of strong cybersecurity principles.</p>
      </div>
    </div>
  );
};

export default About;