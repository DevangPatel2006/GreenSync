import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useDevices from '../hooks/useDevices';

export default function ScheduleRecommendations() {
  const { devices, loading: devicesLoading } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const [screenState, setScreenState] = useState('live');
  const [isAccepted, setIsAccepted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [noFeasibleSlot, setNoFeasibleSlot] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (devices && devices.length > 0 && !selectedDeviceId) {
      const devId = devices[0].id || devices[0]._id;
      setSelectedDeviceId(devId);
      fetchRecommendation(devId);
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
    setIsAccepted(false);
    try {
      const res = await api.post('/schedule/recommend', { deviceId: devId });
      const rec = res?.schedule || res?.data?.schedule || res?.data || res;
      if (!rec || rec.noFeasibleSlot || rec.status === 'NO_FEASIBLE_SLOT') {
        setNoFeasibleSlot(true);
        setRecommendation(null);
      } else {
        const coins = rec.flexCoinsEarned || Math.round((Number(rec.energyShifted) || 10) * 3.5);
        const startStr = rec.recommendedStart
          ? new Date(rec.recommendedStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : 'Tonight';
        const endStr = rec.recommendedEnd
          ? new Date(rec.recommendedEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : '';

        setRecommendation({
          id: rec._id,
          recommendedStart: rec.recommendedStart,
          recommendedEnd: rec.recommendedEnd,
          recommendedTime: endStr ? `${startStr} – ${endStr}` : startStr,
          requestedRate: '$0.342 / kWh (Peak Tier)',
          recommendedRate: '$0.118 / kWh (Super Off-Peak)',
          requestedCarbon: '540 g CO₂ / kWh',
          recommendedCarbon: `${Math.round(540 * (1 - (rec.renewableUtilization || 80) / 100))} g CO₂ / kWh (-${rec.renewableUtilization || 80}%)`,
          energyShifted: Number(rec.energyShifted) || 0,
          peakReduction: Number(rec.peakReduction) || 0,
          co2Avoided: Number(rec.co2Avoided) || 0,
          flexCoins: coins,
          reason: rec.reason || 'Optimized for high regional clean power generation, displacing peak peaker activation.',
          confidence: `${Math.min(99.9, Math.max(90, (rec.renewableUtilization || 90) + 5)).toFixed(1)}%`,
          status: rec.status,
        });
        if (rec.status === 'accepted') {
          setIsAccepted(true);
        }
      }
    } catch (err) {
      if (err.response?.data?.code === 'NO_FEASIBLE_SLOT' || err.response?.status === 400) {
        setNoFeasibleSlot(true);
      } else {
        showToast(err.message || 'Error calculating recommendation');
      }
      setRecommendation(null);
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
    if (!recommendation?.id) return;
    try {
      await api.post(`/schedule/${recommendation.id}/accept`);
      setIsAccepted(true);
      setScreenState('accepted');
      showToast(`Schedule locked! Asset scheduled for ${recommendation.recommendedTime} (+${recommendation.flexCoins} FlexCoins)`);
    } catch (err) {
      showToast(err.message || 'Could not accept schedule');
    }
  };

  const selectedDevice = devices.find((d) => (d.id || d._id) === selectedDeviceId) || devices[0];
  const requestedStartFormatted = selectedDevice?.earliestStart
    ? new Date(selectedDevice.earliestStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Immediate Peak';

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary-container text-on-primary px-space-md py-space-sm rounded-lg shadow-lg flex items-center gap-space-xs text-body-md animate-fade-in border border-surface-variant">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Controller */}
      <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg pb-space-sm border-b border-surface-variant">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Demand Flexibility Dispatch</span>
            <span className="text-xs">•</span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold">Algorithmic Load Shifting</span>
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
              screenState === 'live'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setScreenState('live')}
            type="button"
          >
            Live Schedule
          </button>
          <button
            className={`px-space-sm py-1.5 rounded text-label-md font-label-md transition-all flex items-center gap-1.5 ${
              screenState === 'accepted'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setScreenState('accepted')}
            type="button"
          >
            Accepted View
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {(loadingRecommendation || devicesLoading) && (
        <div className="flex flex-col gap-space-lg animate-pulse w-full">
          <div className="h-20 bg-surface-container-high rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            <div className="h-80 bg-surface-container-high rounded-xl"></div>
            <div className="h-80 bg-surface-container-high rounded-xl"></div>
          </div>
        </div>
      )}

      {/* EMPTY STATE: NO DEVICES */}
      {!devicesLoading && devices.length === 0 && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">devices_other</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No Flexible Loads Registered
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

      {/* INFEASIBLE SENTINEL STATE */}
      {!devicesLoading && devices.length > 0 && noFeasibleSlot && (
        <div className="bg-surface-container-lowest border border-warning/30 rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-warning-container/40 flex items-center justify-center mb-space-md text-warning">
            <span className="material-symbols-outlined text-[32px]">event_busy</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No Feasible Schedule Window
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            The deadline set for {selectedDevice?.name || 'this appliance'} is too narrow for its required energy run-time. Broaden the deadline or adjust earliest start to allow algorithmic optimization.
          </p>
          <a
            className="px-5 py-2.5 rounded border border-surface-variant text-on-surface font-title-sm text-title-sm hover:border-primary-container transition-colors"
            href="/my-loads-devices"
          >
            Adjust Device Window
          </a>
        </div>
      )}

      {/* VIEW STATE: ACCEPTED CONFIRMATION SCREEN */}
      {!devicesLoading && screenState === 'accepted' && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-xl flex flex-col items-center justify-center text-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-space-md text-secondary">
            <span className="material-symbols-outlined text-[36px]">done_all</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F1F6E3] text-[#2F3D13] font-label-sm text-label-sm font-semibold mb-space-xs">
            Dispatch Window Locked
          </span>
          <h2 className="font-headline-md text-headline-md text-primary-container mb-space-xs">
            Schedule Dispatched Successfully
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-space-lg">
            {selectedDevice?.name || 'Your flexible load'} will activate at {recommendation?.recommendedTime || 'the optimal window'} to leverage peak regional clean energy.
          </p>
          <div className="flex items-center gap-space-md p-space-md bg-secondary-container/30 rounded-xl border border-secondary-fixed-dim mb-space-lg">
            <span className="material-symbols-outlined text-secondary text-[24px]">toll</span>
            <span className="font-title-md text-title-md text-primary-container font-bold">
              +{recommendation?.flexCoins || 65} FlexCoins Credited Upon Cycle Completion
            </span>
          </div>
          <button
            className="px-5 py-2.5 rounded border border-surface-variant text-on-surface font-title-sm text-title-sm hover:border-primary-container transition-colors"
            onClick={() => setScreenState('live')}
            type="button"
          >
            Review Other Loads
          </button>
        </div>
      )}

      {/* VIEW STATE: POPULATED & LIVE */}
      {!devicesLoading && !loadingRecommendation && screenState === 'live' && recommendation && (
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
                          {d.name} ({d.energyRequired} kWh)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-title-md text-title-md text-on-surface">Select a Device</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant uppercase">
                    {selectedDevice?.flexibility || 'High'} Flexibility
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Target delivery: {selectedDevice?.energyRequired || 10} kWh by {selectedDevice?.deadline ? new Date(selectedDevice.deadline).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Flexible'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-md">
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
                    <span className="text-on-surface-variant font-label-sm text-label-sm">Immediate Window</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">warning</span>
                </div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                  Requested Start
                </span>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">{requestedStartFormatted}</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  Immediate unmanaged dispatch risks overlapping with higher wholesale rates and fossil peaker activation.
                </p>

                <div className="space-y-3 pt-space-sm border-t border-surface-variant">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-error">speed</span>
                      Grid Load Pressure
                    </span>
                    <span className="font-title-sm text-title-sm text-error">Unoptimized</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">eco</span>
                      Renewable Supply Share
                    </span>
                    <span className="font-title-sm text-title-sm text-on-surface">Base Grid Mix</span>
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
                  Recommended Dispatch Window
                </span>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <h2 className="font-headline-lg text-headline-lg text-primary-container">{recommendation.recommendedTime}</h2>
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
                    <span className="font-title-sm text-title-sm text-secondary">Relieved ({recommendation.peakReduction} kW offset)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">solar_power</span>
                      Renewable Supply Share
                    </span>
                    <span className="font-title-sm text-title-sm text-primary-container font-bold">
                      {recommendation.renewableUtilization || 85}% Clean Energy
                    </span>
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

          {/* Shift Outcome Verification */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Shift Outcome Verification
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Impact Simulation &amp; Reward Projection</h3>
              </div>
              <span className="text-label-sm font-label-sm text-on-surface-variant">Simulated against regional grid benchmark</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-md text-label-md">Energy Shifted</span>
                  <span className="material-symbols-outlined text-[20px] text-primary-container">sync_alt</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-primary-container font-bold">
                    {recommendation.energyShifted}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">kWh</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">100% of device cycle</span>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-md text-label-md">Peak Reduction</span>
                  <span className="material-symbols-outlined text-[20px] text-secondary">trending_down</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-secondary font-bold">
                    {recommendation.peakReduction}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">kW</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Direct peaker offset</span>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-md text-label-md">Avoided Emissions</span>
                  <span className="material-symbols-outlined text-[20px] text-secondary">co2</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-secondary font-bold">
                    {recommendation.co2Avoided}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">kg</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Calculated emissions cut</span>
              </div>

              <div className="p-space-md rounded-lg bg-secondary-container/40 border border-secondary-fixed-dim flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-secondary-fixed mb-2">
                  <span className="font-label-md text-label-md font-semibold">Projected FlexCoins</span>
                  <span className="material-symbols-outlined text-[20px]">toll</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-mobile text-display-mobile text-primary-container font-bold">
                    +{recommendation.flexCoins}
                  </span>
                  <span className="font-title-sm text-title-sm text-secondary font-bold">FC</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed mt-1">Explainable points formula</span>
              </div>
            </div>

            {/* Lock & Dispatch Action Footer */}
            <div className="mt-space-lg pt-space-md border-t border-surface-variant flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
                <span>Locking recommendation queues automated smart breaker dispatch at scheduled time.</span>
              </div>
              <button
                className={`px-space-xl py-3 rounded-lg font-title-sm text-title-sm flex items-center gap-space-xs shadow-sm transition-all ${
                  isAccepted
                    ? 'bg-secondary-fixed-dim text-on-secondary-fixed border border-secondary cursor-default'
                    : 'bg-primary-container hover:bg-primary text-on-primary'
                }`}
                onClick={handleAccept}
                type="button"
                disabled={isAccepted}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isAccepted ? 'done_all' : 'lock_clock'}
                </span>
                <span>{isAccepted ? 'Dispatch Schedule Active' : 'Lock & Dispatch Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
