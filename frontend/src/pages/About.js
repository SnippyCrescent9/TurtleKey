import React from 'react';

const About = () => {
  console.log("About component rendered!");
  return (
    <div>
      <h2>About Page</h2>
      <h3 id="mission">Mission Statement</h3>
      <p>TurtleKey was created to provide easy-to-use password management tools to encourage individuals to implement more secure passwords for their digital protection. TurtleKey's goal is to inform everyone of strong cybersecurity principles.</p>
    </div>
  );
};

export default About;