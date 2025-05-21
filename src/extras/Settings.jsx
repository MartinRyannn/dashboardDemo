// Fix for Settings.jsx
import { useState, useEffect } from "react"
import "../styles/settingsStyles.scss"

const Settings = ({ showSettings, setShowSettings, onSettingsChange }) => {
    const [localSettings, setLocalSettings] = useState(() => {
        const savedSettings = localStorage.getItem('dashboardSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            fetchInterval: 2000,
            livePriceDelay: 3000,
            darkMode: true,
            notifications: true,
        };
    });
    const [isDirty, setIsDirty] = useState(false);

    const handleSettingChange = (key, value) => {
        setLocalSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            setIsDirty(true);
            return newSettings;
        });
    };

    const handleSaveSettings = () => {
        onSettingsChange(localSettings);
        setIsDirty(false);
    };

    const handleResetSettings = () => {
        const defaultSettings = {
            fetchInterval: 2000,
            livePriceDelay: 3000,
            darkMode: true,
            notifications: true,
        };
        setLocalSettings(defaultSettings);
        setIsDirty(true);
    }

    const handleKillApp = () => {
        if (window.confirm("Are you sure you want to terminate the application?")) {
            fetch("http://localhost:3001/kill_app", {
                method: "POST",
            }).catch((err) => console.error("Failed to terminate application:", err))
        }
    }

    return (
        <div className={`settingsContainer ${showSettings ? "show" : "hide"}`}>
            <div className="settingsHeader">
                <h2>Settings</h2>
                <button className="closeButton" onClick={() => setShowSettings(false)}>
                    ✕
                </button>
            </div>

            <div className="settingsContent">
                <div className="settingsSection">
                    <div className="sectionHeader">
                        <h3>Data Refresh</h3>
                    </div>

                    <div className="settingItem">
                        <div className="settingLabel">
                            <span>Fetch Interval (ms)</span>
                            <span className="settingValue">{localSettings.fetchInterval}</span>
                        </div>
                        <div className="sliderContainer">
                            <input
                                type="range"
                                min="500"
                                max="10000"
                                step="100"
                                value={localSettings.fetchInterval}
                                onChange={(e) => handleSettingChange('fetchInterval', Number.parseInt(e.target.value))}
                                className="slider"
                            />
                            <div className="sliderLabels">
                                <span>500</span>
                                <span>10000</span>
                            </div>
                        </div>
                    </div>

                    <div className="settingItem">
                        <div className="settingLabel">
                            <span>Live Price Delay (ms)</span>
                            <span className="settingValue">{localSettings.livePriceDelay}</span>
                        </div>
                        <div className="sliderContainer">
                            <input
                                type="range"
                                min="1500"
                                max="20000"
                                step="500"
                                value={localSettings.livePriceDelay}
                                onChange={(e) => handleSettingChange('livePriceDelay', Number.parseInt(e.target.value))}
                                className="slider"
                            />
                            <div className="sliderLabels">
                                <span>1500</span>
                                <span>20000</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settingsSection">
                    <div className="sectionHeader">
                        <h3>Extra</h3>
                    </div>

                    <div className="settingActions">
                        <button className="actionButton resetButton" onClick={handleResetSettings}>
                            <span className="buttonIcon">↺</span>
                            Reset Settings
                        </button>

                        <button className="actionButton killButton" onClick={handleKillApp}>
                            <span className="buttonIcon"></span>
                            Kill App
                        </button>
                    </div>
                </div>

                <div className="settingsFooter">
                    <button 
                        className={`saveButton ${isDirty ? 'active' : ''}`}
                        onClick={handleSaveSettings}
                        disabled={!isDirty}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Settings