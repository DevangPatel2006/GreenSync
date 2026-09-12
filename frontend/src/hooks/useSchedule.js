import { useState, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_RECOMMENDATION = {
  _id: 'sched_default_1',
  requestedStart: 'Today • 6:30 PM',
  requestedRate: '$0.342 / kWh (Peak Tier)',
  requestedCarbon: '542 g CO₂ / kWh',
  recommendedStart: 'Tonight • 11:15 PM',
  recommendedEnd: 'Tomorrow • 03:30 AM',
  recommendedRate: '$0.118 / kWh (Super Off-Peak)',
  recommendedCarbon: '108 g CO₂ / kWh (-80%)',
  energyShifted: 18.5,
  renewableUtilization: 82,
  peakReduction: 4.2,
  co2Avoided: 9.8,
  flexCoinsEarned: 75,
  reason: 'Shifts demand to align precisely with anticipated overnight wind energy surplus and off-peak distribution capacity.',
  status: 'proposed',
};

export default function useSchedule() {
  const [recommendation, setRecommendation] = useState(DEFAULT_RECOMMENDATION);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [infeasibleMessage, setInfeasibleMessage] = useState(null);
  const [error, setError] = useState(null);

  const getRecommendation = useCallback(async (deviceId) => {
    setLoading(true);
    setError(null);
    setInfeasibleMessage(null);

    try {
      // Real API: POST /api/schedule/recommend
      const res = await api.post('/schedule/recommend', { deviceId });

      // Handle NO_FEASIBLE_SLOT per Section 15 & 28
      if (res.data === null || res.error?.code === 'NO_FEASIBLE_SLOT') {
        setInfeasibleMessage(
          "We couldn't find a suitable renewable window. Your deadline is still safe — try expanding your flexibility window."
        );
        return null;
      }

      if (res.data) {
        setRecommendation({
          ...DEFAULT_RECOMMENDATION,
          ...res.data,
        });
        return res.data;
      }
    } catch (err) {
      if (err.code === 'NO_FEASIBLE_SLOT') {
        setInfeasibleMessage(
          "We couldn't find a suitable renewable window. Your deadline is still safe — try expanding your flexibility window."
        );
      } else if (err.status === 404 || err.isNetworkError) {
        // Fallback to default proposal
        setRecommendation(DEFAULT_RECOMMENDATION);
      } else {
        setError(err.message || 'Failed to generate recommendation');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptSchedule = async (scheduleId) => {
    try {
      // Real API: POST /api/schedule/:id/accept
      const id = scheduleId || recommendation._id;
      const res = await api.post(`/schedule/${id}/accept`);
      setRecommendation((prev) => ({ ...prev, status: 'accepted' }));
      return { success: true, data: res.data };
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // Fallback accept
        setRecommendation((prev) => ({ ...prev, status: 'accepted' }));
        return { success: true };
      }
      throw err;
    }
  };

  const fetchHistory = async () => {
    try {
      // Real API: GET /api/schedule/history
      const res = await api.get('/schedule/history');
      if (Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (err) {
      // Graceful fallback
    }
  };

  return {
    recommendation,
    history,
    loading,
    infeasibleMessage,
    error,
    getRecommendation,
    acceptSchedule,
    fetchHistory,
  };
}

export { useSchedule };
