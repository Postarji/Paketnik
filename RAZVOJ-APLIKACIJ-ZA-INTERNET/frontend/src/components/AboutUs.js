import React from 'react';

function AboutUs() {
    return (
        <div className="container mt-4">
            <div className="about-us-container fade-in">
                <h2 className="text-center mb-4">About Us</h2>
                <div className="card">
                    <div className="card-body">
                        <h3 className="card-title">Student Project: Smart Package Box</h3>
                        <p className="card-text">
                            We are a group of dedicated Computer Science students from the Faculty of 
                            Electrical Engineering and Computer Science, University of Maribor. This project 
                            was developed as part of our coursework in the second year of our studies.
                        </p>
                        <h4>Project Overview</h4>
                        <p>
                            Our smart package box (Paketnik) project aims to revolutionize package delivery 
                            and collection. With features like remote unlocking, facial recognition, and 
                            comprehensive access logging, we're making package management more secure and 
                            convenient.
                        </p>
                        <h4>Technologies Used</h4>
                        <ul>
                            <li>Frontend: React.js</li>
                            <li>Backend: Node.js with Express</li>
                            <li>Database: MongoDB</li>
                            <li>Authentication: Password & Facial Recognition</li>
                        </ul>
                        <h4>Course Information</h4>
                        <p>
                            This project was developed for the Internet Applications Development course 
                            at FERI, University of Maribor, during our second year of Computer Science studies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
