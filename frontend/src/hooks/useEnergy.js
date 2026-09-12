import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_CURRENT = {
  timestamp: new Date().toISOString(),
  renewableAvailability: 74,
  gridDemand: 'normal',
  price: 0.142,
  source: 'simulated',
  node: 'TX-8801 Regional Grid Node #4',
};

const DEFAULT_FORECAST = [
  { hour: '8a', renewable: 35, baseline: 50 },
  { hour: '10a', renewable: 52, baseline: 55 },
  { hour: '12p', renewable: 78, baseline: 45 },
  { hour: '1p', renewable: 84, baseline: 40 },
  { hour: '2p', renewable: 80, baseline: 42 },
  { hour: '3p', renewable: 70, baseline: 48 },
  { hour: '4p', renewable: 58, baseline: 60 },
  { hour: '6p', renewable: 28, baseline: 85 },
  { hour: '8p', renewable: 30, baseline: 75 },
  { hour: '10p', renewable: 42, baseline: 50 },
];

export default function useEnergy() {
  const [current, setCurrent] = useState(DEFAULT_CURRENT);
  const [forecast, setForecast] = useState(DEFAULT_FORECAST);
  const [loading, setLoading] = useState(true);

  const fetchEnergy = useCallback(async () => {
    setLoading(true);
    try {
      // Real API: GET /api/energy/current
      const currentRes = await api.get('/energy/current');
      if (currentRes.data) {
        setCurrent({
          ...DEFAULT_CURRENT,
          ...currentRes.data,
        });
      }
    } catch (err) {
      // Silent fallback to simulated data per Section 16 (Never surface external energy failure as hard error)
      setCurrent({
        ...DEFAULT_CURRENT,
        source: 'simulated',
      });
    }

    try {
      // Real API: GET /api/energy/forecast
      const forecastRes = await api.get('/energy/forecast?hours=10');
      if (Array.isArray(forecastRes.data) && forecastRes.data.length > 0) {
        setForecast(forecastRes.data);
      }
    } catch (err) {
      // Keep default forecast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnergy();
  }, [fetchEnergy]);

  return {
    current,
    forecast,
    loading,
    refetch: fetchEnergy,
    isLive: current.source === 'live',
  };
}

export { useEnergy };
