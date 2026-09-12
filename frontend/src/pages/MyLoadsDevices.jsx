import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function MyLoadsDevices() {
  const location = useLocation();
  const [viewState, setViewState] = useState('devices');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [deviceList, setDeviceList] = useState([
    {
      id: 1,
      name: 'Tesla Model 3',
      category: 'ev',
      categoryLabel: 'EV Charger',
      status: 'Scheduled for 11:30 PM',
      statusType: 'scheduled',
      desc: 'Level 2 Wall Connector (32A split phase) • Target: 90% SOC by 06:30 AM',
      power: '9.6 kW',
      shifted: '42.5 kWh shifted',
      coins: '+120 FC',
      active: true,
      icon: 'electric_car',
    },
    {
      id: 2,
      name: 'Rheem ProTerra Hybrid',
      category: 'water',
      categoryLabel: 'Water Heater',
      status: 'Scheduled for 01:00 PM',
      statusType: 'scheduled',
      desc: '65-gal hybrid heat pump • Pre-heating water during solar surplus',
      power: '3.8 kW',
      shifted: '18.2 kWh shifted',
      coins: '+65 FC',
      active: true,
      icon: 'water_heater',
    },
    {
      id: 3,
      name: 'Daikin VRV Heat Pump',
      category: 'hvac',
      categoryLabel: 'Heat Pump',
      status: 'Active Eco-Modulation',
      statusType: 'live',
      desc: 'Zone 1 & 2 multi-split • Pre-cooling prior to 4 PM evening peak ramp',
      power: '5.4 kW',
      shifted: '88.0 kWh shifted',
      coins: '+210 FC',
      active: true,
      icon: 'hvac',
    },
    {
      id: 4,
      name: 'Bosch 800 Series Dishwasher',
      category: 'appliances',
      categoryLabel: 'Appliance',
      status: 'Shift Pending (02:30 AM)',
      statusType: 'pending',
      desc: 'Delay wash cycle • Automatically runs during high overnight wind window',
      power: '1.4 kW',
      shifted: '6.4 kWh shifted',
      coins: '+25 FC',
      active: false,
      icon: 'local_laundry_service',
    },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'ev',
    power: '7.2',
    buffer: '4.0',
    priority: 'balanced',
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

  const handleToggle = (id) => {
    setDeviceList((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = !d.active;
          showToastNotification('Load Updated', `${d.name} flexibility mode ${updated ? 'enabled' : 'disabled'}.`);
          return { ...d, active: updated };
        }
        return d;
      })
    );
  };

  const handleDelete = (id, name) => {
    setDeviceList((prev) => prev.filter((d) => d.id !== id));
    showToastNotification('Device Removed', `${name} disconnected from dispatch mesh.`);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const newDevice = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      categoryLabel:
        formData.category === 'ev'
          ? 'EV Charger'
          : formData.category === 'water'
          ? 'Water Heater'
          : formData.category === 'hvac'
          ? 'Heat Pump'
          : 'Appliance',
      status: 'Auto-Sync Active',
      statusType: 'scheduled',
      desc: `Capacity: ${formData.power} kW • Buffer: ±${formData.buffer}h • Priority: ${formData.priority}`,
      power: `${formData.power} kW`,
      shifted: '0.0 kWh shifted',
      coins: '+0 FC',
      active: true,
      icon:
        formData.category === 'ev'
          ? 'electric_car'
          : formData.category === 'water'
          ? 'water_heater'
          : formData.category === 'hvac'
          ? 'hvac'
          : 'devices_other',
    };

    setDeviceList([newDevice, ...deviceList]);
    setDrawerOpen(false);
    showToastNotification('Device Configured', `${formData.name} added to auto-dispatch mesh.`);
    setFormData({ name: '', category: 'ev', power: '7.2', buffer: '4.0', priority: 'balanced' });
  };

  const filteredDevices = deviceList.filter((device) => {
    const matchCat = filterCategory === 'all' || device.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
              All Devices ({deviceList.length})
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
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Active Load Capacity</span>
            <span className="font-headline-md text-headline-md text-on-surface mt-1">21.0 kW</span>
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">bolt</span> {deviceList.filter((d) => d.active).length} of {deviceList.length} devices online
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
            { id: 'all', label: `All devices (${deviceList.length})` },
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
            className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary-fixed-dim"
            placeholder="Search load by name, type..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* SKELETON STATE */}
      {viewState === 'skeleton' && (
        <div className="flex flex-col gap-space-md animate-pulse">
          <div className="h-32 bg-surface-container-high rounded-xl"></div>
          <div className="h-32 bg-surface-container-high rounded-xl"></div>
          <div className="h-32 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* EMPTY STATE */}
      {viewState === 'empty' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center border border-surface-variant flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">devices_other</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">No Loads Discovered</h3>
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

      {/* DEVICE LIST */}
      {viewState === 'devices' && (
        <div className="flex flex-col gap-space-md">
          {filteredDevices.length === 0 ? (
            <div className="p-space-lg bg-surface-container-lowest rounded-xl text-center text-on-surface-variant">
              No matching loads found for "{searchQuery}".
            </div>
          ) : (
            filteredDevices.map((device) => (
              <div
                key={device.id}
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                      <span className="material-symbols-outlined text-[28px]">{device.icon}</span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <span className="font-title-md text-title-md text-on-surface">{device.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                          {device.categoryLabel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container text-on-secondary-fixed font-title-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-ping"></span>
                          {device.status}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{device.desc}</p>
                      <div className="flex flex-wrap items-center gap-space-md mt-space-sm text-label-sm font-label-sm text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
                          Rated: <strong>{device.power}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">sync_alt</span>
                          {device.shifted}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-primary-container">
                          <span className="material-symbols-outlined text-[16px]">toll</span>
                          {device.coins}
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
                        onChange={() => handleToggle(device.id)}
                      />
                      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                    </label>

                    <button
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
                      onClick={() => handleDelete(device.id, device.name)}
                      title="Delete Device"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SLIDE-OVER DRAWER (ADD FLEXIBLE LOAD) */}
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
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">Device / Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ford F-150 Lightning Charger"
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">Asset Category</label>
                  <select
                    className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="ev">Electric Vehicle Charger (Level 2/DC)</option>
                    <option value="hvac">HVAC / Heat Pump (Inverter Driven)</option>
                    <option value="water">Smart Water Heater / Thermal Storage</option>
                    <option value="appliances">Heavy Appliance (Dishwasher / Dryer)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-space-md">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1">Rated Power (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      value={formData.power}
                      onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1">Flex Window (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="w-full h-10 px-space-sm rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      value={formData.buffer}
                      onChange={(e) => setFormData({ ...formData, buffer: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1">Optimization Priority</label>
                  <div className="grid grid-cols-3 gap-space-xs text-center">
                    {[
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'carbon', label: 'Lowest Carbon' },
                      { id: 'coins', label: 'Max FlexCoins' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                        className={`py-2 px-1 rounded-lg text-label-sm font-label-sm border transition-colors ${
                          formData.priority === p.id
                            ? 'bg-secondary-container text-on-secondary-fixed border-secondary-fixed-dim font-bold'
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
                    className="bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-space-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
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
