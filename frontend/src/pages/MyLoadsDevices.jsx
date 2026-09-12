import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useDevices from '../hooks/useDevices';
import api from '../services/api';

export default function MyLoadsDevices() {
  const location = useLocation();
  const { devices, loading, error, refetch, addDevice, deleteDevice, toggleDevice } = useDevices();

  const [viewState, setViewState] = useState('devices');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State adhering strictly to API contract:
  // name, type, energyRequired, earliestStart, deadline, flexibility, priority
  const [formData, setFormData] = useState({
    name: '',
    type: 'ev_charging',
    energyRequired: '24.0',
    earliestStart: '20:00',
    deadline: '06:30',
    flexibility: 'high',
    priority: 'normal',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flexCoinsBalance, setFlexCoinsBalance] = useState(0);
  const [gridRenewableIndex, setGridRenewableIndex] = useState(0);

  useEffect(() => {
    async function loadExtraStats() {
      try {
        const [rewRes, energyRes] = await Promise.allSettled([
          api.get('/rewards/balance'),
          api.get('/energy/current'),
        ]);
        if (rewRes.status === 'fulfilled') {
          const b = rewRes.value?.balance ?? rewRes.value?.data?.balance ?? (typeof rewRes.value === 'number' ? rewRes.value : 0);
          setFlexCoinsBalance(Number(b) || 0);
        }
        if (energyRes.status === 'fulfilled') {
          const ren = energyRes.value?.renewableAvailability ?? energyRes.value?.renewablePercentage ?? energyRes.value?.data?.renewableAvailability ?? 0;
          setGridRenewableIndex(Math.round(ren));
        }
      } catch (e) {
        // ignore
      }
    }
    loadExtraStats();
  }, []);

  useEffect(() => {
    if (location.search.includes('add=1')) {
      setDrawerOpen(true);
    }
  }, [location]);

  const showToastNotification = (title, message) => {
    setToast({ title, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Device name is required.';
    }
    const energy = parseFloat(formData.energyRequired);
    if (isNaN(energy) || energy <= 0) {
      errors.energyRequired = 'Energy required must be greater than 0 kWh.';
    }
    if (!formData.earliestStart) {
      errors.earliestStart = 'Earliest start time is required.';
    }
    if (!formData.deadline) {
      errors.deadline = 'Completion deadline is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Convert time strings (HH:mm) into upcoming timestamps
      const now = new Date();
      let startIso = formData.earliestStart;
      let deadlineIso = formData.deadline;

      if (startIso && /^\d{1,2}:\d{2}$/.test(startIso.trim())) {
        const [sh, sm] = startIso.split(':').map(Number);
        const s = new Date(now);
        s.setHours(sh, sm, 0, 0);
        startIso = s.toISOString();
      }

      if (deadlineIso && /^\d{1,2}:\d{2}$/.test(deadlineIso.trim())) {
        const [dh, dm] = deadlineIso.split(':').map(Number);
        const d = new Date(now);
        d.setHours(dh, dm, 0, 0);
        const startDateObj = new Date(startIso);
        if (d.getTime() <= startDateObj.getTime()) {
          d.setDate(d.getDate() + 1);
        }
        deadlineIso = d.toISOString();
      }

      await addDevice({
        name: formData.name.trim(),
        type: formData.type,
        energyRequired: parseFloat(formData.energyRequired),
        earliestStart: startIso,
        deadline: deadlineIso,
        flexibility: formData.flexibility,
        priority: formData.priority,
        power: `${(parseFloat(formData.energyRequired) / 4).toFixed(1)} kW`,
        shifted: '0.0 kWh shifted',
        coins: '+0 FC',
        desc: `Type: ${formData.type.replace('_', ' ')} • Deadline: ${formData.deadline} • Priority: ${formData.priority}`,
      });

      setDrawerOpen(false);
      showToastNotification('Device Configured', `${formData.name} added to auto-dispatch mesh.`);
      setFormData({
        name: '',
        type: 'ev_charging',
        energyRequired: '24.0',
        earliestStart: '20:00',
        deadline: '06:30',
        flexibility: 'high',
        priority: 'normal',
      });
      setFormErrors({});
    } catch {
      showToastNotification('Configuration Error', 'Could not save flexible device. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id, name) => {
    await toggleDevice(id);
    showToastNotification('Load Updated', `${name} flexibility state updated.`);
  };

  const handleDelete = async (id, name) => {
    await deleteDevice(id);
    showToastNotification('Device Removed', `${name} disconnected from dispatch mesh.`);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ev_charging':
        return 'EV Charger';
      case 'water_heater':
        return 'Water Heater';
      case 'washing_machine':
        return 'Washing Machine';
      case 'battery':
        return 'Battery / Heat Pump';
      case 'industrial':
        return 'Industrial Load';
      default:
        return 'Flexible Load';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ev_charging':
        return 'electric_car';
      case 'water_heater':
        return 'water_heater';
      case 'washing_machine':
        return 'local_laundry_service';
      case 'battery':
        return 'battery_charging_full';
      case 'industrial':
        return 'precision_manufacturing';
      default:
        return 'power';
    }
  };

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const matchCat =
      filterCategory === 'all' ||
      device.type === filterCategory ||
      (filterCategory === 'ev' && device.type === 'ev_charging') ||
      (filterCategory === 'water' && device.type === 'water_heater') ||
      (filterCategory === 'hvac' && (device.type === 'battery' || device.category === 'hvac')) ||
      (filterCategory === 'appliances' && (device.type === 'washing_machine' || device.category === 'appliances'));

    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      device.name.toLowerCase().includes(query) ||
      getTypeLabel(device.type).toLowerCase().includes(query);

    return matchCat && matchSearch;
  });

  const activeCount = devices.filter((d) => d.active).length;

  return (
    <div className="flex flex-col w-full">
      {/* Top Title & View State Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm text-secondary">
            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Telemetry &amp; Dispatch Control
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">
            Flexible Loads &amp; Connected Devices
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Manage automated grid-synced energy assets. Responsive dispatch schedules optimize for negative carbon hours,
            lower wholesale rates, and maximum FlexCoin yields.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start lg:self-auto">
          <div className="bg-surface-container-high p-1 rounded-lg flex items-center gap-1 shadow-sm">
            <button
              className={`px-space-sm py-1 rounded text-label-md font-label-md transition-colors ${
                viewState === 'devices'
                  ? 'bg-surface-container-lowest text-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setViewState('devices')}
            >
              All Devices ({devices.length})
            </button>
            <button
              className={`px-space-sm py-1 rounded text-label-md font-label-md transition-colors ${
                viewState === 'empty'
                  ? 'bg-surface-container-lowest text-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setViewState('empty')}
            >
              Empty State
            </button>
            <button
              className={`px-space-sm py-1 rounded text-label-md font-label-md transition-colors ${
                viewState === 'skeleton'
                  ? 'bg-surface-container-lowest text-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setViewState('skeleton')}
            >
              Loading Skeleton
            </button>
          </div>

          <button
            className="bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg flex items-center gap-space-xs shadow-sm transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>+ Add Flexible Load</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md mb-space-lg">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-variant">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Active Load Capacity</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">
              {devices.length === 0 ? '0.0' : (devices.reduce((acc, d) => acc + (parseFloat(d.energyRequired) || 0), 0) / 3).toFixed(1)} kW
            </span>
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">bolt</span> {activeCount} of {devices.length} devices online
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined">power</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-variant">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">FlexCoins Earned</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">{flexCoinsBalance} FC</span>
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {flexCoinsBalance > 0 ? `+${flexCoinsBalance} FC balance` : '0 FC this cycle'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
            <span className="material-symbols-outlined">toll</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-variant">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Automated Shifts</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">
              {devices.length > 0 ? `${Math.round((activeCount / devices.length) * 100)}%` : '0%'}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              {devices.length > 0 ? 'Active dispatch automation' : 'No active loads'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined">published_with_changes</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-variant">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Grid Renewable Index</span>
            <span className="font-headline-md text-headline-md text-secondary mt-1">{gridRenewableIndex}%</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Real-time solar + wind</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
            <span className="material-symbols-outlined">solar_power</span>
          </div>
        </div>
      </div>

      {/* FILTER PILLS & SEARCH BAR */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md border border-surface-variant">
        <div className="flex flex-wrap items-center gap-space-xs">
          {[
            { id: 'all', label: `All devices (${devices.length})` },
            { id: 'ev', label: 'EV Chargers' },
            { id: 'water', label: 'Water Heaters' },
            { id: 'hvac', label: 'Heat Pumps' },
            { id: 'appliances', label: 'Appliances' },
          ].map((pill) => (
            <button
              key={pill.id}
              className={`px-space-md py-1.5 rounded-full text-label-md font-label-md transition-colors ${
                filterCategory === pill.id
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setFilterCategory(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary-fixed-dim border border-surface-variant"
            placeholder="Search load by name, type..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-space-lg bg-error-container text-on-error-container rounded-xl flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-error">error</span>
            <span className="font-body-md text-body-md">{error}</span>
          </div>
          <button
            onClick={refetch}
            className="px-space-md py-1.5 rounded bg-surface-container-lowest text-on-surface font-title-sm text-title-sm hover:bg-surface-container transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {(loading || viewState === 'skeleton') && (
        <div className="flex flex-col gap-space-md animate-pulse">
          <div className="h-32 bg-surface-container-high rounded-xl"></div>
          <div className="h-32 bg-surface-container-high rounded-xl"></div>
          <div className="h-32 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && (viewState === 'empty' || devices.length === 0) && (
        <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center border border-surface-variant flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">devices_other</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No devices yet — add your first flexible load
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            Connect smart breakers, heat pumps, or electric vehicle chargers to start shifting loads to cleaner hours.
          </p>
          <button
            className="bg-primary-container text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg flex items-center gap-space-xs"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>+ Add First Device</span>
          </button>
        </div>
      )}

      {/* POPULATED DEVICE LIST */}
      {!loading && viewState === 'devices' && devices.length > 0 && (
        <div className="flex flex-col gap-space-md">
          {filteredDevices.length === 0 ? (
            <div className="p-space-lg bg-surface-container-lowest rounded-xl text-center text-on-surface-variant border border-surface-variant">
              No matching loads found for "{searchQuery}".
            </div>
          ) : (
            filteredDevices.map((device) => {
              const devId = device.id || device._id;
              const typeIcon = getTypeIcon(device.type);
              const typeLabel = getTypeLabel(device.type);
              return (
                <div
                  key={devId}
                  className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow border border-surface-variant"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                    <div className="flex items-start gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                        <span className="material-symbols-outlined text-[28px]">{typeIcon}</span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="font-title-md text-title-md text-on-surface">{device.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                            {typeLabel}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container text-on-secondary-fixed font-title-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-ping"></span>
                            {device.status || (device.active ? 'Active Auto-Sync' : 'Idle')}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          {device.desc || `Energy: ${device.energyRequired} kWh • Window: ${device.earliestStart || 'N/A'} - ${device.deadline || 'N/A'} • Priority: ${device.priority}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-space-md mt-space-sm text-label-sm font-label-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
                            Req: <strong>{device.energyRequired} kWh</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                            Deadline: <strong>{device.deadline || 'Flexible'}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-primary-container">
                            <span className="material-symbols-outlined text-[16px]">toll</span>
                            Flex: <strong className="uppercase">{device.flexibility || 'HIGH'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md self-end lg:self-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={device.active}
                          onChange={() => handleToggle(devId, device.name)}
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                      </label>

                      <button
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
                        onClick={() => handleDelete(devId, device.name)}
                        title="Delete Device"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SLIDE-OVER DRAWER (ADD FLEXIBLE LOAD - CONTRACT COMPLIANT) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl p-space-lg flex flex-col justify-between overflow-y-auto z-10 border-l border-surface-variant">
            <div>
              <div className="flex items-center justify-between pb-space-md border-b border-surface-variant mb-space-lg">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[24px]">power</span>
                  <h2 className="font-headline-sm text-headline-sm text-primary-container">Add Flexible Load</h2>
                </div>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form id="addDeviceForm" onSubmit={handleFormSubmit} className="flex flex-col gap-space-md">
                {/* Field 1: name */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1" htmlFor="load-name">
                    Device Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="load-name"
                    type="text"
                    required
                    placeholder="e.g. Commercial Fleet Charger #4"
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && (
                    <span className="text-label-sm font-label-sm text-error mt-1 block">{formErrors.name}</span>
                  )}
                </div>

                {/* Field 2: type (ev_charging | washing_machine | water_heater | battery | industrial | other) */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1" htmlFor="load-type">
                    Appliance Type <span className="text-error">*</span>
                  </label>
                  <select
                    id="load-type"
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="ev_charging">EV Charging (ev_charging)</option>
                    <option value="washing_machine">Washing Machine / Dryer (washing_machine)</option>
                    <option value="water_heater">Smart Water Heater (water_heater)</option>
                    <option value="battery">Battery Storage / Heat Pump (battery)</option>
                    <option value="industrial">Industrial Machinery (industrial)</option>
                    <option value="other">Other Controllable Asset (other)</option>
                  </select>
                </div>

                {/* Field 3: energyRequired (kWh) */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1" htmlFor="load-energy">
                    Energy Required (kWh) <span className="text-error">*</span>
                  </label>
                  <input
                    id="load-energy"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.energyRequired}
                    onChange={(e) => setFormData({ ...formData, energyRequired: e.target.value })}
                  />
                  {formErrors.energyRequired && (
                    <span className="text-label-sm font-label-sm text-error mt-1 block">{formErrors.energyRequired}</span>
                  )}
                </div>

                {/* Fields 4 & 5: earliestStart and deadline */}
                <div className="grid grid-cols-2 gap-space-md">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1" htmlFor="load-start">
                      Earliest Start <span className="text-error">*</span>
                    </label>
                    <input
                      id="load-start"
                      type="time"
                      required
                      className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      value={formData.earliestStart}
                      onChange={(e) => setFormData({ ...formData, earliestStart: e.target.value })}
                    />
                    {formErrors.earliestStart && (
                      <span className="text-label-sm font-label-sm text-error mt-1 block">{formErrors.earliestStart}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1" htmlFor="load-deadline">
                      Completion Deadline <span className="text-error">*</span>
                    </label>
                    <input
                      id="load-deadline"
                      type="time"
                      required
                      className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                    {formErrors.deadline && (
                      <span className="text-label-sm font-label-sm text-error mt-1 block">{formErrors.deadline}</span>
                    )}
                  </div>
                </div>

                {/* Field 6: flexibility (low | medium | high) */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">
                    Flexibility Window <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-space-xs text-center">
                    {[
                      { id: 'low', label: 'Low (±1h)' },
                      { id: 'medium', label: 'Medium (±3h)' },
                      { id: 'high', label: 'High (±6h)' },
                    ].map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setFormData({ ...formData, flexibility: f.id })}
                        className={`py-2 px-1 rounded-lg text-label-sm font-label-sm border transition-colors ${
                          formData.flexibility === f.id
                            ? 'bg-secondary-container text-on-secondary-fixed border-secondary-fixed-dim font-bold'
                            : 'border-surface-variant text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 7: priority (low | normal | high) */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">
                    Priority Level <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-space-xs text-center">
                    {[
                      { id: 'low', label: 'Low' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'high', label: 'High' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                        className={`py-2 px-1 rounded-lg text-label-sm font-label-sm border transition-colors ${
                          formData.priority === p.id
                            ? 'bg-primary-container text-on-primary font-bold'
                            : 'border-surface-variant text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary-container/40 p-space-md rounded-xl flex items-start gap-space-sm mt-2">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">insights</span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm text-on-secondary-fixed">
                      Certified Demand Response
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Registering this load ensures dispatch algorithms automatically avoid regional peaker events.
                    </span>
                  </div>
                </div>

                <div className="pt-space-md flex items-center justify-end gap-space-sm mt-4">
                  <button
                    type="button"
                    className="px-space-lg py-2.5 rounded-lg font-title-sm text-title-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-space-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{isSubmitting ? 'Saving...' : 'Save Flexible Load'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-lowest p-space-md rounded-xl shadow-xl flex items-center gap-space-sm border border-surface-variant">
          <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">check</span>
          </div>
          <div className="flex flex-col pr-4">
            <span className="font-title-sm text-title-sm text-on-surface">{toast.title}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
