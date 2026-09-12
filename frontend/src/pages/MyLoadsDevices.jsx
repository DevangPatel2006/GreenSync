import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useDevices from '../hooks/useDevices';

export default function MyLoadsDevices() {
  const location = useLocation();
  const { devices, loading, error, refetch, addDevice, updateDevice, deleteDevice } = useDevices();

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Exact contract fields: name, type, energyRequired, earliestStart, deadline, flexibility, priority
  const [formData, setFormData] = useState({
    name: '',
    type: 'ev_charging',
    energyRequired: '7.2',
    earliestStart: new Date(Date.now() + 300000).toISOString().slice(0, 16),
    deadline: new Date(Date.now() + 28800000).toISOString().slice(0, 16),
    flexibility: 'medium',
    priority: 'normal',
  });

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

  const handleToggle = async (device) => {
    const id = device._id || device.id;
    const newStatus = device.status === 'active' ? 'paused' : 'active';
    try {
      await updateDevice(id, { status: newStatus });
      showToastNotification('Load Updated', `${device.name} status updated to ${newStatus}.`);
    } catch (err) {
      showToastNotification('Error', 'Failed to update device status.');
    }
  };

  const handleDelete = async (device) => {
    const id = device._id || device.id;
    try {
      await deleteDevice(id);
      showToastNotification('Device Removed', `${device.name} disconnected from dispatch mesh.`);
    } catch (err) {
      showToastNotification('Error', 'Failed to remove device.');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Device name is required.';
    }
    const energyNum = parseFloat(formData.energyRequired);
    if (isNaN(energyNum) || energyNum <= 0) {
      errors.energyRequired = 'Energy required must be greater than 0 kWh.';
    }
    if (!formData.earliestStart) {
      errors.earliestStart = 'Earliest start timestamp is required.';
    }
    if (!formData.deadline) {
      errors.deadline = 'Deadline timestamp is required.';
    } else if (formData.earliestStart && new Date(formData.deadline) <= new Date(formData.earliestStart)) {
      errors.deadline = 'Deadline must be after the earliest start time.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        energyRequired: parseFloat(formData.energyRequired),
        earliestStart: new Date(formData.earliestStart).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        flexibility: formData.flexibility,
        priority: formData.priority,
        status: 'active',
      };

      await addDevice(payload);
      setDrawerOpen(false);
      showToastNotification('Device Configured', `${formData.name} added to auto-dispatch mesh.`);
      setFormData({
        name: '',
        type: 'ev_charging',
        energyRequired: '7.2',
        earliestStart: new Date(Date.now() + 300000).toISOString().slice(0, 16),
        deadline: new Date(Date.now() + 28800000).toISOString().slice(0, 16),
        flexibility: 'medium',
        priority: 'normal',
      });
      setFormErrors({});
    } catch (err) {
      showToastNotification('Configuration Failed', err.message || 'Could not save device.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ev_charging':
        return 'EV Charger';
      case 'water_heater':
        return 'Water Heater';
      case 'industrial':
      case 'hvac':
        return 'Heat Pump / HVAC';
      case 'washing_machine':
        return 'Washing Machine';
      case 'battery':
        return 'Battery Storage';
      default:
        return 'Smart Appliance';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ev_charging':
        return 'electric_car';
      case 'water_heater':
        return 'water_heater';
      case 'industrial':
      case 'hvac':
        return 'hvac';
      case 'washing_machine':
        return 'local_laundry_service';
      case 'battery':
        return 'battery_charging_full';
      default:
        return 'power';
    }
  };

  const filteredDevices = devices.filter((device) => {
    const matchCat = filterCategory === 'all' || device.type === filterCategory;
    const matchSearch =
      !searchQuery ||
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTypeLabel(device.type).toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCount = devices.filter((d) => d.status === 'active').length;
  const totalPower = devices.reduce((sum, d) => sum + (d.energyRequired || 0), 0).toFixed(1);

  return (
    <div className="flex flex-col w-full">
      {/* Top Title & Controls */}
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
          <button
            className="bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg flex items-center gap-space-xs shadow-sm transition-colors"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>+ Add Flexible Load</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md mb-space-lg">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Active Load Capacity</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">{totalPower} kW</span>
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">bolt</span> {activeCount} of {devices.length} devices online
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined">power</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">FlexCoins Earned</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">530 FC</span>
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +84 FC this cycle
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
            <span className="material-symbols-outlined">toll</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Automated Shifts</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">92.4%</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Zero manual override</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined">published_with_changes</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Grid Renewable Index</span>
            <span className="font-headline-md text-headline-md text-secondary mt-1">74%</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Solar + Wind baseline</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
            <span className="material-symbols-outlined">solar_power</span>
          </div>
        </div>
      </div>

      {/* FILTER PILLS & SEARCH BAR */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-xs">
          {[
            { id: 'all', label: `All devices (${devices.length})` },
            { id: 'ev_charging', label: 'EV Chargers' },
            { id: 'water_heater', label: 'Water Heaters' },
            { id: 'industrial', label: 'Heat Pumps' },
            { id: 'washing_machine', label: 'Appliances' },
          ].map((pill) => (
            <button
              key={pill.id}
              className={`px-space-md py-1.5 rounded-full text-label-md font-label-md transition-colors ${
                filterCategory === pill.id
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setFilterCategory(pill.id)}
              type="button"
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
            className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary-fixed-dim"
            placeholder="Search load by name, type..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-error mb-space-lg flex items-center justify-between">
          <div className="flex items-center gap-space-sm text-error">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <span className="font-body-md text-body-md">{error}</span>
          </div>
          <button
            onClick={refetch}
            className="px-space-md py-1.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95"
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE SKELETON */}
      {loading && (
        <div className="flex flex-col gap-space-md animate-pulse">
          <div className="h-28 bg-surface-container-high rounded-xl"></div>
          <div className="h-28 bg-surface-container-high rounded-xl"></div>
          <div className="h-28 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && devices.length === 0 && (
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
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>+ Add Flexible Load</span>
          </button>
        </div>
      )}

      {/* SUCCESS POPULATED DEVICE LIST */}
      {!loading && devices.length > 0 && (
        <div className="flex flex-col gap-space-md">
          {filteredDevices.length === 0 ? (
            <div className="p-space-lg bg-surface-container-lowest rounded-xl text-center text-on-surface-variant">
              No matching loads found for "{searchQuery}".
            </div>
          ) : (
            filteredDevices.map((device) => {
              const id = device._id || device.id;
              const isActive = device.status === 'active';
              return (
                <div
                  key={id}
                  className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                    <div className="flex items-start gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                        <span className="material-symbols-outlined text-[28px]">{getTypeIcon(device.type)}</span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="font-title-md text-title-md text-on-surface">{device.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                            {getTypeLabel(device.type)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container text-on-secondary-fixed font-title-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-ping"></span>
                            {isActive ? 'Dispatch Active' : 'Dispatch Paused'}
                          </span>
                        </div>

                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Required: {device.energyRequired} kWh • Flexibility: {device.flexibility} • Priority: {device.priority}
                        </p>

                        <div className="flex flex-wrap items-center gap-space-md mt-space-sm text-label-sm font-label-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
                            Rated: <strong>{device.energyRequired} kWh</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                            Ready by: {device.deadline ? new Date(device.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:30 AM'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-primary-container">
                            <span className="material-symbols-outlined text-[16px]">toll</span>
                            +{device.coinsEarned || 45} FC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md self-end lg:self-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isActive}
                          onChange={() => handleToggle(device)}
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                      </label>

                      <button
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
                        onClick={() => handleDelete(device)}
                        title="Delete Device"
                        type="button"
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

      {/* SLIDE-OVER DRAWER (ADD FLEXIBLE LOAD - EXACT CONTRACT FIELDS) */}
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
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col gap-space-md">
                {/* 1. Name */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">
                    Device Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tesla Model 3 Fleet"
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                  />
                  {formErrors.name && (
                    <span className="text-label-sm font-label-sm text-error block mt-1">{formErrors.name}</span>
                  )}
                </div>

                {/* 2. Type */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">
                    Device Type <span className="text-error">*</span>
                  </label>
                  <select
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="ev_charging">EV Charging (ev_charging)</option>
                    <option value="washing_machine">Washing Machine (washing_machine)</option>
                    <option value="water_heater">Water Heater (water_heater)</option>
                    <option value="battery">Battery Storage (battery)</option>
                    <option value="industrial">Industrial / HVAC (industrial)</option>
                    <option value="other">Other Controllable Load (other)</option>
                  </select>
                </div>

                {/* 3. Energy Required */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">
                    Energy Required (kWh) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 7.2"
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.energyRequired}
                    onChange={(e) => {
                      setFormData({ ...formData, energyRequired: e.target.value });
                      if (formErrors.energyRequired) setFormErrors({ ...formErrors, energyRequired: null });
                    }}
                  />
                  {formErrors.energyRequired && (
                    <span className="text-label-sm font-label-sm text-error block mt-1">{formErrors.energyRequired}</span>
                  )}
                </div>

                {/* 4. Earliest Start & 5. Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1">
                      Earliest Start <span className="text-error">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      value={formData.earliestStart}
                      onChange={(e) => {
                        setFormData({ ...formData, earliestStart: e.target.value });
                        if (formErrors.earliestStart) setFormErrors({ ...formErrors, earliestStart: null });
                      }}
                    />
                    {formErrors.earliestStart && (
                      <span className="text-label-sm font-label-sm text-error block mt-1">{formErrors.earliestStart}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1">
                      Deadline <span className="text-error">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      value={formData.deadline}
                      onChange={(e) => {
                        setFormData({ ...formData, deadline: e.target.value });
                        if (formErrors.deadline) setFormErrors({ ...formErrors, deadline: null });
                      }}
                    />
                    {formErrors.deadline && (
                      <span className="text-label-sm font-label-sm text-error block mt-1">{formErrors.deadline}</span>
                    )}
                  </div>
                </div>

                {/* 6. Flexibility (low | medium | high) */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">Flexibility</label>
                  <div className="grid grid-cols-3 gap-space-xs text-center">
                    {['low', 'medium', 'high'].map((flex) => (
                      <button
                        type="button"
                        key={flex}
                        onClick={() => setFormData({ ...formData, flexibility: flex })}
                        className={`py-2 px-1 rounded-lg text-label-sm font-label-sm border transition-colors capitalize ${
                          formData.flexibility === flex
                            ? 'bg-secondary-container text-on-secondary-fixed border-secondary-fixed-dim font-bold'
                            : 'border-surface-variant text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {flex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Priority (low | normal | high) */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">Priority</label>
                  <div className="grid grid-cols-3 gap-space-xs text-center">
                    {['low', 'normal', 'high'].map((prio) => (
                      <button
                        type="button"
                        key={prio}
                        onClick={() => setFormData({ ...formData, priority: prio })}
                        className={`py-2 px-1 rounded-lg text-label-sm font-label-sm border transition-colors capitalize ${
                          formData.priority === prio
                            ? 'bg-primary-container text-on-primary font-bold'
                            : 'border-surface-variant text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary-container/40 p-space-md rounded-xl flex items-start gap-space-sm mt-2">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">insights</span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm text-on-secondary-fixed">
                      Estimated Annual Carbon Offset
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Registering this flexible asset helps prevent approximately <strong>380 kg CO₂e</strong> grid emissions each year through curtailment avoidance.
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
                    disabled={submitting}
                    className="bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-space-xs"
                  >
                    {submitting ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    )}
                    <span>Save Flexible Load</span>
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
