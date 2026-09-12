import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useDevices from '../hooks/useDevices';

export default function Dashboard() {
  const { devices, loading: devicesLoading, toggleDevice } = useDevices();

  const [isAccepted, setIsAccepted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  // Live telemetry state
  const [energyData, setEnergyData] = useState(null);
  const [forecastList, setForecastList] = useState([]);
  const [impactData, setImpactData] = useState(null);
  const [pendingSchedule, setPendingSchedule] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoadingTelemetry(true);
      try {
        const [energyRes, forecastRes, impactRes, rewardsRes, pendingRes] = await Promise.allSettled([
          api.get('/energy/current'),
          api.get('/energy/forecast?hours=9'),
          api.get('/impact/summary'),
          api.get('/rewards/balance'),
          api.get('/schedule/pending'),
        ]);

        if (energyRes.status === 'fulfilled' && energyRes.value) {
          const d = energyRes.value.data || energyRes.value;
          if (d && typeof d === 'object') {
            const ren = d.renewableAvailability ?? d.renewablePercentage ?? 0;
            setEnergyData({
              source: d.source || 'simulated',
              renewablePercentage: ren,
              gridDemand: d.gridDemand ?? 0,
              gridStatus: ren > 65 ? 'Optimal for flexible use' : ren > 40 ? 'Moderate Grid Stress' : 'Peak Grid Stress',
              node: d.node || (d.source === 'live' ? 'Live Balancing Authority Node' : 'Simulated Regional Grid Node'),
              recommendedWindow: '12:00 PM – 4:00 PM',
            });
          }
        }

        if (forecastRes.status === 'fulfilled' && forecastRes.value) {
          const fc = Array.isArray(forecastRes.value)
            ? forecastRes.value
            : forecastRes.value.data || [];
          if (Array.isArray(fc)) {
            setForecastList(fc);
          }
        }

        let coins = 0;
        if (rewardsRes.status === 'fulfilled' && rewardsRes.value) {
          const rew = rewardsRes.value.data || rewardsRes.value;
          if (rew && typeof rew === 'object') {
            coins = Number(rew.balance) || 0;
          } else if (typeof rew === 'number') {
            coins = rew;
          }
        }

        if (impactRes.status === 'fulfilled' && impactRes.value) {
          const imp = impactRes.value.data || impactRes.value;
          if (imp && typeof imp === 'object') {
            setImpactData({
              flexCoins: imp.totalFlexCoins !== undefined ? imp.totalFlexCoins : coins,
              coinsDelta: coins > 0 ? `+${coins} total earned` : '0 FC this cycle',
              co2Avoided: Number(imp.totalCo2Avoided) || 0,
              energyShifted: Number(imp.totalEnergyShifted) || 0,
              peakReduction: Number(imp.totalPeakReduction) || 0,
            });
          }
        } else {
          setImpactData({
            flexCoins: coins,
            coinsDelta: coins > 0 ? `+${coins} total earned` : '0 FC this cycle',
            co2Avoided: 0,
            energyShifted: 0,
            peakReduction: 0,
          });
        }

        if (pendingRes.status === 'fulfilled' && pendingRes.value) {
          const sched = pendingRes.value.data || pendingRes.value;
          if (sched && sched._id) {
            setPendingSchedule(sched);
            setIsAccepted(sched.status === 'accepted');
          } else {
            setPendingSchedule(null);
          }
        }
      } catch (err) {
        console.warn('Dashboard telemetry load error:', err.message);
      } finally {
        setLoadingTelemetry(false);
      }
    }

    loadDashboardData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAcceptSchedule = async () => {
    if (!pendingSchedule || !pendingSchedule._id) return;
    try {
      await api.post(`/schedule/${pendingSchedule._id}/accept`);
      setIsAccepted(true);
      const coins = pendingSchedule.flexCoinsEarned || Math.round((pendingSchedule.energyShifted || 10) * 3.5);
      const timeStr = pendingSchedule.recommendedStart
        ? new Date(pendingSchedule.recommendedStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'scheduled window';
      showToast(`Schedule applied! ${pendingSchedule.energyShifted || 0} kWh moved to ${timeStr} (+${coins} FC)`);
    } catch (err) {
      showToast(`Could not apply schedule: ${err.message}`);
    }
  };

  const handleToggle = async (id, name) => {
    await toggleDevice(id);
    showToast(`${name} flexibility state updated.`);
  };

  const displayDevices = devices.slice(0, 3);
  const isLoading = loadingTelemetry || devicesLoading;

  // Real data references with 0 defaults (no dummy numbers)
  const currentEnergy = energyData || {
    source: 'simulated',
    renewablePercentage: 0,
    gridStatus: 'Evaluating grid status...',
    node: 'Grid Telemetry Node',
    recommendedWindow: 'Pending forecast',
  };

  const currentImpact = impactData || {
    flexCoins: 0,
    coinsDelta: '0 FC this cycle',
    co2Avoided: 0,
    energyShifted: 0,
    peakReduction: 0,
  };

  const hasZeroActivity =
    devices.length === 0 &&
    currentImpact.flexCoins === 0 &&
    currentImpact.energyShifted === 0;

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary-container text-on-primary px-space-md py-space-sm rounded-lg shadow-lg flex items-center gap-space-xs text-body-md animate-fade-in border border-surface-variant">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP BANNER / GRID CONDITION */}
      <div
        className={`w-full bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md mb-space-lg transition-all ${
          isLoading ? 'opacity-50' : 'opacity-100'
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
                  {currentEnergy.gridStatus}
                </span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">• {currentEnergy.node}</span>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-medium">
                  {currentEnergy.source === 'live' ? 'Live Telemetry' : 'Calibrated Model'}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {currentEnergy.renewablePercentage > 60
                  ? 'Regional clean supply window currently active. Conditions optimal for automated flexible load dispatch.'
                  : currentEnergy.renewablePercentage > 35
                  ? 'Moderate clean generation on regional grid. Automated load shifting recommended before peak demand.'
                  : 'Elevated grid demand and low renewable share. Conserving and shifting non-essential loads recommended.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-md w-full lg:w-auto justify-end border-t lg:border-t-0 pt-space-sm lg:pt-0 border-surface-variant">
            <div className="text-right">
              <span className="text-label-sm font-label-sm text-on-surface-variant block uppercase tracking-wider">
                Clean Power Share
              </span>
              <span className="font-display text-display text-secondary tracking-tight">
                {currentEnergy.renewablePercentage}%
              </span>
            </div>
            <div className="h-10 w-[1px] bg-surface-variant"></div>
            <div className="text-right">
              <span className="text-label-sm font-label-sm text-on-surface-variant block uppercase tracking-wider">
                Grid Demand
              </span>
              <span className="font-title-md text-title-md text-primary-container font-semibold">
                {currentEnergy.gridDemand}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY WRAPPER */}
      {isLoading && (
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

      {/* EMPTY STATE WRAPPER (Shown when real user has 0 devices) */}
      {!isLoading && hasZeroActivity && (
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
          <a
            className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity inline-flex items-center gap-space-xs"
            href="/my-loads-devices?add=1"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Connect First Device
          </a>
        </div>
      )}

      {/* POPULATED DASHBOARD VIEW (Shown when user has data and not in loading/empty state) */}
      {!isLoading && !hasZeroActivity && (
        <div className="flex flex-col gap-space-lg w-full">
          {/* 2. STAT CARDS GRID (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Card 1: FlexCoins */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">FlexCoins Balance</span>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                  {currentEnergy.source === 'live' ? 'Verified Balance' : 'Impact Ledger'}
                </span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">
                  {currentImpact.flexCoins.toLocaleString()}
                </span>
                <span className="font-title-md text-title-md text-primary font-bold">FC</span>
              </div>
              <div className="mt-space-xs flex items-center gap-1 text-on-secondary-container font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>{currentImpact.coinsDelta}</span>
              </div>
            </div>

            {/* Card 2: CO2 Avoided */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">CO₂ Avoided</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">forest</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">
                  {currentImpact.co2Avoided.toFixed(1)}
                </span>
                <span className="font-title-md text-title-md text-on-surface-variant">kg</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
                Equivalent to <span className="font-semibold text-on-surface">{(currentImpact.co2Avoided * 0.045).toFixed(1)} planted trees</span>
              </div>
            </div>

            {/* Card 3: Renewable Utilization */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Clean Energy Share</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">solar_power</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">
                  {currentEnergy.renewablePercentage}
                </span>
                <span className="font-title-md text-title-md text-on-surface-variant">%</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Solar + Wind dispatch alignment</span>
              </div>
            </div>

            {/* Card 4: Peak Reduction */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Peak Demand Offset</span>
                <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display text-display text-primary-container tracking-tight">
                  {currentImpact.peakReduction.toFixed(1)}
                </span>
                <span className="font-title-md text-title-md text-on-surface-variant">kW</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
                Grid strain relief during peak hour
              </div>
            </div>
          </div>

          {/* 3. MAIN DASHBOARD CONTENT (2-Column Grid: 8 Cols & 4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* LEFT COLUMN (8 cols): Today's Schedule & SVG Chart */}
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* Today's Recommended Schedule Banner Card */}
              {pendingSchedule ? (
                <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
                  <div className="flex flex-wrap items-start justify-between gap-space-sm pb-space-md border-b border-surface-variant">
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
                        Load Shifting Automation
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-primary-container">
                        Recommended Dispatch: {pendingSchedule.deviceId?.name || 'Flexible Load'}
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {pendingSchedule.reason || 'Optimized for high renewable availability and minimal peak tariffs.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-label-sm font-label-sm text-on-surface-variant block">Energy Shifted</span>
                      <span className="font-headline-sm text-headline-sm text-primary-container">
                        {pendingSchedule.energyShifted} kWh
                      </span>
                    </div>
                  </div>

                  {/* Time Window Details */}
                  <div className="py-space-md flex flex-wrap items-center justify-between gap-space-md bg-surface-container/50 rounded-lg p-3 my-space-sm border border-surface-variant">
                    <div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant block">Recommended Window</span>
                      <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {new Date(pendingSchedule.recommendedStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – {new Date(pendingSchedule.recommendedEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant block">Clean Energy Match</span>
                      <span className="font-title-sm text-title-sm text-secondary font-semibold">
                        {pendingSchedule.renewableUtilization}% Renewable
                      </span>
                    </div>
                    <div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant block">Peak Reduction</span>
                      <span className="font-title-sm text-title-sm text-primary-container font-semibold">
                        {pendingSchedule.peakReduction} kW Offset
                      </span>
                    </div>
                  </div>

                  {/* Schedule Acceptance CTA Row */}
                  <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-md border-t border-surface-variant">
                    <div className="flex items-center gap-space-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                      <span className="font-body-md text-body-md">
                        Saves {pendingSchedule.co2Avoided} kg CO₂ &amp; earns {pendingSchedule.flexCoinsEarned || Math.round(pendingSchedule.energyShifted * 3.5)} FlexCoins
                      </span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <a
                        href="/schedule-recommendations"
                        className="px-4 py-2 rounded border border-surface-variant font-title-sm text-title-sm text-on-surface hover:border-primary-container hover:text-primary-container transition-colors inline-block"
                      >
                        Details
                      </a>
                      <button
                        className={`px-5 py-2 rounded font-title-sm text-title-sm transition-all flex items-center gap-space-xs ${
                          isAccepted
                            ? 'bg-secondary-fixed-dim text-on-secondary-fixed border border-secondary'
                            : 'bg-primary-container text-on-primary hover:opacity-95'
                        }`}
                        onClick={handleAcceptSchedule}
                        type="button"
                        disabled={isAccepted}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isAccepted ? 'done_all' : 'check_circle'}
                        </span>
                        <span>
                          {isAccepted
                            ? 'Schedule Active'
                            : `Accept Schedule (+${pendingSchedule.flexCoinsEarned || Math.round(pendingSchedule.energyShifted * 3.5)} FC)`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg text-center">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">schedule</span>
                  <h3 className="font-title-md text-title-md text-primary-container">No Pending Recommendations</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
                    All connected loads are currently synced or running. Register or configure appliances to generate new dispatch windows.
                  </p>
                  <a
                    href="/my-loads-devices?add=1"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded bg-primary-container text-on-primary text-title-sm font-title-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Configure Appliance</span>
                  </a>
                </div>
              )}

              {/* Hourly Renewable Energy Chart with Real Data */}
              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
                <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary-container">Cleaner Energy Available by Hour</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time forecast curve from energy telemetry service</p>
                  </div>
                  <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-secondary-fixed-dim"></span>
                      <span className="text-on-surface">Renewable Supply (%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                      <span className="text-on-surface">Demand Baseline (%)</span>
                    </div>
                  </div>
                </div>

                {/* SVG Bar + Marker Chart driven by real forecast */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[540px] pt-4">
                    <svg className="w-full h-48 overflow-visible" fill="none" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg">
                      <line stroke="#E8E0EB" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="590" y1="20" y2="20" />
                      <line stroke="#E8E0EB" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="590" y1="60" y2="60" />
                      <line stroke="#E8E0EB" strokeDasharray="2 2" strokeWidth="1" x1="40" x2="590" y1="100" y2="100" />
                      <line stroke="#E8E0EB" strokeWidth="1" x1="40" x2="590" y1="140" y2="140" />

                      <text fill="#81737C" fontFamily="Inter" fontSize="10" textAnchor="end" x="30" y="24">80%</text>
                      <text fill="#81737C" fontFamily="Inter" fontSize="10" textAnchor="end" x="30" y="64">50%</text>
                      <text fill="#81737C" fontFamily="Inter" fontSize="10" textAnchor="end" x="30" y="104">20%</text>

                      {forecastList.slice(0, 9).map((point, idx) => {
                        const x = 50 + idx * 60;
                        const ren = Math.min(100, Math.max(5, point.renewableAvailability ?? 40));
                        const demand = Math.min(100, Math.max(5, point.gridDemand ?? 50));
                        const barHeight = (ren / 100) * 110;
                        const barY = 140 - barHeight;
                        const demandY = 140 - (demand / 100) * 110;
                        const hourLabel = point.timestamp
                          ? new Date(point.timestamp).toLocaleTimeString([], { hour: 'numeric' })
                          : `${idx}h`;

                        return (
                          <g key={idx}>
                            {/* Renewable Supply Bar */}
                            <rect
                              fill={ren > 65 ? '#526615' : ren > 40 ? '#b8d074' : '#e8e0eb'}
                              height={barHeight}
                              rx="2"
                              width="28"
                              x={x}
                              y={barY}
                            />
                            {/* Demand Baseline Indicator */}
                            <rect
                              fill="#450C3F"
                              height="3"
                              rx="1.5"
                              width="12"
                              x={x + 8}
                              y={demandY}
                            />
                            {/* Hour Label */}
                            <text
                              fill="#50434B"
                              fontFamily="Inter"
                              fontSize="11"
                              textAnchor="middle"
                              x={x + 14}
                              y="154"
                            >
                              {hourLabel}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="mt-space-sm p-space-sm bg-surface-container rounded border border-surface-variant flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">
                    Current telemetry source: <strong>{currentEnergy.source === 'live' ? 'Live Grid Meter' : 'Calibrated Provider'}</strong>
                  </span>
                  <span className="text-secondary font-title-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span> {currentEnergy.renewablePercentage}% Clean Factor
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
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {devices.length} connected controllable {devices.length === 1 ? 'device' : 'devices'}
                    </p>
                  </div>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors" href="/my-loads-devices">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </a>
                </div>

                {/* Device List */}
                <div className="flex flex-col gap-space-md">
                  {displayDevices.length === 0 ? (
                    <div className="text-center py-6 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[28px] mb-1">devices_other</span>
                      <p className="font-body-sm text-body-sm">No devices registered yet.</p>
                    </div>
                  ) : (
                    displayDevices.map((device) => {
                      const devId = device.id || device._id;
                      return (
                        <div key={devId} className="p-space-md bg-surface rounded-lg border border-surface-variant flex flex-col gap-space-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-space-xs">
                              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-primary-container">
                                <span className="material-symbols-outlined text-[20px]">
                                  {device.type === 'ev_charging' ? 'ev_station' : device.type === 'water_heater' ? 'water_heater' : 'hvac'}
                                </span>
                              </div>
                              <div>
                                <div className="font-title-sm text-title-sm text-on-surface">{device.name}</div>
                                <span className="text-label-sm font-label-sm text-on-surface-variant">
                                  {device.energyRequired} kWh required
                                </span>
                              </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={device.status === 'active' || device.active === true}
                                onChange={() => handleToggle(devId, device.name)}
                              />
                              <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between pt-space-xs border-t border-surface-variant">
                            <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                              {device.status || 'active'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-[#F1F6E3] text-[#2F3D13] font-semibold">
                              {device.flexibility ? `${device.flexibility.toUpperCase()} FLEX` : 'AUTO-SYNC'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-space-md pt-space-md border-t border-surface-variant text-center">
                  <a className="inline-flex items-center gap-1 text-title-sm font-title-sm text-primary-container hover:underline" href="/my-loads-devices?add=1">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Register another appliance</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
