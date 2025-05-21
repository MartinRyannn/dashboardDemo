import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/strategiesStyles.scss';

const Strategies = ({ showStrategies, setShowStrategies }) => {
  const [selectedStrategy, setSelectedStrategy] = useState('balanced');
  const [isActivating, setIsActivating] = useState(false);
  const [activationComplete, setActivationComplete] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState(null);
  
  // Simulate a visual-only activation process
  const handleActivateStrategy = () => {
    setIsActivating(true);
    
    // Simulate activation delay with a timer
    setTimeout(() => {
      setCurrentStrategy(strategies.find(s => s.id === selectedStrategy));
      setActivationComplete(true);
      
      // Reset and close after showing success
      setTimeout(() => {
        setActivationComplete(false);
        setIsActivating(false);
        setShowStrategies(false);
      }, 1500);
    }, 2000);
  };
  
  // Reset states when component unmounts
  useEffect(() => {
    return () => {
      setIsActivating(false);
      setActivationComplete(false);
    };
  }, []);
  
  // Set initial strategy on first render
  useEffect(() => {
    // Set balanced as the current strategy for demo purposes
    if (!currentStrategy) {
      setCurrentStrategy(strategies.find(s => s.id === 'balanced'));
    }
  }, []);

  const strategies = [
    {
      id: 'conservative',
      name: 'CONSERVATIVE',
      description: 'High-probability trades with strong trend confirmation',
      indicators: [
        { name: 'ADX', value: '> 25' },
        { name: 'RSI', value: '20-80' },
        { name: 'EMA', value: '50, 100, 200' }
      ],
      parameters: {
        'Entry Delay': '250s',
        'Min Trend Strength': '0.8',
        'Max Trades': '3',
        'Stop Loss': 'Dynamic'
      },
      color: '#00ff9d'
    },
    {
      id: 'balanced',
      name: 'BALANCED',
      description: 'Optimal balance between frequency and quality',
      indicators: [
        { name: 'ADX', value: '> 20' },
        { name: 'RSI', value: '25-75' },
        { name: 'EMA', value: '50, 100' }
      ],
      parameters: {
        'Entry Delay': '180s',
        'Min Trend Strength': '0.6',
        'Max Trades': '5',
        'Stop Loss': 'Dynamic'
      },
      color: '#00ff9d'
    },
    {
      id: 'aggressive',
      name: 'AGGRESSIVE',
      description: 'High-frequency trading with quick signals',
      indicators: [
        { name: 'ADX', value: '> 15' },
        { name: 'RSI', value: '30-70' },
        { name: 'EMA', value: '20, 50' }
      ],
      parameters: {
        'Entry Delay': '120s',
        'Min Trend Strength': '0.4',
        'Max Trades': '8',
        'Stop Loss': 'Dynamic'
      },
      color: '#00ff9d'
    }
  ];

  return (
    <AnimatePresence>
      {showStrategies && (
        <motion.div
          className="strategies-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="strategies-container"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="strategies-header">
              <h2>STRATEGY SELECTOR</h2>
              <div className="connection-status">
                <span className="status-indicator connected" />
                <span className="status-text">CONNECTED</span>
              </div>
              <button 
                className="close-button"
                onClick={() => setShowStrategies(false)}
              >
                ×
              </button>
            </div>



            <div className="strategy-selector">
              {strategies.map((strategy) => (
                <motion.button
                  key={strategy.id}
                  className={`strategy-tab ${selectedStrategy === strategy.id ? 'active' : ''}`}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    color: selectedStrategy === strategy.id ? strategy.color : 'rgba(255, 255, 255, 0.5)',
                    borderColor: strategy.color
                  }}
                >
                  {strategy.name}
                </motion.button>
              ))}
            </div>

            <div className="strategy-details">
              {strategies.map((strategy) => (
                <AnimatePresence key={strategy.id}>
                  {selectedStrategy === strategy.id && (
                    <motion.div
                      className="strategy-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="strategy-description">
                        <p>{strategy.description}</p>
                        {currentStrategy && currentStrategy.id === strategy.id && (
                          <motion.div 
                            className="current-strategy-badge"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            CURRENTLY ACTIVE
                          </motion.div>
                        )}
                      </div>

                      <div className="strategy-sections">
                        <div className="strategy-section">
                          <h3>INDICATORS</h3>
                          <div className="indicators-grid">
                            {strategy.indicators.map((indicator, index) => (
                              <motion.div 
                                key={index} 
                                className="indicator-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <span className="indicator-name">{indicator.name}</span>
                                <span className="indicator-value">{indicator.value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div className="strategy-section">
                          <h3>PARAMETERS</h3>
                          <div className="parameters-grid">
                            {Object.entries(strategy.parameters).map(([key, value], index) => (
                              <motion.div 
                                key={index} 
                                className="parameter-item"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <span className="parameter-name">{key}</span>
                                <span className="parameter-value">{value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="strategy-actions">
                        <AnimatePresence>
                          {!isActivating && !activationComplete && (
                            <motion.button
                              className="activate-button"
                              style={{ backgroundColor: strategy.color }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleActivateStrategy}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              disabled={currentStrategy && currentStrategy.id === strategy.id}
                            >
                              {currentStrategy && currentStrategy.id === strategy.id ? 'CURRENTLY ACTIVE' : 'ACTIVATE STRATEGY'}
                            </motion.button>
                          )}
                          {isActivating && (
                            <motion.div
                              className="activation-progress"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <div className="progress-bar">
                                <motion.div
                                  className="progress-fill"
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ duration: 2, ease: "easeInOut" }}
                                />
                              </div>
                              <span>ACTIVATING...</span>
                            </motion.div>
                          )}
                          {activationComplete && (
                            <motion.div
                              className="activation-success"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <motion.div
                                className="success-icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                ✓
                              </motion.div>
                              <span>STRATEGY ACTIVATED</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Strategies; 