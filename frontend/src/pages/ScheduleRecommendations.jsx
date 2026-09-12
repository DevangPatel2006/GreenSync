import React, { useState } from 'react';

export default function ScheduleRecommendations() {
  const [screenState, setScreenState] = useState('populated');
  const [isAccepted, setIsAccepted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAccept = () => {
    setIsAccepted(true);
    setScreenState('accepted');
    showToast('Schedule locked! Asset scheduled for 11:15 PM (+75 FlexCoins)');
  };

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
            onClick={() => setScreenState('populated')}
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
            Schedule Locked for 11:15 PM
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-space-lg">
            Commercial Fleet Depot Bay #4 Charger will activate at 11:15 PM tonight to leverage 82% regional wind and hydro power.
          </p>
          <div className="flex items-center gap-space-md p-space-md bg-secondary-container/30 rounded-xl border border-secondary-fixed-dim mb-space-lg">
            <span className="material-symbols-outlined text-secondary text-[24px]">toll</span>
            <span className="font-title-md text-title-md text-primary-container font-bold">+75 FlexCoins Credited Upon Cycle Completion</span>
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
          {/* Top Level Load Summary Bar */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-md flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center border border-surface-variant text-primary-container">
                <span className="material-symbols-outlined text-[28px]">electric_car</span>
              </div>
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-title-md text-title-md text-on-surface">Commercial Fleet Depot • Bay #4 Charger</span>
                  <span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                    High Flexibility
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Target delivery: 62.0 kWh by 06:30 AM tomorrow • Current buffer: +5.25 hrs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-md">
              <div className="text-right hidden sm:block">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Shift Window Urgency</span>
                <span className="font-title-sm text-title-sm text-primary-container">Moderate • 4 hr 45 min flexible span</span>
              </div>
              <div className="h-8 w-[1px] bg-surface-variant hidden sm:block"></div>
              <button
                className="px-3 py-1.5 border border-surface-variant hover:border-primary-container text-on-surface font-label-md text-label-md rounded flex items-center gap-1 transition-colors"
                onClick={() => showToast('Load constraint parameters opened.')}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Load Constraints
              </button>
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
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Today • 6:30 PM</h2>
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
                    <span className="font-title-sm text-title-sm text-on-surface">$0.342 / kWh (Peak Tier)</span>
                  </div>
                </div>
              </div>

              <div className="mt-space-lg pt-space-md border-t border-surface-variant flex items-center justify-between text-on-surface-variant">
                <span className="font-label-sm text-label-sm">Grid Carbon Intensity</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">542 g CO₂ / kWh</span>
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
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span> 99.4% Confidence
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                </div>

                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block mb-1">
                  Recommended Dispatch
                </span>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <h2 className="font-headline-lg text-headline-lg text-primary-container">Tonight • 11:15 PM</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">EDT (Late Evening)</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  Shifts demand to align precisely with anticipated overnight wind energy surplus and off-peak distribution capacity.
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
                    <span className="font-title-sm text-title-sm text-primary-container">$0.118 / kWh (Super Off-Peak)</span>
                  </div>
                </div>
              </div>

              <div className="mt-space-lg pt-space-md border-t border-surface-variant flex items-center justify-between text-on-surface">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Grid Carbon Intensity</span>
                <span className="font-label-md text-label-md font-bold text-secondary">108 g CO₂ / kWh (-80%)</span>
              </div>
            </div>
          </div>

          {/* Live Impact Simulation (Metrics Strip) */}
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
                  <span className="font-display-mobile text-display-mobile text-primary-container font-bold">18.5</span>
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
                  <span className="font-display-mobile text-display-mobile text-secondary font-bold">4.2</span>
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
                  <span className="font-display-mobile text-display-mobile text-on-surface font-bold">9.8</span>
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
                  <span className="font-display-mobile text-display-mobile text-primary-container font-bold">+75</span>
                  <span className="font-title-sm text-title-sm text-primary-container font-bold">FC</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1">
                  Redeemable for credit
                </span>
              </div>
            </div>
          </div>

          {/* 24-Hour Timeline Bar Chart */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-title-md text-title-md text-on-surface">24-Hour Clean Energy Horizon</h3>
                  <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-semibold">
                    Forecasted Telemetry
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Hourly grid renewable penetration index with active demand window relocation.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-space-md text-label-sm font-label-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-error/70"></span>
                  <span>Congested / High Carbon</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-surface-variant"></span>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-secondary-fixed-dim"></span>
                  <span>Clean / Renewable Window</span>
                </div>
              </div>
            </div>

            {/* SVG Timeline Chart */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[720px] py-space-sm">
                <div className="relative w-full h-8 mb-2">
                  <div className="absolute left-[72%] -translate-x-1/2 flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-error text-on-error text-label-sm font-label-sm rounded font-semibold whitespace-nowrap shadow-sm">
                      Bypassed: 6:30 PM
                    </span>
                    <span className="w-[1px] h-2 bg-error"></span>
                  </div>

                  <div className="absolute left-[94%] -translate-x-1/2 flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-primary-container text-on-primary text-label-sm font-label-sm rounded font-semibold whitespace-nowrap flex items-center gap-1 border border-secondary-fixed">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 11:15 PM Active
                    </span>
                    <span className="w-[1px] h-2 bg-primary-container"></span>
                  </div>

                  <svg className="w-full h-8 absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 32">
                    <path d="M 720 12 Q 830 -8 940 12" fill="none" stroke="#450C3F" strokeDasharray="4 4" strokeWidth="1.75" />
                    <polygon fill="#450C3F" points="942,12 935,7 937,13" />
                  </svg>
                </div>

                {/* 24 Hour Bar Graph */}
                <div className="grid grid-cols-24 gap-1 items-end h-32 pt-4 px-1 border-b border-surface-variant">
                  {[74, 78, 81, 85, 79, 64, 45, 35, 32, 42, 58, 68, 72, 71, 65, 54, 39, 28, 24, 22, 30, 48, 66, 82].map(
                    (val, idx) => {
                      const isRequested = idx === 18;
                      const isRecommended = idx === 23;
                      let barColor = 'bg-secondary-container';
                      if (val < 40) barColor = 'bg-error/60';
                      else if (val < 60) barColor = 'bg-surface-variant';
                      else if (val >= 80) barColor = 'bg-secondary-fixed-dim';

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                          title={`${idx}:00 - ${val}% Renewable`}
                        >
                          {isRequested && (
                            <div className="absolute -top-1 w-full flex justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                            </div>
                          )}
                          {isRecommended && (
                            <div className="absolute -top-1 w-full flex justify-center">
                              <span className="w-2 h-2 rounded-full bg-secondary ring-2 ring-surface"></span>
                            </div>
                          )}
                          <div
                            className={`w-full rounded-t ${barColor} ${
                              isRecommended ? 'ring-1 ring-primary-container' : ''
                            }`}
                            style={{ height: `${val}%` }}
                          ></div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="flex justify-between pt-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span>00:00 (Midnight)</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00 (Noon)</span>
                  <span>16:00</span>
                  <span className="text-error font-semibold">18:30 (Requested)</span>
                  <span className="text-primary-container font-bold">23:15 (Recommended)</span>
                </div>
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
                  Local wind generation surges after 10 PM across the regional balancing authority, displacing thermal generators and drastically decreasing generation carbon per kilowatt.
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
                  className="px-6 py-2 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity flex items-center gap-space-xs"
                  onClick={handleAccept}
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  <span>Accept Recommendation (+75 FlexCoins)</span>
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
