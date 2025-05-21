import React, { useEffect, useState } from 'react';
import '../styles/forexTable.css';

const ForexTable = () => {
  const [forexData, setForexData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/trading-data');
      const data = await response.json();
      setForexData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const getIndicatorClass = (indicator, value) => {
    switch (indicator) {
      case 'RSI':
        return value > 70 ? 'danger' : value < 30 ? 'success' : 'neutral';
      case 'STOCH':
        return value > 80 ? 'danger' : value < 20 ? 'success' : 'neutral';
      case 'MOMENTUM':
        return value > 0 ? 'success' : 'danger';
      default:
        return 'neutral';
    }
  };

  if (!forexData) return null;

  return (
    <div className="dashboard">
      <div className="terminal">
        <div className="primary-indicators">
          <div className="indicator">
            <span className="label">RSI</span>
            <span className={getIndicatorClass('RSI', forexData.rsi)}>
              {Number(forexData.rsi).toFixed(1)}
            </span>
          </div>
          <div className="indicator">
            <span className="label">MOM</span>
            <span className={getIndicatorClass('MOMENTUM', forexData.mom)}>
              {Number(forexData.mom).toFixed(3)}
            </span>
          </div>
          <div className="indicator">
            <span className="label">CCI</span>
            <span className={getIndicatorClass('MOMENTUM', forexData.cci20)}>
              {Number(forexData.cci20).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="moving-averages">
          <div className="ma-group">
            <div className="ma-item">
              <span className="label">EMA50</span>
              <span>{Number(forexData.ema50).toFixed(2)}</span>
            </div>
            <div className="ma-item">
              <span className="label">EMA100</span>
              <span>{Number(forexData.ema100).toFixed(2)}</span>
            </div>
            <div className="ma-item">
              <span className="label">EMA200</span>
              <span>{Number(forexData.ema200).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="stoch-section">
          <div className="stoch-item">
            <span className="label">K-STOCH</span>
            <span className={getIndicatorClass('STOCH', forexData.kStoch)}>
              {Number(forexData.kStoch).toFixed(1)}
            </span>
          </div>
          <div className="stoch-item">
            <span className="label">D-STOCH</span>
            <span className={getIndicatorClass('STOCH', forexData.dStoch)}>
              {Number(forexData.dStoch).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="alerts">
          {forexData.rsi > 70 && (
            <div className="alert danger">RSI OB</div>
          )}
          {forexData.rsi < 30 && (
            <div className="alert success">RSI OS</div>
          )}
          {Math.abs(forexData.mom) > 0.5 && (
            <div className={`alert ${forexData.mom > 0 ? 'success' : 'danger'}`}>
              MOM{forexData.mom > 0 ? '↑' : '↓'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForexTable;