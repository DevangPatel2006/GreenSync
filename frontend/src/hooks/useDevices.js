import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_DEVICES = [
  {
    _id: 'dev_1',
    name: 'Tesla Model 3',
    type: 'ev_charging',
    energyRequired: 9.6,
    earliestStart: new Date(Date.now() + 1800000).toISOString(),
    deadline: new Date(Date.now() + 28800000).toISOString(),
    flexibility: 'high',
    priority: 'normal',
    status: 'active',
    shiftedKwh: 42.5,
    coinsEarned: 120,
  },
  {
    _id: 'dev_2',
    name: 'Rheem ProTerra Hybrid',
    type: 'water_heater',
    energyRequired: 3.8,
    earliestStart: new Date(Date.now() + 3600000).toISOString(),
    deadline: new Date(Date.now() + 36000000).toISOString(),
    flexibility: 'medium',
    priority: 'normal',
    status: 'active',
    shiftedKwh: 18.2,
    coinsEarned: 65,
  },
  {
    _id: 'dev_3',
    name: 'Daikin VRV Heat Pump',
    type: 'industrial',
    energyRequired: 5.4,
    earliestStart: new Date(Date.now() + 900000).toISOString(),
    deadline: new Date(Date.now() + 18000000).toISOString(),
    flexibility: 'medium',
    priority: 'high',
    status: 'active',
    shiftedKwh: 88.0,
    coinsEarned: 210,
  },
  {
    _id: 'dev_4',
    name: 'Bosch 800 Series Dishwasher',
    type: 'washing_machine',
    energyRequired: 1.4,
    earliestStart: new Date(Date.now() + 7200000).toISOString(),
    deadline: new Date(Date.now() + 43200000).toISOString(),
    flexibility: 'low',
    priority: 'low',
    status: 'paused',
    shiftedKwh: 6.4,
    coinsEarned: 25,
  },
];

export default function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Real API: GET /api/devices
      const res = await api.get('/devices');
      const list = Array.isArray(res.data) ? res.data : res.data?.devices || [];
      setDevices(list);
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real GET /api/devices once device router is mounted
        setDevices((prev) => (prev.length > 0 ? prev : DEFAULT_DEVICES));
      } else {
        setError(err.message || 'Failed to load devices');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const addDevice = async (devicePayload) => {
    try {
      // Real API: POST /api/devices
      const res = await api.post('/devices', devicePayload);
      const newDevice = res.data?.device || res.data || { ...devicePayload, _id: 'dev_' + Date.now() };
      setDevices((prev) => [newDevice, ...prev]);
      return { success: true, data: newDevice };
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real POST /api/devices once device router is mounted
        const fallback = {
          ...devicePayload,
          _id: 'dev_' + Date.now(),
          status: 'active',
          shiftedKwh: 0,
          coinsEarned: 0,
        };
        setDevices((prev) => [fallback, ...prev]);
        return { success: true, data: fallback };
      }
      throw err;
    }
  };

  const updateDevice = async (id, updatePayload) => {
    try {
      // Real API: PUT /api/devices/:id
      const res = await api.put(`/devices/${id}`, updatePayload);
      const updated = res.data?.device || res.data;
      setDevices((prev) => prev.map((d) => (d._id === id ? { ...d, ...updated } : d)));
      return { success: true, data: updated };
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real PUT /api/devices/:id once router is mounted
        setDevices((prev) => prev.map((d) => (d._id === id ? { ...d, ...updatePayload } : d)));
        return { success: true };
      }
      throw err;
    }
  };

  const deleteDevice = async (id) => {
    try {
      // Real API: DELETE /api/devices/:id
      await api.delete(`/devices/${id}`);
      setDevices((prev) => prev.filter((d) => d._id !== id));
      return { success: true };
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real DELETE /api/devices/:id once router is mounted
        setDevices((prev) => prev.filter((d) => d._id !== id));
        return { success: true };
      }
      throw err;
    }
  };

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  };
}

export { useDevices };
