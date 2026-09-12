import React, { useState } from 'react';

export default function Dashboard() {
  const [dashboardState, setDashboardState] = useState('populated');
  const [isAccepted, setIsAccepted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [devices, setDevices] = useState([
    { id: 'ev', name: 'EV Charger #1', desc: 'Level 2 • 9.6 kW cap', time: 'Scheduled: 1:00 AM', tag: 'Auto-Sync', active: true, icon: 'ev_station' },
    { id: 'hvac', name: 'Heat Pump System', desc: 'Zone 1 & 2 • 4.2 kW', time: 'Eco-mode Active', tag: 'Pre-cooling', active: true, icon: 'hvac' },
    { id: 'washer', name: 'Laundry Washer', desc: 'Cycle Delay • 1.8 kW', time: 'Schedule Pending', tag: 'Approve Shift', active: false, icon: 'local_laundry_service' },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAcceptSchedule = () => {
    setIsAccepted(true);
    showToast('Schedule applied! 14.2 kWh moved to 1:00 PM (+45 FC)');
  };

  const handleToggleDevice = (id) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = !d.active;
          showToast(`${d.name} flexibility mode ${updated ? 'activated' : 'paused'}`);
          return { ...d, active: updated };
        }
        return d;
      })
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* State Switcher Header Utility */}
      <div className="flex flex-wrap items-center justify-between pb-space-lg border-b border-surface-variant gap-space-sm mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>Platform Telemetry</span>
            <span>•</span>
            <span className="text-secondary font-title-sm">Operational View</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container mt-0.5 tracking-tight">
            Demand Flexibility Dispatch
          </h1>
        </div>

        {/* State Simulator Toggle Bar */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg border border-surface-variant">
          <span className="font-label-sm text-label-sm text-on-surface-variant px-2 hidden sm:inline">Preview State:</span>
          <button
            className={`px-3 py-1 text-label-md font-label-md rounded transition-all ${
              dashboardState === 'populated'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-surface-variant font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setDashboardState('populated')}
            type="button"
          >
            Populated
          </button>
          <button
            className={`px-3 py-1 text-label-md font-label-md rounded transition-all ${
              dashboardState === 'loading'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-surface-variant font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setDashboardState('loading')}
            type="button"
          >
            Loading state
          </button>
          <button
            className={`px-3 py-1 text-label-md font-label-md rounded transition-all ${
              dashboardState === 'empty'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-surface-variant font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setDashboardState('empty')}
            type="button"
          >
            Empty state
          </button>
        </div>
      </div>

      {/* 1. TOP BANNER / GRID CONDITION */}
      <div
        className={`w-full bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md mb-space-lg transition-all ${
          dashboardState === 'loading' ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0 border border-secondary-fixed-dim">
              <span className="material-symbols-outlined text-secondary text-[26px]">energy_savings_leaf</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-[#F1F6E3] text-[#2F3D13] border border-secondary-fixed-dim">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Optimal for flexible use
                </span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">• Regional Grid Node #4</span>
              </div>
              <div className="font-title-md text-title-md text-on-surface">Cleaner energy available now (74% Wind + Solar)</div>
            </div>
          </div>
          <div className="flex items-center gap-space-md w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-surface-variant pt-space-xs lg:pt-0">
            <div className="text-left lg:text-right">
              <div className="text-label-sm font-label-sm text-on-surface-variant uppercase">Current Hourly Recommendation</div>
              <div className="text-body-md font-title-sm text-primary-container">Shift high-power cycles to 1:00 PM – 3:30 PM</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY WRAPPER */}
      {dashboardState === 'loading' && (
        <div className="flex flex-col gap-space-lg animate-pulse w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="h-28 bg-surface-container-high rounded-xl"></div>
            <div className="h-28 bg-surface-container-high rounded-xl"></div>
            <div className="h-28 bg-surface-container-high rounded-xl"></div>
            <div className="h-28 bg-surface-container-high rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <div className="lg:col-span-8 h-96 bg-surface-container-high rounded-xl"></div>
            <div className="lg:col-span-4 h-96 bg-surface-container-high rounded-xl"></div>
          </div>
        </div>
      )}

      {/* EMPTY STATE WRAPPER */}
      {dashboardState === 'empty' && (
        <div className="flex flex-col items-center justify-center p-space-xl bg-surface-container-lowest rounded-xl border border-surface-variant text-center w-full my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">electric_bolt</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No Active Loads or Dispatches Scheduled
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            Connect smart breakers, heat pumps, or electric vehicle chargers to start shifting loads to cleaner, lower-cost hours.
          </p>
          <button
            className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity inline-flex items-center gap-space-xs"
            onClick={() => setDashboardState('populated')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Connect First Device
          </button>
        </div>
      )}

      {/* POPULATED DASHBOARD VIEW */}
      {dashboardState === 'populated' && (
        <div className="flex flex-col gap-space-lg w-full">
          {/* 2. STAT CARDS GRID (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Card 1: FlexCoins */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">FlexCoins Balance</span>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                  Impact Simulation
                </span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">1,420</span>
                <span className="font-title-md text-title-md text-primary font-bold">FC</span>
              </div>
              <div className="mt-space-xs flex items-center gap-1 text-on-secondary-container font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>+60 this week</span>
              </div>
            </div>

            {/* Card 2: CO2 Avoided */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">CO₂ Avoided</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">forest</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">184</span>
                <span className="font-title-md text-title-md text-on-surface-variant">kg</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
                Equivalent to <span className="font-semibold text-on-surface">9 planted trees</span>
              </div>
            </div>

            {/* Card 3: Energy Shifted */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Energy Shifted</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">sync_alt</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">420</span>
                <span className="font-title-md text-title-md text-on-surface-variant">kWh</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
                Across <span className="font-semibold text-on-surface">18 flexible runs</span>
              </div>
            </div>

            {/* Card 4: Peak Reduction */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Peak Reduction</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">offline_bolt</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">3.8</span>
                <span className="font-title-md text-title-md text-on-surface-variant">kW</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
                Max offset during <span className="font-semibold text-on-surface">6pm–8pm peaks</span>
              </div>
            </div>
          </div>

          {/* 3. MAIN CONTENT SPLIT (2 Columns: Left 8-col, Right 4-col) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* LEFT COLUMN: Timeline & Hourly Chart */}
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* Today's Recommended Schedule Banner Card */}
              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
                <div className="flex flex-wrap items-start justify-between gap-space-sm pb-space-md border-b border-surface-variant">
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
                      Load Shifting Automation
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-primary-container">
                      Today's Recommended Schedule
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Find a better time to use electricity and maximize clean grid consumption.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-label-sm font-label-sm text-on-surface-variant block">Energy Shifted Estimate</span>
                    <span className="font-headline-sm text-headline-sm text-primary-container">14.2 kWh</span>
                  </div>
                </div>

                {/* Time Comparison Visual Bar */}
                <div className="py-space-md">
                  <div className="flex items-center justify-between text-body-sm font-label-md text-on-surface-variant mb-space-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-surface-variant inline-block"></span>
                      Requested Time (6:30 PM Peak)
                    </span>
                    <span className="flex items-center gap-1.5 text-primary-container font-semibold">
                      <span className="w-3 h-3 rounded-sm bg-secondary inline-block"></span>
                      Recommended Time (1:00 PM Sun Window)
                    </span>
                  </div>

                  {/* Timeline Diagram Representation */}
                  <div className="w-full bg-surface-container rounded p-3 border border-surface-variant">
                    <div className="relative w-full h-8 bg-surface rounded flex items-center px-2 overflow-hidden border border-surface-variant">
                      {/* 24-hr tick markers */}
                      <div className="absolute inset-0 flex justify-between px-2 text-[10px] text-outline opacity-40 select-none items-center">
                        <span>8a</span>
                        <span>10a</span>
                        <span>12p</span>
                        <span>2p</span>
                        <span>4p</span>
                        <span>6p</span>
                        <span>8p</span>
                        <span>10p</span>
                      </div>
                      {/* Requested Slot */}
                      <div
                        className="absolute left-[66%] w-[12%] h-5 bg-outline-variant rounded flex items-center justify-center text-[11px] font-bold text-on-surface opacity-80"
                        title="Requested 6:30 PM"
                      >
                        Peak
                      </div>
                      {/* Recommended Slot */}
                      <div
                        className="absolute left-[36%] w-[16%] h-6 bg-secondary-fixed-dim rounded border border-secondary flex items-center justify-center text-[11px] font-bold text-on-secondary-fixed"
                        title="Shifted to 1:00 PM"
                      >
                        Optimal Run
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-label-sm font-label-sm text-on-surface-variant">
                      <span>Morning Baseload</span>
                      <span className="text-secondary font-semibold">Shift: -5.5 hours to Peak Renewable</span>
                      <span>Night Baseload</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Acceptance CTA Row */}
                <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-md border-t border-surface-variant">
                  <div className="flex items-center gap-space-sm text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                    <span className="font-body-md text-body-md">Saves 4.2 kg CO₂ &amp; optimizes device cycle efficiency</span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <button
                      className="px-4 py-2 rounded border border-surface-variant font-title-sm text-title-sm text-on-surface hover:border-primary-container hover:text-primary-container transition-colors"
                      type="button"
                    >
                      Modify Time
                    </button>
                    <button
                      className={`px-5 py-2 rounded font-title-sm text-title-sm transition-all flex items-center gap-space-xs ${
                        isAccepted
                          ? 'bg-secondary-fixed-dim text-on-secondary-fixed border border-secondary'
                          : 'bg-primary-container text-on-primary hover:opacity-95'
                      }`}
                      onClick={handleAcceptSchedule}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isAccepted ? 'done_all' : 'check_circle'}
                      </span>
                      <span>{isAccepted ? 'Schedule Active' : 'Accept Schedule (+45 FlexCoins)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hourly Renewable Energy Chart */}
              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
                <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary-container">Cleaner Energy Available by Hour</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">12:00 PM – 4:00 PM peak renewable window</p>
                  </div>
                  <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-secondary-fixed-dim"></span>
                      <span className="text-on-surface">Renewable Supply (%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                      <span className="text-on-surface">Demand Baseline</span>
                    </div>
                  </div>
                </div>

                {/* High Precision SVG Bar + Marker Chart */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[540px] pt-4">
                    <svg className="w-full h-48 overflow-visible" fill="none" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg">
                      {/* Horizontal Grid Lines */}
                      <line stroke="#E8E0EB" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="590" y1="20" y2="20" />
                      <line stroke="#E8E0EB" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="590" y1="60" y2="60" />
                      <line stroke="#E8E0EB" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="590" y1="100" y2="100" />
                      <line stroke="#E8E0EB" strokeWidth="1" x1="40" x2="590" y1="140" y2="140" />

                      {/* Y-Axis Labels */}
                      <text fill="#81737C" fontFamily="Inter" fontSize="10" textAnchor="end" x="30" y="24">80%</text>
                      <text fill="#81737C" fontFamily="Inter" fontSize="10" textAnchor="end" x="30" y="64">50%</text>
                      <text fill="#81737C" fontFamily="Inter" fontSize="10" textAnchor="end" x="30" y="104">20%</text>

                      {/* 08:00 AM (35%) */}
                      <rect fill="#d4ed8d" height="45" rx="2" width="28" x="50" y="95" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="58" y="80" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="64" y="154">8a</text>

                      {/* 10:00 AM (52%) */}
                      <rect fill="#d4ed8d" height="66" rx="2" width="28" x="105" y="74" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="113" y="70" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="119" y="154">10a</text>

                      {/* 12:00 PM (78%) */}
                      <rect fill="#b8d074" height="102" rx="2" width="28" x="160" y="38" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="168" y="65" />
                      <text fill="#1E1A22" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="174" y="154">12p</text>

                      {/* 01:00 PM (84% - Selected Run Target) */}
                      <rect fill="#526615" height="112" rx="2" width="28" x="215" y="28" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="223" y="58" />
                      <circle cx="229" cy="18" fill="#526615" r="4" />
                      <text fill="#1E1A22" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="229" y="154">1p</text>

                      {/* 02:00 PM (80%) */}
                      <rect fill="#b8d074" height="105" rx="2" width="28" x="270" y="35" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="278" y="60" />
                      <text fill="#1E1A22" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="284" y="154">2p</text>

                      {/* 03:00 PM (70%) */}
                      <rect fill="#b8d074" height="90" rx="2" width="28" x="325" y="50" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="333" y="55" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="339" y="154">3p</text>

                      {/* 04:00 PM (58%) */}
                      <rect fill="#d4ed8d" height="72" rx="2" width="28" x="380" y="68" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="388" y="48" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="394" y="154">4p</text>

                      {/* 06:00 PM (28%) */}
                      <rect fill="#e8e0eb" height="35" rx="2" width="28" x="435" y="105" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="443" y="32" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="449" y="154">6p</text>

                      {/* 08:00 PM (30%) */}
                      <rect fill="#e8e0eb" height="38" rx="2" width="28" x="490" y="102" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="498" y="38" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="504" y="154">8p</text>

                      {/* 10:00 PM (42%) */}
                      <rect fill="#d4ed8d" height="54" rx="2" width="28" x="545" y="86" />
                      <rect fill="#450C3F" height="3" rx="1.5" width="12" x="553" y="70" />
                      <text fill="#50434B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="559" y="154">10p</text>
                    </svg>
                  </div>
                </div>

                <div className="mt-space-sm p-space-sm bg-surface-container rounded border border-surface-variant flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">
                    Recommended charging window active: <strong>1:00 PM – 3:30 PM</strong>
                  </span>
                  <span className="text-secondary font-title-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span> 74% Grid Clean Factor
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Active Flexible Loads Widget */}
            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
                <div className="flex items-center justify-between pb-space-md border-b border-surface-variant mb-space-md">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary-container">Active Flexible Loads</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{devices.length} connected controllable devices</p>
                  </div>
                  <button className="text-on-surface-variant hover:text-primary-container transition-colors" type="button">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </button>
                </div>

                {/* Device List */}
                <div className="flex flex-col gap-space-md">
                  {devices.map((device) => (
                    <div key={device.id} className="p-space-md bg-surface rounded-lg border border-surface-variant flex flex-col gap-space-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-space-xs">
                          <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-primary-container">
                            <span className="material-symbols-outlined text-[20px]">{device.icon}</span>
                          </div>
                          <div>
                            <div className="font-title-sm text-title-sm text-on-surface">{device.name}</div>
                            <span className="text-label-sm font-label-sm text-on-surface-variant">{device.desc}</span>
                          </div>
                        </div>

                        {/* Custom Toggle Checkbox */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={device.active}
                            onChange={() => handleToggleDevice(device.id)}
                          />
                          <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between pt-space-xs border-t border-surface-variant">
                        <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            {device.active ? 'schedule' : 'pending'}
                          </span>
                          {device.time}
                        </span>
                        {device.id === 'washer' && !device.active ? (
                          <button
                            className="px-2 py-0.5 rounded text-label-sm font-label-sm text-primary-container hover:bg-surface-container font-semibold transition-colors"
                            onClick={() => handleToggleDevice('washer')}
                            type="button"
                          >
                            Approve Shift
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-[#F1F6E3] text-[#2F3D13] font-semibold">
                            {device.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add device link */}
                <div className="mt-space-md pt-space-md border-t border-surface-variant text-center">
                  <a className="inline-flex items-center gap-1 text-title-sm font-title-sm text-primary-container hover:underline" href="/my-loads-devices?add=1">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Register another appliance</span>
                  </a>
                </div>
              </div>

              {/* Facility Quick Tip */}
              <div className="p-space-md rounded-xl bg-surface-container border border-surface-variant flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">lightbulb</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary-container">Flexibility Tip</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Running high loads between 12:00 PM and 4:00 PM absorbs regional wind and solar curtails, maximizing your FlexCoins yield.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
          <div className="bg-primary-container text-on-primary px-4 py-3 rounded-lg shadow-md flex items-center gap-space-sm border border-secondary">
            <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
            <span className="font-title-sm text-title-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
