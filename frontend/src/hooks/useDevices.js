import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorMapper';

export default function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/devices');
      const list = Array.isArray(res) ? res : (res?.devices || res?.data || []);
      setDevices(list);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const addDevice = async (deviceData) => {
    try {
      const res = await api.post('/devices', deviceData);
      const newDevice = res?.device || res?.data || res;
      setDevices((prev) => [newDevice, ...prev]);
      return newDevice;
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const updateDevice = async (id, updates) => {
    try {
      const res = await api.put(`/devices/${id}`, updates);
      const updated = res?.device || res?.data || updates;
      setDevices((prev) =>
        prev.map((d) => (d.id === id || d._id === id ? { ...d, ...updated } : d))
      );
      return updated;
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const deleteDevice = async (id) => {
    try {
      await api.delete(`/devices/${id}`);
      setDevices((prev) => prev.filter((d) => d.id !== id && d._id !== id));
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const toggleDevice = async (id) => {
    const target = devices.find((d) => d.id === id || d._id === id);
    if (!target) return;
    const newActive = !target.active;
    await updateDevice(id, { active: newActive });
  };

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    toggleDevice,
  };
}
