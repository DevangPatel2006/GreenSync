import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorMapper';

const INITIAL_MOCK_DEVICES = [
  {
    id: 'dev_1',
    name: 'Tesla Model 3',
    type: 'ev_charging',
    energyRequired: 38.5,
    earliestStart: '20:00',
    deadline: '06:30',
    flexibility: 'high',
    priority: 'normal',
    status: 'scheduled',
    active: true,
    power: '9.6 kW',
    shifted: '42.5 kWh shifted',
    coins: '+120 FC',
    desc: 'Level 2 Wall Connector (32A split phase) • Target: 90% SOC by 06:30 AM',
  },
  {
    id: 'dev_2',
    name: 'Rheem ProTerra Hybrid',
    type: 'water_heater',
    energyRequired: 14.2,
    earliestStart: '12:00',
    deadline: '17:00',
    flexibility: 'medium',
    priority: 'high',
    status: 'scheduled',
    active: true,
    power: '3.8 kW',
    shifted: '18.2 kWh shifted',
    coins: '+65 FC',
    desc: '65-gal hybrid heat pump • Pre-heating water during solar surplus',
  },
  {
    id: 'dev_3',
    name: 'Daikin VRV Heat Pump',
    type: 'battery',
    energyRequired: 22.0,
    earliestStart: '13:00',
    deadline: '18:00',
    flexibility: 'medium',
    priority: 'normal',
    status: 'running',
    active: true,
    power: '5.4 kW',
    shifted: '88.0 kWh shifted',
    coins: '+210 FC',
    desc: 'Zone 1 & 2 multi-split • Pre-cooling prior to 4 PM evening peak ramp',
  },
  {
    id: 'dev_4',
    name: 'Bosch 800 Series Dishwasher',
    type: 'washing_machine',
    energyRequired: 3.2,
    earliestStart: '22:00',
    deadline: '07:00',
    flexibility: 'high',
    priority: 'low',
    status: 'idle',
    active: false,
    power: '1.4 kW',
    shifted: '6.4 kWh shifted',
    coins: '+25 FC',
    desc: 'Delay wash cycle • Automatically runs during high overnight wind window',
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
      const res = await api.get('/devices');
      const data = res.data || res.devices || res;
      if (Array.isArray(data) && data.length > 0) {
        setDevices(data);
      } else {
        // Use cached or default mock devices
        const cached = localStorage.getItem('greensync_devices');
        setDevices(cached ? JSON.parse(cached) : INITIAL_MOCK_DEVICES);
      }
    } catch (err) {
      // TODO(backend): Endpoint /api/devices not yet mounted on backend. Fallback to contract mock.
      console.warn('Backend /api/devices not reachable, using local storage.');
      const cached = localStorage.getItem('greensync_devices');
      setDevices(cached ? JSON.parse(cached) : INITIAL_MOCK_DEVICES);
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
      const newDevice = res.data?.device || res.data || {
        ...deviceData,
        id: 'dev_' + Date.now(),
        status: 'scheduled',
        active: true,
      };
      setDevices((prev) => {
        const updated = [newDevice, ...prev];
        localStorage.setItem('greensync_devices', JSON.stringify(updated));
        return updated;
      });
      return newDevice;
    } catch (err) {
      // TODO(backend): Endpoint /api/devices not available yet.
      console.warn('Backend /api/devices POST not reachable, updating local state.');
      const newDevice = {
        ...deviceData,
        id: 'dev_' + Date.now(),
        status: 'scheduled',
        active: true,
      };
      setDevices((prev) => {
        const updated = [newDevice, ...prev];
        localStorage.setItem('greensync_devices', JSON.stringify(updated));
        return updated;
      });
      return newDevice;
    }
  };

  const updateDevice = async (id, updates) => {
    try {
      await api.put(`/devices/${id}`, updates);
    } catch {
      // Fallback local update
    }
    setDevices((prev) => {
      const updated = prev.map((d) => (d.id === id || d._id === id ? { ...d, ...updates } : d));
      localStorage.setItem('greensync_devices', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteDevice = async (id) => {
    try {
      await api.delete(`/devices/${id}`);
    } catch {
      // Fallback local delete
    }
    setDevices((prev) => {
      const updated = prev.filter((d) => d.id !== id && d._id !== id);
      localStorage.setItem('greensync_devices', JSON.stringify(updated));
      return updated;
    });
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
