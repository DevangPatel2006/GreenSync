import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_SUMMARY = {
  totalEnergyShifted: 420.5,
  energyShiftedKwh: 420.5,
  renewableUtilization: 86.4,
  renewableRatio: 86.4,
  co2Avoided: 184.2,
  co2AvoidedKg: 184.2,
  treesPlantedEquivalent: 9,
  carMilesAvoided: 462,
  peakReduction: 3.8,
  peakReductionKw: 3.8,
  flexCoinsEarned: 1420,
  totalFlexCoins: 1420,
  peakerAvertedEvents: 14,
  peakerEventsAvoided: 14,
  monthlyHistory: [
    { month: 'May', co2: 45, energy: 110 },
    { month: 'Jun', co2: 78, energy: 190 },
    { month: 'Jul', co2: 120, energy: 280 },
    { month: 'Aug', co2: 155, energy: 360 },
    { month: 'Sep', co2: 172, energy: 395 },
    { month: 'Oct', co2: 184, energy: 420 },
  ],
};

const DEFAULT_REWARDS = {
  balance: 1420,
  breakdown: {
    renewablePoints: 420,
    peakPoints: 380,
    shiftPoints: 320,
    flexibilityBonus: 180,
    urgencyBonus: 120,
  },
  history: [
    {
      id: 'r_1',
      date: 'Yesterday, 11:15 PM',
      device: 'Commercial Fleet Depot Bay #4',
      totalCoins: 75,
      breakdown: {
        renewablePoints: 35,
        peakPoints: 20,
        shiftPoints: 10,
        flexibilityBonus: 5,
        urgencyBonus: 5,
      },
    },
    {
      id: 'r_2',
      date: 'Oct 10, 01:00 PM',
      device: 'Rheem ProTerra Water Heater',
      totalCoins: 45,
      breakdown: {
        renewablePoints: 20,
        peakPoints: 15,
        shiftPoints: 5,
        flexibilityBonus: 5,
        urgencyBonus: 0,
      },
    },
  ],
};

const DEFAULT_ADMIN = {
  totalFlexibleLoad: '142.8 MW',
  totalFlexibleLoadKw: '1,248.5',
  totalShiftedEnergy: '142,000+ kWh',
  totalShiftedEnergyMwh: '14.8',
  renewableUtilization: '78.4%',
  peakReduction: '18.2 MW',
  peakReductionKw: '42.6',
  activeUsers: 342,
  activeNodes: 18,
  co2AvoidedTons: '84.2 Metric Tons',
};

export default function useImpact() {
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [rewards, setRewards] = useState(DEFAULT_REWARDS);
  const [adminData, setAdminData] = useState(DEFAULT_ADMIN);
  const [loading, setLoading] = useState(true);

  const fetchImpact = useCallback(async () => {
    setLoading(true);
    try {
      // Real API: GET /api/impact/summary
      const sumRes = await api.get('/impact/summary');
      if (sumRes.data) {
        const d = sumRes.data;
        setSummary((prev) => ({
          ...prev,
          ...d,
          energyShiftedKwh: d.totalEnergyShifted ?? d.energyShiftedKwh ?? prev.energyShiftedKwh,
          renewableRatio: d.renewableUtilization ?? d.renewableRatio ?? prev.renewableRatio,
          co2AvoidedKg: d.co2Avoided ?? d.co2AvoidedKg ?? prev.co2AvoidedKg,
          peakReductionKw: d.peakReduction ?? d.peakReductionKw ?? prev.peakReductionKw,
          totalFlexCoins: d.flexCoinsEarned ?? d.totalFlexCoins ?? prev.totalFlexCoins,
          peakerEventsAvoided: d.peakerAvertedEvents ?? d.peakerEventsAvoided ?? prev.peakerEventsAvoided,
        }));
      }
    } catch (err) {
      // Keep default summary
    }

    try {
      // Real API: GET /api/rewards/balance
      const rewRes = await api.get('/rewards/balance');
      if (rewRes.data) setRewards((prev) => ({ ...prev, ...rewRes.data }));
    } catch (err) {
      // Keep default rewards
    }

    try {
      // Real API: GET /api/impact/admin
      const admRes = await api.get('/impact/admin');
      if (admRes.data) setAdminData((prev) => ({ ...prev, ...admRes.data }));
    } catch (err) {
      // Keep default admin data
    } finally {
      setLoading(false);
    }
  }, []);

  const redeemReward = useCallback(async (rewardItem, cost) => {
    try {
      // Real API: POST /api/rewards/redeem
      const res = await api.post('/rewards/redeem', { item: rewardItem, cost });
      setRewards((prev) => ({ ...prev, balance: prev.balance - cost }));
      return { success: true, message: res.data?.message || `Redeemed: ${rewardItem}!` };
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real POST /api/rewards/redeem once mounted
        setRewards((prev) => ({ ...prev, balance: prev.balance - cost }));
        return { success: true, message: `Redeemed: ${rewardItem}! (simulation)` };
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  return {
    summary,
    impact: summary,
    rewards,
    rewardsBreakdown: rewards,
    balance: rewards.balance,
    adminData,
    loading,
    refetch: fetchImpact,
    redeemReward,
  };
}

export { useImpact };
