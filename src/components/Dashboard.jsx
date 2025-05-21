"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import "../styles/dashboardStyles.scss"
import { Line } from "react-chartjs-2"
import ForexTable from "../extras/ForexTable.jsx"
import Tools from "../extras/Tools.jsx"
import logo from "../images/xlogo.png"
import "chartjs-adapter-date-fns"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js"
import "chartjs-plugin-annotation"
import "chartjs-plugin-zoom"
import { motion, AnimatePresence } from "framer-motion"
import Settings from "../extras/Settings.jsx"
import ActiveOrdersTable from './ActiveOrdersTable'
import Strategies from "../extras/Strategies.jsx"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faQuestionCircle, 
  faCog, 
  faChartLine, 
  faTools 
} from '@fortawesome/free-solid-svg-icons'

// Import synthetic data generators
import {
  generateGoldPriceData,
  generateLivePrice,
  generateActiveTrades,
  generateActiveOrders,
  generateTradeHistory,
  generatePivotPoints,
  generateBalance,
  generateVolatility,
  generateDataCollectionStatus,
  generateCurrentStrategy
} from "../utils/syntheticData"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale)

const MAX_CANDLES = 100

const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

console.error = () => {}
console.warn = () => {}
console.log = () => {}

const TutorialOverlay = ({ isActive, onClose, currentStep, setCurrentStep }) => {
  const [highlightStyle, setHighlightStyle] = useState({})
  const [tooltipStyle, setTooltipStyle] = useState({})
  const overlayRef = useRef(null)

  const tutorialSteps = [
    {
      selector: ".statusButton",
      content: "Toggle connection status. When ON, the system fetches and analyzes market data.",
      position: "bottom",
    },
    {
      selector: ".toolsButton",
      content: "Access trading tools and utilities.",
      position: "bottom",
    },
    {
      selector: ".chartBox",
      content: "View price charts with customizable indicators and timeframes.",
      position: "top",
    },
    {
      selector: ".eventsBox",
      content: "Configure chart settings and indicators.",
      position: "left",
    },
    {
      selector: ".activeTradesBox",
      content: "Monitor your open positions and their performance.",
      position: "top",
    },
    {
      selector: ".activeOrdersBox",
      content: "View and manage your pending orders.",
      position: "top",
    },
    {
      selector: ".balanceBox",
      content: "Check your account balance and status.",
      position: "top",
    },
    {
      selector: ".infoBox",
      content: "Track your unrealized and realized profits.",
      position: "top",
    },
    {
      selector: ".realTimeChartBox",
      content: "Monitor real-time price movements and changes.",
      position: "top",
    },
    {
      selector: ".strategyButton",
      content: "Access and manage your trading strategies.",
      position: "bottom",
    },
    {
      selector: ".settingsButton",
      content: "Configure system settings and preferences.",
      position: "bottom",
    }
  ]

  useEffect(() => {
    if (!isActive || currentStep >= tutorialSteps.length) return

    const step = tutorialSteps[currentStep]
    const element = document.querySelector(step.selector)

    if (element) {
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      // Set highlight position
      setHighlightStyle({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
      })

      let tooltipTop, tooltipLeft
      const tooltipWidth = 300
      const tooltipHeight = 150
      const padding = 15
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      switch (step.position) {
        case "top":
          tooltipTop = rect.top + scrollTop - tooltipHeight - padding
          tooltipLeft = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2
          break
        case "bottom":
          tooltipTop = rect.bottom + scrollTop + padding
          tooltipLeft = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2
          break
        case "left":
          tooltipTop = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2
          tooltipLeft = rect.left + scrollLeft - tooltipWidth - padding
          break
        case "right":
          tooltipTop = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2
          tooltipLeft = rect.right + scrollLeft + padding
          break
        default:
          tooltipTop = rect.bottom + scrollTop + padding
          tooltipLeft = rect.left + scrollLeft
      }

      if (tooltipLeft < padding) {
        tooltipLeft = padding
      } else if (tooltipLeft + tooltipWidth > windowWidth - padding) {
        tooltipLeft = windowWidth - tooltipWidth - padding
      }

      if (tooltipTop < padding) {
        tooltipTop = padding
      } else if (tooltipTop + tooltipHeight > windowHeight - padding) {
        tooltipTop = windowHeight - tooltipHeight - padding
      }

      setTooltipStyle({
        top: tooltipTop,
        left: tooltipLeft,
      })

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [isActive, currentStep])

  if (!isActive) return null

  return (
    <div className="tutorial-overlay" ref={overlayRef}>
      <div className="tutorial-backdrop"></div>

      <div className="tutorial-highlight" style={highlightStyle}></div>

      <div className="tutorial-tooltip" style={tooltipStyle}>
        <button className="tutorial-close-button" onClick={onClose}>
          ×
        </button>
        <div className="tutorial-content">
          {currentStep < tutorialSteps.length ? tutorialSteps[currentStep].content : "Tutorial completed!"}
        </div>
        <div className="tutorial-controls">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="tutorial-button prev"
          >
            Previous
          </button>

          {currentStep < tutorialSteps.length - 1 ? (
            <button onClick={() => setCurrentStep(currentStep + 1)} className="tutorial-button next">
              Next
            </button>
          ) : (
            <button onClick={onClose} className="tutorial-button finish">
              Finish
            </button>
          )}
        </div>
        <div className="tutorial-progress">
          {currentStep + 1} / {tutorialSteps.length}
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [volatility, setVolatility] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [tVwap, setTVwap] = useState(null)
  const [statusOn, setStatusOn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [unrealizedPL, setUnrealizedPL] = useState(0)
  const [todaysPL, setTodaysPL] = useState(0)
  const [profitLoss, setProfitLoss] = useState(0)
  const [currentSession, setCurrentSession] = useState("")
  const [nextSession, setNextSession] = useState(null)
  const [nextSessionStart, setNextSessionStart] = useState(null)
  const [showStrategies, setShowStrategies] = useState(false)
  const [currentStrategy, setCurrentStrategy] = useState(null)
  const sessions = [
    { name: "LONDON", start: 7, end: 15 },
    { name: "NEW YORK", start: 15, end: 24 },
    { name: "TOKYO", start: 3, end: 7 },
  ]
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Price",
        data: [],
        fill: false,
        backgroundColor: "rgba(75,192,192,0.2)",
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  })
  const [balance, setBalance] = useState(null)
  const [consoleLogs, setConsoleLogs] = useState([])
  const [lastTimestamp, setLastTimestamp] = useState(null)
  const [rsiValue, setRsiValue] = useState(null)
  const [showTools, setShowTools] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTrades, setActiveTrades] = useState([])
  const [activeOrders, setActiveOrders] = useState([])
  const [latestPrice, setLatestPrice] = useState(null)
  const [livePrice, setLivePrice] = useState(null)
  const [tradeHistory, setTradeHistory] = useState([])
  const [realTimeChartData, setRealTimeChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Price",
        data: [],
        fill: false,
        backgroundColor: "rgba(0, 255, 0, 0.15)",
        borderColor: "rgba(0, 255, 0, 0.6)",
        pointRadius: 0,
      },
    ],
  })
  const [priceDirection, setPriceDirection] = useState("neutral") 
  const [priceChange, setPriceChange] = useState(0)
  const [previousPrice, setPreviousPrice] = useState(null)

  const [pivotPoints, setPivotPoints] = useState([])
  const [visiblePivotPoints, setVisiblePivotPoints] = useState({})

  const livePriceDelayRef = useRef(3000);

  const [chartSettings, setChartSettings] = useState({
    showMovingAverage: false,
    maLength: 20,
    showPriceChannel: false,
    channelPeriod: 10,
    showMomentumWaves: false,
    momentumPeriod: 14,
    showVolumeProfile: false,
    dataPoints: 100,
    showLegend: true,
    lineThickness: 2,
    timeFormat: 'HH:mm',
  });

  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('dashboardSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      fetchInterval: 2000,
      livePriceDelay: 3000,
      darkMode: true,
      notifications: true,
    };
  });

  const [dataCollectionStatus, setDataCollectionStatus] = useState({
    collectedPoints: 0,
    requiredPoints: 5,
    progressPercent: 0,
    timeRemaining: "00:00",
    isCollecting: true,
    error: null
  });

  const [errorDebounceTimer, setErrorDebounceTimer] = useState(null);
  const [showError, setShowError] = useState(false);

  const addLog = (message, type) => {
    const newLog = { message, type }
    setConsoleLogs((prevLogs) => [...prevLogs, newLog])
  }

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        display: chartSettings.showLegend,
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        backgroundColor: "rgba(18, 18, 18, 0.9)",
        titleColor: "rgba(255, 255, 255, 0.9)",
        bodyColor: "rgba(255, 255, 255, 0.7)",
        borderColor: "rgba(82, 217, 129, 0.3)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: "bold",
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(4)}`,
        },
      },
      annotation: {
        annotations: Object.entries(visiblePivotPoints).reduce((acc, [key, value]) => {
          const colorMap = {
            r2: 'rgba(255, 99, 132, 0.8)',
            r1: 'rgba(255, 159, 64, 0.8)',
            pivot_point: 'rgba(255, 255, 255, 0.8)',
            s1: 'rgba(75, 192, 192, 0.8)',
            s2: 'rgba(54, 162, 235, 0.8)'
          };
          
          const labelMap = {
            r2: 'R2',
            r1: 'R1',
            pivot_point: 'PP',
            s1: 'S1',
            s2: 'S2'
          };

          acc[`${key}Line`] = {
            type: 'line',
            yMin: value,
            yMax: value,
            borderColor: colorMap[key],
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
              content: labelMap[key],
              enabled: true,
              position: 'right'
            }
          };
          return acc;
        }, {})
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x'
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'x'
        }
      }
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          displayFormats: {
            minute: chartSettings.timeFormat,
          },
        },
        display: true,
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          color: "rgba(255, 255, 255, 0.7)"
        }
      },
      y: {
        display: true,
        position: "right",
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(1);
          },
          color: "rgba(255, 255, 255, 0.7)"
        },
        suggestedMin: chartData.datasets[0]?.data?.length > 0 
          ? Math.min(...chartData.datasets[0].data.map(d => d.y)) - 0.5
          : undefined,
        suggestedMax: chartData.datasets[0]?.data?.length > 0 
          ? Math.max(...chartData.datasets[0].data.map(d => d.y)) + 0.5
          : undefined,
        beginAtZero: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.1,
        borderWidth: chartSettings.lineThickness
      },
      point: {
        radius: 0,
        hoverRadius: 5
      }
    }
  }), [chartSettings, visiblePivotPoints, chartData]);

  const calculateIndicators = useCallback((data, startIndex, endIndex) => {
    if (!data || data.length === 0) return {};
    
    const result = {
      maData: [],
      upperChannel: [],
      lowerChannel: [],
      momentumWave: []
    };

    if (!chartSettings.showMovingAverage && !chartSettings.showPriceChannel && !chartSettings.showMomentumWaves) {
      return result;
    }

    const slicedData = data.slice(startIndex, endIndex);

    if (chartSettings.showMovingAverage) {
      const maWindow = new Array(chartSettings.maLength).fill(0);
      let sum = 0;
      
      for (let i = 0; i < slicedData.length; i++) {
        const price = slicedData[i].Close;
        sum = sum - maWindow[i % chartSettings.maLength] + price;
        maWindow[i % chartSettings.maLength] = price;
        
        if (i >= chartSettings.maLength - 1) {
          result.maData.push({
            x: new Date(slicedData[i].Time),
            y: sum / chartSettings.maLength
          });
        }
      }
    }

    if (chartSettings.showPriceChannel) {
      for (let i = chartSettings.channelPeriod - 1; i < slicedData.length; i++) {
        const period = slicedData.slice(i - chartSettings.channelPeriod + 1, i + 1);
        const prices = period.map(d => d.Close);
        result.upperChannel.push({
          x: new Date(slicedData[i].Time),
          y: Math.max(...prices)
        });
        result.lowerChannel.push({
          x: new Date(slicedData[i].Time),
          y: Math.min(...prices)
        });
      }
    }

    if (chartSettings.showMomentumWaves) {
      for (let i = 1; i < slicedData.length; i++) {
        const momentum = slicedData[i].Close - slicedData[i-1].Close;
        result.momentumWave.push({
          x: new Date(slicedData[i].Time),
          y: slicedData[i].Close + (momentum * 2)
        });
      }
    }

    return result;
  }, [chartSettings]);

  const fetchData = useCallback(() => {
    if (!statusOn) return;

    try {
      // Generate synthetic gold price data
      const data = generateGoldPriceData(chartSettings.dataPoints + 50);
      
      const startIndex = Math.max(0, data.length - chartSettings.dataPoints);
      const endIndex = data.length;
      
      const newLabels = [];
      const newCloseData = [];

      for (let i = startIndex; i < endIndex; i++) {
        const date = new Date(data[i].Time);
        newLabels.push(date);
        newCloseData.push({ x: date, y: parseFloat(data[i].Close) });
      }

      const indicators = calculateIndicators(data, startIndex, endIndex);

      const datasets = [
        {
          label: "Price",
          data: newCloseData,
          fill: chartSettings.chartStyle === 'area',
          backgroundColor: "rgba(82, 217, 129, 0.1)",
          borderColor: "rgba(82, 217, 129, 0.8)",
          pointBackgroundColor: "rgba(82, 217, 129, 1)",
          pointBorderColor: "#121212",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(82, 217, 129, 1)",
          pointHoverRadius: 5,
          tension: 0.1
        }
      ];

      if (pivotPoints && Object.keys(pivotPoints).length > 0) {
        const pivotLines = [
          { value: Number(pivotPoints.r2), label: 'R2', color: 'rgba(255, 99, 132, 0.4)' },
          { value: Number(pivotPoints.r1), label: 'R1', color: 'rgba(255, 159, 64, 0.4)' },
          { value: Number(pivotPoints.pivot_point), label: 'PP', color: 'rgba(255, 255, 255, 0.4)' },
          { value: Number(pivotPoints.s1), label: 'S1', color: 'rgba(75, 192, 192, 0.4)' },
          { value: Number(pivotPoints.s2), label: 'S2', color: 'rgba(54, 162, 235, 0.4)' }
        ];

        pivotLines.forEach(line => {
          if (line.value && !isNaN(line.value)) {
            datasets.push({
              label: line.label,
              data: newLabels.map(date => ({ x: date, y: line.value })),
              borderColor: line.color,
              borderWidth: 0.5,
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
              tension: 0
            });
          }
        });
      }

      if (chartSettings.showMovingAverage && indicators.maData.length) {
        datasets.push({
          label: `MA(${chartSettings.maLength})`,
          data: indicators.maData,
          fill: false,
          borderColor: "rgba(255, 207, 51, 0.8)",
          borderWidth: 1.5,
          pointRadius: 0
        });
      }

      if (chartSettings.showPriceChannel && indicators.upperChannel.length) {
        datasets.push(
          {
            label: "Upper Channel",
            data: indicators.upperChannel,
            fill: false,
            borderColor: "rgba(255, 99, 132, 0.5)",
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [5, 5]
          },
          {
            label: "Lower Channel",
            data: indicators.lowerChannel,
            fill: false,
            borderColor: "rgba(54, 162, 235, 0.5)",
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [5, 5]
          }
        );
      }

      if (chartSettings.showMomentumWaves && indicators.momentumWave.length) {
        datasets.push({
          label: "Momentum Wave",
          data: indicators.momentumWave,
          fill: false,
          borderColor: "rgba(153, 102, 255, 0.5)",
          borderWidth: 1,
          pointRadius: 0
        });
      }

      setChartData({
        labels: newLabels,
        datasets
      });

      const latestData = data[data.length - 1];
      setRsiValue(latestData.RSI);
      setLatestPrice(parseFloat(latestData.Close));

    } catch (error) {
      console.error("Error generating data:", error);
    }
  }, [statusOn, chartSettings, calculateIndicators, pivotPoints]);

  const fetchLivePrice = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchTime.current < settings.livePriceDelay || isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
      
      // Generate synthetic live price
      const newPrice = generateLivePrice(previousPrice);

      if (previousPrice !== null) {
        if (newPrice > previousPrice) {
          setPriceDirection("up");
          setPriceChange(newPrice - previousPrice);
        } else if (newPrice < previousPrice) {
          setPriceDirection("down");
          setPriceChange(previousPrice - newPrice);
        } else {
          setPriceDirection("neutral");
          setPriceChange(0);
        }
      }

      setPreviousPrice(newPrice);
      setLivePrice(newPrice);

      const currentTime = new Date();
      setRealTimeChartData(prevData => {
        const newLabels = [...prevData.labels, currentTime];
        const newData = [...prevData.datasets[0].data, { x: currentTime, y: newPrice }];

        if (newLabels.length > 50) {
          newLabels.shift();
          newData.shift();
        }

        return {
          labels: newLabels,
          datasets: [{
            ...prevData.datasets[0],
            data: newData,
            borderColor: priceDirection === "up" ? "rgba(0, 230, 118, 1)" : 
                        priceDirection === "down" ? "rgba(255, 71, 71, 1)" : 
                        "rgba(82, 217, 129, 1)",
            backgroundColor: priceDirection === "up" ? "rgba(0, 230, 118, 0.1)" :
                           priceDirection === "down" ? "rgba(255, 71, 71, 0.1)" :
                           "rgba(82, 217, 129, 0.1)"
          }]
        };
      });

      lastFetchTime.current = now;
    } catch (err) {
      console.error("Error generating live price:", err);
    } finally {
      isFetching.current = false;
    }
  }, [previousPrice, priceDirection, settings.livePriceDelay]);

  const realTimeChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        callbacks: {
          title: () => null,
          label: (context) => `${context.parsed.y.toFixed(2)}`
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x'
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'x'
        }
      }
    },
    scales: {
      x: {
        type: "time",
        display: false,
        ticks: {
          maxTicksLimit: 5
        }
      },
      y: {
        display: true,
        position: "right",
        grid: {
          display: false
        },
        ticks: {
          count: 5,
          callback: (value) => value.toFixed(2)
        },
        // Use a fixed range to prevent constant recalculation
        min: realTimeChartData.datasets[0]?.data?.length > 0 
          ? Math.min(...realTimeChartData.datasets[0].data.map(d => d.y)) - 0.5 
          : 2095,
        max: realTimeChartData.datasets[0]?.data?.length > 0 
          ? Math.max(...realTimeChartData.datasets[0].data.map(d => d.y)) + 0.5 
          : 2105
      }
    },
    elements: {
      line: {
        tension: 0.1
      },
      point: {
        radius: 0
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }), [realTimeChartData]);

  const intervalsRef = useRef({});

  const handleSettingsChange = (newSettings) => {
    console.log("Dashboard received settings change:", newSettings);
    
    localStorage.setItem('dashboardSettings', JSON.stringify(newSettings));
    
    if (statusOn) {
      console.log("Clearing all intervals before applying new settings");
      clearAllIntervals()
    }

    setSettings(newSettings)
    console.log("Settings updated in Dashboard:", newSettings);
  }

  const clearAllIntervals = () => {
    Object.values(intervalsRef.current).forEach(clearInterval);
    intervalsRef.current = {};
  }

  const updateCurrentSession = () => {
    const now = new Date()
    const latviaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
    const currentHour = latviaTime.getUTCHours()

    let activeSession = "CLOSED"
    let nextSession = null
    let nextSessionStart = null

    const sortedSessions = [...sessions].sort((a, b) => a.start - b.start)

    for (const session of sessions) {
      const adjustedStart = session.start >= 24 ? session.start - 24 : session.start
      const adjustedEnd = session.end >= 24 ? session.end - 24 : session.end

      if (
        (adjustedStart < adjustedEnd && currentHour >= adjustedStart && currentHour < adjustedEnd) ||
        (adjustedStart > adjustedEnd && (currentHour >= adjustedStart || currentHour < adjustedEnd))
      ) {
        activeSession = session.name
        break
      }
    }

    for (const session of sortedSessions) {
      const adjustedStart = session.start >= 24 ? session.start - 24 : session.start
      if (adjustedStart > currentHour) {
        nextSession = session.name
        nextSessionStart = adjustedStart
        break
      }
    }

    if (!nextSession && sortedSessions.length > 0) {
      nextSession = sortedSessions[0].name
      nextSessionStart = sortedSessions[0].start >= 24 ? sortedSessions[0].start - 24 : sortedSessions[0].start
    }

    setCurrentSession(activeSession)
    setNextSession(nextSession)
    setNextSessionStart(nextSessionStart)
  }

  const formatDate = (date) => {
    const options = { year: "numeric", month: "numeric", day: "numeric" }
    return new Intl.DateTimeFormat("en-US", options).format(date)
  }

  const fetchActiveTrades = useCallback(() => {
    try {
      // Generate synthetic active trades data
      const trades = generateActiveTrades(Math.floor(Math.random() * 4) + 1);
      setActiveTrades(trades);
    } catch (err) {
      console.error("Error generating active trades:", err);
    }
  }, []);

  const fetchVolatility = useCallback(() => {
    try {
      // Generate synthetic volatility data
      const data = generateVolatility();
      setVolatility(data.volatility);
      setTVwap(data.t_vwap);
      setLastUpdated(data.last_updated);
    } catch (err) {
      console.error("Error generating volatility data:", err);
    }
  }, []);

  const fetchBalance = useCallback(() => {
    try {
      // Generate synthetic balance
      const balance = generateBalance();
      setBalance(balance);
    } catch (err) {
      console.error("Error generating balance:", err);
    }
  }, []);

  const fetchUnrealizedPL = useCallback(() => {
    try {
      // Generate synthetic unrealized P/L
      const unrealizedPL = (Math.random() * 200) - 100; // Range from -100 to +100
      setUnrealizedPL(unrealizedPL);
    } catch (err) {
      console.error("Error generating unrealized P/L:", err);
    }
  }, []);

  const fetchProfitLoss = useCallback(() => {
    try {
      // Generate synthetic profit/loss
      const pl = (Math.random() * 500) - 200; // Range from -200 to +300
      setProfitLoss(pl);
    } catch (err) {
      console.error("Error generating profit/loss:", err);
    }
  }, []);

  const fetchTradeHistory = useCallback(() => {
    try {
      // Generate synthetic trade history
      const history = generateTradeHistory(10);
      setTradeHistory(history);
    } catch (err) {
      console.error("Error generating trade history:", err);
    }
  }, []);

  const fetchPivotPoints = useCallback(() => {
    try {
      // Generate synthetic pivot points based on the latest price
      const basePrice = latestPrice || 2100;
      const pivots = generatePivotPoints(basePrice);
      setPivotPoints(pivots);
    } catch (err) {
      console.error("Error generating pivot points:", err);
    }
  }, [latestPrice]);

  const fetchDataCollectionStatus = () => {
    try {
      // Generate synthetic data collection status
      // Randomly decide if we're collecting data or not (20% chance of collecting)
      const isCollecting = Math.random() < 0.2;
      const status = generateDataCollectionStatus(isCollecting);
      
      if (errorDebounceTimer) {
        clearTimeout(errorDebounceTimer);
        setErrorDebounceTimer(null);
      }
      
      setShowError(false);
      setDataCollectionStatus(status);
    } catch (error) {
      console.error("Error generating data collection status:", error);
      
      setDataCollectionStatus(prev => ({
        ...prev,
        error: "Error generating data collection status"
      }));
      
      if (!errorDebounceTimer) {
        const timer = setTimeout(() => {
          setShowError(true);
        }, 3000);
        setErrorDebounceTimer(timer);
      }
    }
  };

  const filterPivotPoints = useCallback((pivots, lastPrice) => {
    if (!pivots || !lastPrice) return {};
    
    const range = 20;
    const filtered = {};
    
    if (Math.abs(pivots.r2 - lastPrice) <= range) filtered.r2 = pivots.r2;
    if (Math.abs(pivots.r1 - lastPrice) <= range) filtered.r1 = pivots.r1;
    if (Math.abs(pivots.pivot_point - lastPrice) <= range) filtered.pivot_point = pivots.pivot_point;
    if (Math.abs(pivots.s1 - lastPrice) <= range) filtered.s1 = pivots.s1;
    if (Math.abs(pivots.s2 - lastPrice) <= range) filtered.s2 = pivots.s2;
    
    return filtered;
  }, []);

  useEffect(() => {
    if (chartData.datasets[0]?.data?.length > 0 && pivotPoints) {
      const lastPrice = chartData.datasets[0].data[chartData.datasets[0].data.length - 1].y;
      const filtered = filterPivotPoints(pivotPoints, lastPrice);
      setVisiblePivotPoints(filtered);
    }
  }, [pivotPoints, chartData, filterPivotPoints]);

  const fetchActiveOrders = useCallback(() => {
    try {
      // Generate synthetic active orders
      const orders = generateActiveOrders(Math.floor(Math.random() * 3) + 1);
      setActiveOrders(orders);
    } catch (err) {
      console.error("Error generating active orders:", err);
    }
  }, []);

  useEffect(() => {
    if (!statusOn) {
      setChartData({
        labels: [],
        datasets: [{
            label: "Price",
            data: [],
            fill: true,
            backgroundColor: "rgba(82, 217, 129, 0.1)",
            borderColor: "rgba(82, 217, 129, 0.8)",
            pointBackgroundColor: "rgba(82, 217, 129, 1)",
            pointBorderColor: "#121212",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(82, 217, 129, 1)",
            pointHoverRadius: 5,
          tension: 0.1
        }]
      });
      setRealTimeChartData({
        labels: [],
        datasets: [{
            label: "Price",
            data: [],
            fill: true,
            backgroundColor: "rgba(82, 217, 129, 0.1)",
            borderColor: "rgba(82, 217, 129, 1)",
            borderWidth: 2.5,
            pointRadius: 0,
          tension: 0.1
        }]
      });
      setUnrealizedPL(0);
      setLivePrice(0);
      setProfitLoss(0);
      setBalance(null);
      setConsoleLogs([]);
      setTradeHistory([]);
      setVolatility(0);
      setActiveTrades([]);
      setActiveOrders([]);
      setPivotPoints([]);
      setLastTimestamp(null);
      
      if (errorDebounceTimer) {
        clearTimeout(errorDebounceTimer);
        setErrorDebounceTimer(null);
      }
      setShowError(false);
      setDataCollectionStatus(prev => ({
        ...prev,
        error: null
      }));
      
      return;
    }

    // Generate initial synthetic data
    const loadInitialData = () => {
      // Load all data types at once
      fetchData();
      fetchBalance();
      fetchUnrealizedPL();
      fetchProfitLoss();
      fetchTradeHistory();
      fetchActiveTrades();
      fetchActiveOrders();
      fetchVolatility();
      fetchLivePrice();
      fetchPivotPoints();
      fetchDataCollectionStatus();
      
      // Add a log entry
      addLog("Synthetic data loaded successfully", "info");
    };

    loadInitialData();

    // Set up intervals to refresh data for a preview with frequent updates
    // but keep balance and stats completely static
    const intervals = {
      // Price chart data - only fetch once at startup (static data)
      // We don't need an interval for this as it's static
      
      // Account info - completely static, no updates needed
      // We'll fetch these values once at startup and they'll remain static
      
      // Live price - update every 1 second for dynamic preview
      livePrice: setInterval(fetchLivePrice, 1000),
      
      // Market data - update every 10 seconds
      volatility: setInterval(fetchVolatility, 10000),
      
      // Trade history - update every 20 seconds 
      history: setInterval(fetchTradeHistory, 20000),
      
      // Active trades - update every 1 second for dynamic preview
      active: setInterval(fetchActiveTrades, 1000),
      
      // Active orders - update every 15 seconds
      activeOrders: setInterval(fetchActiveOrders, 15000),
      
      // Pivot points - update every 30 seconds
      pivots: setInterval(fetchPivotPoints, 30000),
      
      // Data collection status - update every 5 seconds
      dataCollection: setInterval(fetchDataCollectionStatus, 5000)
    };

    intervalsRef.current = intervals;

    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
      intervalsRef.current = {};
    };
  }, [
    statusOn,
    settings.fetchInterval,
    settings.livePriceDelay,
    fetchData,
    fetchBalance,
    fetchUnrealizedPL,
    fetchProfitLoss,
    fetchTradeHistory,
    fetchActiveTrades,
    fetchActiveOrders,
    fetchVolatility,
    fetchLivePrice,
    fetchPivotPoints,
    fetchDataCollectionStatus,
    addLog
  ]);

  const handleToggleStatus = () => {
    setStatusOn((prev) => !prev);
    addLog(`Data retrieval ${statusOn ? "stopped" : "started"}`, "info");
    
    if (statusOn) {
      setActiveOrders([]);
      setActiveTrades([]);
    }
  }

  const handleToggleTools = () => {
    setShowTools((prev) => !prev)
  }
  const handleToggleSettings = () => {
    setShowSettings((prev) => !prev)
  }

  const handleToggleStrategies = () => {
    setShowStrategies((prev) => !prev)
  }

  const handleChartSettingChange = (setting, value) => {
    setChartSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  useEffect(() => {
    const fetchCurrentStrategy = () => {
      try {
        // Generate synthetic current strategy
        const strategy = generateCurrentStrategy();
        setCurrentStrategy(strategy);
      } catch (err) {
        console.error('Error generating current strategy:', err);
      }
    };

    if (statusOn) {
      fetchCurrentStrategy();
      const interval = setInterval(fetchCurrentStrategy, 5000);
      return () => clearInterval(interval);
    }
  }, [statusOn]);

  return (
    <div className="dashboardContainer">


      <Settings showSettings={showSettings} setShowSettings={setShowSettings} onSettingsChange={handleSettingsChange} />
      <TutorialOverlay
        isActive={showTutorial}
        onClose={() => {
          setShowTutorial(false)
          setTutorialStep(0)
        }}
        currentStep={tutorialStep}
        setCurrentStep={setTutorialStep}
      />
      <Tools showTools={showTools} setShowTools={setShowTools} />
      <Strategies showStrategies={showStrategies} setShowStrategies={setShowStrategies} />
      <div className="dashHeader">
        <motion.button
          className={`statusButton ${statusOn ? "On" : "Off"}`}
          onClick={handleToggleStatus}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        ></motion.button>
        <motion.img
          src={logo}
          alt=""
          className="logo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />
        <div className="strategy-status">
          {currentStrategy && (
            <motion.div
              className="strategy-badge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ backgroundColor: currentStrategy.color || '#00ff9d' }}
            >
              {currentStrategy.name}
            </motion.div>
          )}
        </div>
        <div className="headerButtons">
          <motion.button
            className="tutorialButton"
            onClick={() => {
              setShowTutorial(true)
              setTutorialStep(0)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="tutorialIcon" />
            <span className="tutorialText">Tutorial</span>
          </motion.button>
          <motion.button
            className="toolsButton"
            onClick={handleToggleTools}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faTools} />
          </motion.button>
          <motion.button
            className="settingsButton"
            onClick={handleToggleSettings}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faCog} />
            <span>Settings</span>
          </motion.button>
          <motion.button
            className="strategyButton"
            onClick={handleToggleStrategies}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faChartLine} />
            <span>Strategies</span>
          </motion.button>
        </div>
      </div>

      <div className="boxContainer">
        <motion.div
          className="dashBox L"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="chartBox">
            <div className="chartTop">
              <div className="chartDataBox">
                <div className="testVersion">DEMO TEST VERSION</div>
              </div>
            </div>
            <div className="chart">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="rightContainer">
            <motion.div
              className="eventsBox"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="eventTitle">CHART SETTINGS</div>
              <div className="chartSettingsContainer">
                <div className="settingGroup">
                  <label className="settingLabel">
                    <input
                      type="checkbox"
                      checked={chartSettings.showMovingAverage}
                      onChange={(e) => handleChartSettingChange('showMovingAverage', e.target.checked)}
                    />
                    Dynamic MA ({chartSettings.maLength})
                  </label>
                  {chartSettings.showMovingAverage && (
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={chartSettings.maLength}
                      onChange={(e) => handleChartSettingChange('maLength', parseInt(e.target.value))}
                      className="settingSlider"
                    />
                  )}
                </div>

                <div className="settingGroup">
                  <label className="settingLabel">
                    <input
                      type="checkbox"
                      checked={chartSettings.showPriceChannel}
                      onChange={(e) => handleChartSettingChange('showPriceChannel', e.target.checked)}
                    />
                    Price Channel
                  </label>
                  {chartSettings.showPriceChannel && (
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={chartSettings.channelPeriod}
                      onChange={(e) => handleChartSettingChange('channelPeriod', parseInt(e.target.value))}
                      className="settingSlider"
                    />
                  )}
                </div>

                <div className="settingGroup">
                  <label className="settingLabel">
                    <input
                      type="checkbox"
                      checked={chartSettings.showMomentumWaves}
                      onChange={(e) => handleChartSettingChange('showMomentumWaves', e.target.checked)}
                    />
                    Momentum Waves
                  </label>
                </div>

                <div className="settingGroup">
                  <label className="settingLabel">Data Points</label>
                  <input
                    type="range"
                    min="3"
                    max="300"
                    value={chartSettings.dataPoints}
                    onChange={(e) => handleChartSettingChange('dataPoints', parseInt(e.target.value))}
                    className="settingSlider"
                  />
                  <span className="settingValue">{chartSettings.dataPoints}</span>
                </div>

                <div className="settingGroup">
                  <label className="settingLabel">
                    <input
                      type="checkbox"
                      checked={chartSettings.showLegend}
                      onChange={(e) => handleChartSettingChange('showLegend', e.target.checked)}
                    />
                    Show Legend
                  </label>
                </div>

                <div className="settingGroup">
                  <label className="settingLabel">Line Thickness</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={chartSettings.lineThickness}
                    onChange={(e) => handleChartSettingChange('lineThickness', parseInt(e.target.value))}
                    className="settingSlider"
                  />
                </div>

                <div className="settingGroup">
                  <label className="settingLabel">Time Format</label>
                  <select
                    value={chartSettings.timeFormat}
                    onChange={(e) => handleChartSettingChange('timeFormat', e.target.value)}
                    className="settingSelect"
                  >
                    <option value="HH:mm">24h (HH:mm)</option>
                    <option value="hh:mm a">12h (hh:mm AM/PM)</option>
                  </select>
                </div>
              </div>
            </motion.div>

            
          </div>
        </motion.div>

        <motion.div
          className="dashBox S"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="activeTradesBox">
            <div className="activeHeading">ACTIVE TRADES</div>

            {activeTrades.length > 0 ? (
              <div className="activeTrades-table">
                <div className="activeTrades-header">
                  <div className="col direction">DIRECTION</div>
                  <div className="col price">INST</div>
                  <div className="col units">UNITS</div>
                  <div className="col pl">P/L</div>
                  <div className="col margin">MARGIN</div>
                </div>
                <div className="activeTrades-body">
                  <AnimatePresence>
                    {activeTrades.map((trade, index) => (
                      <motion.div
                        className="activeTrades-row"
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className={`col direction ${trade.currentUnits > 0 ? "long" : "short"}`}>
                          {trade.currentUnits > 0 ? "LONG" : "SHORT"}
                        </div>
                        <div className="col price">{trade.pair || "XAUUSD"}</div>
                        <div className="col units">{Math.abs(trade.currentUnits) || "0"}</div>
                        <motion.div
                          className={`col pl ${Number.parseFloat(trade.unrealizedPL) >= 0 ? "positive" : "negative"}`}
                          animate={{
                            scale: [1, 1.05, 1],
                            transition: { duration: 0.3 },
                          }}
                          key={trade.unrealizedPL}
                        >
                          {Number.parseFloat(trade.unrealizedPL).toFixed(2)}
                        </motion.div>
                        <div className="col margin">{trade.marginUsed || "0.00"}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="noEvent">No active trades available.</div>
            )}
          </div>
          <div className="activeOrdersBox">
            <div className="activeHeading">ACTIVE ORDERS</div>
            <ActiveOrdersTable activeOrders={activeOrders} />
          </div>
        </motion.div>

        <motion.div
          className="dashBox XS"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="historyHeading">TRADE HISTORY</div>
          {tradeHistory.length > 0 ? (
            <div className="trade-history-table">
              <div className="trade-history-header">
                <div className="col order-id">ORDER ID</div>
                <div className="col units">UNITS</div>
                <div className="col price">PRICE</div>
                <div className="col pl">P/L</div>
              </div>
              <div className="trade-history-body">
                <AnimatePresence>
                  {tradeHistory
                    .slice()
                    .reverse()
                    .map((trade, index) => (
                      <motion.div
                        className="trade-history-row"
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                      >
                        <div className="col order-id">{trade.order_id?.substring(0, 8) || "---"}</div>
                        <div className="col units">{trade.units}</div>
                        <div className="col price">{trade.price}</div>
                        <motion.div
                          className={`col pl ${Number.parseFloat(trade.pl) >= 0 ? "positive" : "negative"}`}
                          animate={{
                            scale: [1, 1.05, 1],
                            transition: { duration: 0.3 },
                          }}
                          key={trade.pl}
                        >
                          {Number.parseFloat(trade.pl).toFixed(2)}
                        </motion.div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="noEvent">No trade history available.</div>
          )}
        </motion.div>

        <motion.div
          className="dashBox Mn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="balanceBox">
            <div className="balanceHeading">CURRENT BALANCE: </div>
            <div className="balance">
              {balance !== null ? `${balance} USD` : "..."}
            </div>
            <div className="balanceBottomLeft"></div>
            <div className="balanceBottomRight">
              <motion.button
                className="transactionsButton"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                PRACTICE
              </motion.button>
            </div>
          </div>
          <div className="infoBox">
            <div className="balanceHeading low">STATS: </div>
            <div className="statBox">
              <div className="statCount redText">
                -123.45
              </div>
              <div className="statTitle">U/PROFIT</div>
            </div>

            <div className="statBox">
              <div className="statCount greenText">
                678.90
              </div>
              <div className="statTitle">P/L</div>
            </div>
            <div className="statBox">
              <div className="statCount greenText">
                456.78
              </div>
              <div className="statTitle">P/L</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="dashBox M"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="realTimeChartBox">
            <div className="price-display">
              <motion.div
                className={`price-value ${priceDirection === "up" ? "price-up" : priceDirection === "down" ? "price-down" : ""}`}
                key={livePrice}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5 }} // Slower animation for smoother transitions
              >
                {livePrice !== null ? livePrice.toFixed(2) : "..."}
              </motion.div>
              {priceDirection !== "neutral" && (
                <motion.div
                  className={`price-change ${priceDirection === "up" ? "price-up" : "price-down"}`}
                  initial={{ opacity: 0, x: priceDirection === "up" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.0 }} // Slower animation for smoother transitions
                >
                  {priceDirection === "up" ? "+" : "-"}
                  {priceChange.toFixed(2)} {/* Show fewer decimal places */}
                </motion.div>
              )}
            </div>
            <div className="chart-container">
              <Line className="chartLive" data={realTimeChartData} options={realTimeChartOptions} />
              <div className="chart-overlay">
                <div className="chart-grid-lines">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="grid-line"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
