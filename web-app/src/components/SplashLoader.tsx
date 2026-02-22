import React from 'react';
import './SplashLoader.css';

const SplashLoader: React.FC = () => {
    return (
        <div className="splash-container">
            <div className={`splash-content loaded`}>
                <div className="loader-fallback">
                    <img src="/icon.png" alt="TeleGphoto" className="splash-logo-img" />
                    <div className="pulse-loader"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashLoader;
