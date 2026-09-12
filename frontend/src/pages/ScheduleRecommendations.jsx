import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useDevices from '../hooks/useDevices';
import { ERROR_MESSAGES } from '../utils/errorMapper';

export default function ScheduleRecommendations() {
  const { devices, loading: devicesLoading } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const [screenState, setScreenState] = useState('populated');
  const [isAccepted, setIsAccepted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [noFeasibleSlot, setNoFeasibleSlot] = useState(false);

  // Recommendation Model
  const [recommendation, setRecommendation] = useState({
    id: 'sched_rec_01',
    requestedTime: 'Today • 6:30 PM',
    recommendedTime: 'Tonight • 11:15 PM',
    requestedRate: '$0.342 / kWh (Peak Tier)',
    recommendedRate: '$0.118 / kWh (Super Off-Peak)',
    requestedCarbon: '542 g CO₂ / kWh',
    recommendedCarbon: '108 g CO₂ / kWh (-80%)',
    energyShifted: '18.5 kWh',
    peakReduction: '4.2 kW',
    co2Avoided: '9.8 kg',
    flexCoins: 75,
    reason: 'Local wind generation surges after 10 PM across the regional balancing authority, displacing thermal peaker generators and drastically reducing carbon intensity.',
    confidence: '99.4%',
  });

  useEffect(() => {
    if (devices && devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id || devices[0]._id);
    }
  }, [devices, selectedDeviceId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchRecommendation = async (devId) => {
    if (!devId) return;
    setLoadingRecommendation(true);
    setNoFeasibleSlot(false);
    try {
      const res = await api.post('/schedule/recommend', { deviceId: devId });
      const rec = res.data?.schedule || res.data || res;
      if (rec.noFeasibleSlot || rec.status === 'NO_FEASIBLE_SLOT') {
        setNoFeasibleSlot(true);
      } else {
        setRecommendation((prev) => ({
          ...prev,
          id: rec._id || rec.id || prev.id,
          recommendedTime: rec.scheduledWindowStart
            ? `Tonight • ${new Date(rec.scheduledWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : prev.recommendedTime,
          energyShifted: rec.energyShiftedKwh ? `${rec.energyShiftedKwh} kWh` : prev.energyShifted,
          flexCoins: rec.projectedFlexCoins || prev.flexCoins,
          reason: rec.reason || rec.explanation || prev.reason,
        }));
      }
    } catch (err) {
      if (err.response?.data?.code === 'NO_FEASIBLE_SLOT') {
        setNoFeasibleSlot(true);
      } else {
        // Fallback gracefully per Section 28
        console.warn('Schedule recommendation fallback active:', err.message);
      }
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleDeviceChange = (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    fetchRecommendation(devId);
  };

  const handleAccept = async () => {
    try {
      await api.post(`/schedule/${recommendation.id}/accept`);
    } catch {
      // Graceful fallback
    }
    setIsAccepted(true);
    setScreenState('accepted');
    showToast(`Schedule locked! Asset scheduled for ${recommendation.recommendedTime} (+${recommendation.flexCoins} FlexCoins)`);
  };

  const selectedDevice = devices.find((d) => (d.id || d._id) === selectedDeviceId) || devices[0];

  return (
    <div className="flex flex-col w-full">
      {/* Interactive View State Controller */}
      <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg pb-space-sm border-b border-surface-variant">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Demand Flexibility Dispatch</span>
            <span className="text-xs">•</span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold">Node #TX-8801 Optimal Window</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">
            Schedule Recommendation
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Find a better time to use electricity, lower peak congestion, and reduce system carbon emissions.
          </p>
        </div>

        {/* Prototype State Switcher */}
        <div className="flex items-center p-1 bg-surface-container rounded-lg border border-surface-variant">
          <button
            className={`px-space-sm py-1.5 rounded text-label-md font-label-md transition-all flex items-center gap-1.5 ${
              screenState === 'populated'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              setScreenState('populated');
              setNoFeasibleSlot(false);
            }}
          >
            <span className={`w-2 h-2 rounded-full ${screenState === 'populated' ? 'bg-secondary-fixed' : 'bg-surface-variant'}`}></span>
            Active Recommendation
          </button>
          <button
            className={`px-space-sm py-1.5 rounded text-label-md font-label-md transition-all flex items-center gap-1.5 ${
              screenState === 'accepted'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setScreenState('accepted')}
          >
            <span className={`w-2 h-2 rounded-full ${screenState === 'accepted' ? 'bg-secondary-fixed' : 'bg-surface-variant'}`}></span>
            Accepted Confirmation
          </button>
          <button
            className={`px-space-sm py-1.5 rounded text-label-md font-label-md transition-all flex items-center gap-1.5 ${
              screenState === 'empty'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setScreenState('empty')}
          >
            <span className={`w-2 h-2 rounded-full ${screenState === 'empty' ? 'bg-secondary-fixed' : 'bg-surface-variant'}`}></span>
            Empty / Idle
          </button>
        </div>
      </div>

      {/* NO FEASIBLE SLOT NOTICE (Section 28 Best Effort / Notice) */}
      {noFeasibleSlot && (
        <div className="mb-space-lg p-space-md rounded-xl bg-surface-container border border-secondary-fixed flex items-start gap-space-sm">
          <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">info</span>
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm text-primary-container">Optimal Window Advisory</span>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {ERROR_MESSAGES.NO_FEASIBLE_SCHEDULE}
            </p>
          </div>
        </div>
      )}

      {/* VIEW STATE: EMPTY */}
      {screenState === 'empty' && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">calendar_today</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No Active Schedule Recommendations
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            All connected devices are currently operating within their optimal windows or have already been shifted.
          </p>
          <button
            className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity"
            onClick={() => setScreenState('populated')}
            type="button"
          >
            Check Available Dispatches
          </button>
        </div>
      )}

      {/* VIEW STATE: ACCEPTED */}
      {screenState === 'accepted' && (
        <div className="bg-surface-container-lowest border-2 border-secondary rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-md shadow-sm">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-space-md text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary-container mb-space-xs">
            Schedule Locked for {recommendation.recommendedTime}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-space-lg">
            {selectedDevice?.name || 'Your flexible load'} will activate at {recommendation.recommendedTime} to leverage peak regional wind and hydro power.
          </p>
          <div className="flex items-center gap-space-md p-space-md bg-secondary-container/30 rounded-xl border border-secondary-fixed-dim mb-space-lg">
            <span className="material-symbols-outlined text-secondary text-[24px]">toll</span>
            <span className="font-title-md text-title-md text-primary-container font-bold">
              +{recommendation.flexCoins} FlexCoins Credited Upon Cycle Completion
            </span>
          </div>
          <button
            className="px-5 py-2.5 rounded border border-surface-variant text-on-surface font-title-sm text-title-sm hover:border-primary-container transition-colors"
            onClick={() => setScreenState('populated')}
            type="button"
          >
            Review Other Loads
          </button>
        </div>
      )}

      {/* VIEW STATE: POPULATED */}
      {screenState === 'populated' && (
        <div className="flex flex-col gap-space-xl">
          {/* Top Level Load Selector & Summary Bar */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-md flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center border border-surface-variant text-primary-container">
                <span className="material-symbols-outlined text-[28px]">electric_car</span>
              </div>
              <div>
                <div className="flex items-center gap-space-xs">
                  {devices.length > 0 ? (
                    <select
                      className="font-title-md text-title-md text-on-surface bg-transparent border-b border-surface-variant focus:outline-none focus:border-primary-container cursor-pointer pr-4"
                      value={selectedDeviceId}
                      onChange={handleDeviceChange}
                    >
                      {devices.map((d) => (
                        <option key={d.id || d._id} value={d.id || d._id}>
                          {d.name} ({d.power || `${d.energyRequired} kWh`})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-title-md text-title-md text-on-surface">Commercial Fleet Depot • Bay #4 Charger</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                    High Flexibility
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Target delivery: {selectedDevice?.energyRequired || '62.0'} kWh by {selectedDevice?.deadline || '06:30 AM'} • Current buffer: +5.25 hrs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-md">
              <div className="text-right hidden sm:block">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Shift Window Urgency</span>
                <span className="font-title-sm text-title-sm text-primary-container">Moderate • 4 hr 45 min flexible span</span>
              </div>
              <div className="h-8 w-[1px] bg-surface-variant hidden sm:block"></div>
              <a
                href="/my-loads-devices"
                className="px-3 py-1.5 border border-surface-variant hover:border-primary-container text-on-surface font-label-md text-label-md rounded flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Load Constraints
              </a>
            </div>
          </div>

          {/* Comparison Arena: Requested vs Recommended */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            {/* Card: Requested Time (Suboptimal) */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-outline-variant"></div>
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-label-sm font-label-sm bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-semibold">
                      User Default
                    </span>
                    <span className="text-on-surface-variant font-label-sm text-label-sm">Peak Demand Period</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">warning</span>
                </div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                  Requested Start
                </span>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">{recommendation.requestedTime}</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">EDT</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  Immediate dispatch overlaps directly with peak municipal power draw and fossil-fuel peaker plant activation.
                </p>

                <div className="space-y-3 pt-space-sm border-t border-surface-variant">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-error">speed</span>
                      Grid Load Pressure
                    </span>
                    <span className="font-title-sm text-title-sm text-error">Severe Strain (94% Cap)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">eco</span>
                      Renewable Supply Share
                    </span>
                    <span className="font-title-sm text-title-sm text-on-surface">24% (Marginal Gas Peakers)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">payments</span>
                      Applicable Energy Rate
                    </span>
                    <span className="font-title-sm text-title-sm text-on-surface">{recommendation.requestedRate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-space-lg pt-space-md border-t border-surface-variant flex items-center justify-between text-on-surface-variant">
                <span className="font-label-sm text-label-sm">Grid Carbon Intensity</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">{recommendation.requestedCarbon}</span>
              </div>
            </div>

            {/* Card: Recommended Time (GreenSync Optimal) */}
            <div className="bg-surface-container-lowest border-2 border-primary-container rounded-xl p-space-lg flex flex-col justify-between relative shadow-sm">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-secondary-fixed-dim"></div>
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-label-sm font-label-sm bg-secondary-container text-on-secondary-fixed border border-secondary-fixed-dim uppercase tracking-wider font-semibold">
                      GreenSync Algorithmic Pick
                    </span>
                    <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span> {recommendation.confidence} Confidence
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                </div>

                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block mb-1">
                  Recommended Dispatch
                </span>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <h2 className="font-headline-lg text-headline-lg text-primary-container">{recommendation.recommendedTime}</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">EDT (Late Evening)</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  {recommendation.reason}
                </p>

                <div className="space-y-3 pt-space-sm border-t border-surface-variant">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                      Grid Load Pressure
                    </span>
                    <span className="font-title-sm text-title-sm text-secondary">Minimal (38% Cap)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">wind_power</span>
                      Renewable Supply Share
                    </span>
                    <span className="font-title-sm text-title-sm text-primary-container font-bold">82% (Regional Wind &amp; Hydro)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">savings</span>
                      Applicable Energy Rate
                    </span>
                    <span className="font-title-sm text-title-sm text-primary-container">{recommendation.recommendedRate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-space-lg pt-space-md border-t border-surface-variant flex items-center justify-between text-on-surface">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Grid Carbon Intensity</span>
                <span className="font-label-md text-label-md font-bold text-secondary">{recommendation.recommendedCarbon}</span>
              </div>
            </div>
          </div>

          {/* Live Impact Simulation */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Shift Outcome Verification
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Impact Simulation &amp; Reward Ledger</h3>
              </div>
              <span className="text-label-sm font-label-sm text-on-surface-variant">Simulated against regional ERCOT-West benchmark</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-md text-label-md">Energy Shifted</span>
                  <span className="material-symbols-outlined text-[20px] text-primary-container">sync_alt</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-primary-container font-bold">
                    {recommendation.energyShifted.split(' ')[0]}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">kWh</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">100% of charging cycle</span>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-md text-label-md">Peak Reduction</span>
                  <span className="material-symbols-outlined text-[20px] text-secondary">trending_down</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-secondary font-bold">
                    {recommendation.peakReduction.split(' ')[0]}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">kW</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Relieves substation #04</span>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-md text-label-md">CO₂ Avoided</span>
                  <span className="material-symbols-outlined text-[20px] text-secondary">cloud_off</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-on-surface font-bold">
                    {recommendation.co2Avoided.split(' ')[0]}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">kg</span>
                </div>
                <span className="font-body-sm text-body-sm text-secondary font-semibold mt-1">Equivalent to 24 mi driving</span>
              </div>

              <div className="p-space-md rounded-lg bg-secondary-container/40 border border-secondary-fixed-dim flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-secondary-fixed mb-2">
                  <span className="font-label-md text-label-md font-semibold">FlexCoins Earned</span>
                  <span className="material-symbols-outlined text-[22px] text-secondary">toll</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-primary-container font-bold">
                    +{recommendation.flexCoins}
                  </span>
                  <span className="font-title-sm text-title-sm text-primary-container font-bold">FC</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1">
                  Redeemable for credit
                </span>
              </div>
            </div>
          </div>

          {/* Plain-Language Rationale Card */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex items-center gap-space-xs mb-space-md">
              <span className="material-symbols-outlined text-primary-container text-[24px]">psychology</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Why this recommendation makes sense</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col gap-2">
                <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">air</span>
                </div>
                <span className="font-title-sm text-title-sm text-on-surface">Cleaner energy available</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {recommendation.reason}
                </p>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col gap-2">
                <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">compress</span>
                </div>
                <span className="font-title-sm text-title-sm text-on-surface">Grid strain reduced</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Evening municipal HVAC and domestic cooking usage drops by 45% after 9:30 PM, releasing congested capacity on local distribution transformers.
                </p>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col gap-2">
                <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <span className="font-title-sm text-title-sm text-on-surface">Cheapest utility tariff</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Nighttime wholesale rates fall into super-off-peak tier ($0.118 / kWh), delivering an immediate 65% cost savings on this high-draw cycle.
                </p>
              </div>
            </div>

            {/* Bottom Action Row */}
            <div className="mt-space-lg pt-space-md border-t border-surface-variant flex flex-wrap items-center justify-between gap-space-md">
              <div className="text-on-surface-variant font-body-sm text-body-sm">
                Next automated dispatch optimization runs in <strong>24 minutes</strong>.
              </div>
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  className="px-4 py-2 rounded border border-surface-variant font-title-sm text-title-sm text-on-surface hover:border-primary-container transition-colors"
                  onClick={() => showToast('Kept requested 6:30 PM start.')}
                >
                  Keep 6:30 PM Start
                </button>
                <button
                  type="button"
                  disabled={loadingRecommendation}
                  className="px-6 py-2 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity flex items-center gap-space-xs"
                  onClick={handleAccept}
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  <span>Accept Recommendation (+{recommendation.flexCoins} FlexCoins)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
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
