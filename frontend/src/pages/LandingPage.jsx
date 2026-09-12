import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [currentAppliance, setCurrentAppliance] = useState('ev');
  const [kwh, setKwh] = useState(48);

  const applianceData = {
    ev: { baseMultiplier: 1.56, name: 'EV Fleet', min: 10, max: 80, def: 48 },
    heat: { baseMultiplier: 0.95, name: 'Heat Pump', min: 4, max: 25, def: 12 },
    washer: { baseMultiplier: 0.45, name: 'Smart Laundry', min: 2, max: 8, def: 4 },
  };

  const handleApplianceChange = (type) => {
    setCurrentAppliance(type);
    setKwh(applianceData[type].def);
  };

  const currentConfig = applianceData[currentAppliance];
  const coins = Math.round(kwh * currentConfig.baseMultiplier);
  const co2 = (kwh * 0.402).toFixed(1);

  return (
    <div className="bg-background font-body-md text-on-surface antialiased">
      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-gutter flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xl">
            <Link to="/" className="flex items-center gap-space-xs focus:outline-none">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-secondary-fixed"></div>
              </div>
              <div className="flex items-baseline">
                <span className="font-headline-sm text-headline-sm text-primary-container tracking-tight">Green</span>
                <span className="font-headline-sm text-headline-sm text-secondary tracking-tight">Sync</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-space-lg">
              <a className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#how-it-works">
                How it Works
              </a>
              <a className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#benefits">
                Benefits
              </a>
              <a className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#flexcoins">
                FlexCoins
              </a>
              <Link className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors" to="/impact">
                Impact
              </Link>
              <Link className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs" to="/dashboard">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse inline-block"></span>
                Grid Live Status
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-space-md">
            <Link className="font-title-sm text-title-sm text-on-surface hover:text-primary-container px-space-md py-space-xs rounded transition-colors" to="/sign-in">
              Sign In
            </Link>
            <Link className="font-title-sm text-title-sm bg-primary-container text-on-primary hover:bg-secondary hover:text-on-secondary px-space-md py-space-xs rounded transition-all shadow-sm" to="/dashboard">
              Launch App
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-16 bg-background min-h-screen">
        <div className="flex flex-col w-full">
          {/* HERO SECTION */}
          <section className="w-full py-space-xl px-gutter max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
              {/* Left Column: Story & CTAs */}
              <div className="lg:col-span-7 flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant text-label-sm font-label-sm mb-space-md shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                  <span>LIVE ISO TELEMETRY: HIGH WIND GENERATION ACTIVE</span>
                </div>
                <h1 className="font-display text-display text-primary-container tracking-tight mb-space-md">
                  Find a better time to use electricity.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-xl">
                  Shift your EV charging, laundry, and heating to when renewable energy is plentiful. Reduce grid stress, cut your carbon footprint, and earn simulated FlexCoins.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md w-full sm:w-auto mb-space-xl">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center font-title-sm text-title-sm bg-primary-container text-on-primary hover:bg-primary px-space-lg py-3 rounded shadow-sm transition-colors text-center"
                  >
                    Start Syncing for Free
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 font-title-sm text-title-sm bg-surface-container text-on-surface hover:bg-surface-container-high px-space-lg py-3 rounded shadow-sm transition-colors text-center"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-ping"></span>
                    <span>View Live Grid Status</span>
                  </Link>
                </div>
                <div className="inline-flex items-center gap-3 px-space-md py-2.5 rounded bg-surface-container-low shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    bolt
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Grid Status:</span>
                  <span className="font-label-md text-label-md text-secondary font-bold">78% Clean Energy Available Right Now</span>
                </div>
              </div>

              {/* Right Column: Interactive Demand-Flexibility Simulation */}
              <div className="lg:col-span-5 w-full">
                <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg">
                  <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low/50 -mx-space-lg -mt-space-lg px-space-lg pt-space-lg rounded-t-xl">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">
                        Interactive Dispatch Tool
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-primary-container">Shift Load Simulator</h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed text-label-sm font-label-sm font-bold">
                      Real-time Node
                    </span>
                  </div>

                  {/* Appliance Selector */}
                  <div className="mb-space-md">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">
                      Select Appliance
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className={`py-2 px-2 text-center rounded font-title-sm text-title-sm transition-colors flex flex-col items-center gap-1 ${
                          currentAppliance === 'ev'
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        }`}
                        onClick={() => handleApplianceChange('ev')}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">directions_car</span>
                        <span>EV Fleet</span>
                      </button>
                      <button
                        className={`py-2 px-2 text-center rounded font-title-sm text-title-sm transition-colors flex flex-col items-center gap-1 ${
                          currentAppliance === 'heat'
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        }`}
                        onClick={() => handleApplianceChange('heat')}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">heat_pump</span>
                        <span>Heat Pump</span>
                      </button>
                      <button
                        className={`py-2 px-2 text-center rounded font-title-sm text-title-sm transition-colors flex flex-col items-center gap-1 ${
                          currentAppliance === 'washer'
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        }`}
                        onClick={() => handleApplianceChange('washer')}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">local_laundry_service</span>
                        <span>Laundry</span>
                      </button>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="mb-space-lg">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase" htmlFor="energy-slider">
                        Energy Demand Payload
                      </label>
                      <span className="font-title-sm text-title-sm text-primary-container font-bold">
                        {kwh} kWh
                      </span>
                    </div>
                    <input
                      className="w-full accent-primary-container cursor-pointer h-2 bg-surface-container rounded-lg appearance-none"
                      id="energy-slider"
                      max={currentConfig.max}
                      min={currentConfig.min}
                      step={1}
                      type="range"
                      value={kwh}
                      onChange={(e) => setKwh(parseFloat(e.target.value))}
                    />
                  </div>

                  {/* Schedule Comparison */}
                  <div className="space-y-3 mb-space-lg">
                    {/* Usual Peak */}
                    <div className="p-3.5 rounded bg-surface-container-low flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-error/10 text-error flex items-center justify-center mt-0.5">
                          <span className="material-symbols-outlined text-[18px]">error</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Usual Peak Time</span>
                          <div className="font-title-sm text-title-sm text-on-surface font-semibold">6:30 PM • High Carbon Grid</div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">Fossil peaker plants dispatched</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-sm text-label-sm text-error font-bold">0 Coins</span>
                      </div>
                    </div>

                    {/* Recommended Shift */}
                    <div className="p-3.5 rounded bg-secondary-fixed/20 shadow-sm flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-secondary text-on-secondary flex items-center justify-center mt-0.5">
                          <span className="material-symbols-outlined text-[18px]">eco</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-secondary font-bold block uppercase">Recommended Time</span>
                          <div className="font-title-sm text-title-sm text-on-surface font-semibold">11:15 PM • 92% Wind &amp; Solar</div>
                          <span className="font-body-sm text-body-sm text-secondary">Surplus clean regional generation</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-headline-sm text-headline-sm text-primary-container font-bold">+{coins}</div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">FlexCoins</span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Metrics Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                    <div className="p-2.5 rounded bg-surface-container">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">CO₂ Cut Equivalent</span>
                      <span className="font-title-md text-title-md text-primary-container font-bold">{co2} kg</span>
                    </div>
                    <div className="p-2.5 rounded bg-surface-container">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Grid Stress Mitigation</span>
                      <span className="font-title-md text-title-md text-secondary font-bold">-84% Peak</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS SECTION */}
          <section className="w-full py-space-xl bg-surface-container-low shadow-inner" id="how-it-works">
            <div className="max-w-7xl mx-auto px-gutter">
              <div className="text-center max-w-2xl mx-auto mb-space-xl">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold block mb-1">
                  Simple Shift Mechanism
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary-container">How Demand Flexibility Works</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                  Transform heavy household electrical cycles into synchronized decarbonization events without giving up comfort.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Step 1 */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-space-lg">
                      <span className="w-10 h-10 rounded bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                        01
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[28px]">electrical_services</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-2">
                      Connect your flexible appliances
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                      Pair your electric vehicle charger, heat pump thermostat, or home smart appliances seamlessly using secure cloud connectors.
                    </p>
                  </div>
                  <div className="pt-space-md bg-surface-container-low/60 -mx-space-lg -mb-space-lg px-space-lg pb-space-md rounded-b-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Compatible with Tesla, ChargePoint, ecobee &amp; more
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-space-lg">
                      <span className="w-10 h-10 rounded bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                        02
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[28px]">schedule</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-2">Get a recommended time</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                      Receive smart push notifications when clean wind and solar output surges on your regional ISO, steering usage away from dirty peaker plants.
                    </p>
                  </div>
                  <div className="pt-space-md bg-surface-container-low/60 -mx-space-lg -mb-space-lg px-space-lg pb-space-md rounded-b-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">bolt</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Automated scheduling or manual confirmation
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-space-lg">
                      <span className="w-10 h-10 rounded bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                        03
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[28px]">rewarded_ads</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-2">Earn FlexCoins &amp; track impact</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                      Watch real simulated metrics climb. FlexCoins verify your collective load shifts and unlock verified community badges and partner perks.
                    </p>
                  </div>
                  <div className="pt-space-md bg-surface-container-low/60 -mx-space-lg -mb-space-lg px-space-lg pb-space-md rounded-b-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">bar_chart</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      CO₂ telemetry audited daily against ISO signals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BENEFITS & IMPACT SECTION */}
          <section className="w-full py-space-xl max-w-7xl mx-auto px-gutter" id="benefits">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
              {/* Left: Metrics */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                  Audited Collective Metrics
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">
                  Concrete relief for regional power grids.
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-sm">
                  Instead of building multi-million dollar gas plants that run for only 50 hours a year during peaks, GreenSync organizes thousands of small home adjustments into massive collective clean energy storage.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 mt-2">
                  <div className="p-space-md rounded-lg bg-surface-container shadow-sm flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Flexible Energy Shifted</span>
                      <span className="font-headline-md text-headline-md text-primary-container font-bold">142,000+ kWh</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[32px]">sync_alt</span>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container shadow-sm flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Avoided Peaker Emissions</span>
                      <span className="font-headline-md text-headline-md text-primary-container font-bold">84.2 Metric Tons</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[32px]">cloud_off</span>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container shadow-sm flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Schedule Adoption Rate</span>
                      <span className="font-headline-md text-headline-md text-primary-container font-bold">98.4%</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[32px]">thumb_up</span>
                  </div>
                </div>
              </div>

              {/* Right: Real-time Visual Curve Chart */}
              <div className="lg:col-span-7">
                <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-space-lg">
                    <div>
                      <h3 className="font-title-md text-title-md text-primary-container font-bold">
                        Regional Carbon Intensity Dispatch Curve
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Daily generation mix versus demand flexibility window
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-secondary-fixed/40 text-on-secondary-fixed text-label-sm font-label-sm self-start">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span> Optimal Window Now
                    </span>
                  </div>

                  {/* SVG Chart */}
                  <div className="w-full bg-surface-container-low rounded-lg p-4 mb-space-md overflow-hidden">
                    <svg className="w-full h-48 text-on-surface" preserveAspectRatio="none" viewBox="0 0 600 200">
                      <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.06" x1="0" x2="600" y1="40" y2="40" />
                      <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.06" x1="0" x2="600" y1="90" y2="90" />
                      <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.06" x1="0" x2="600" y1="140" y2="140" />

                      {/* Optimal Window Highlight */}
                      <rect fill="#B8D074" fillOpacity="0.2" height="170" rx="4" width="180" x="360" y="10" />
                      <text className="font-label-sm" fill="#526615" fontSize="11" fontWeight="700" x="370" y="32">
                        OPTIMAL WIND SURGE
                      </text>

                      {/* Carbon Curve */}
                      <path d="M 0 130 Q 150 150, 240 70 T 360 40 T 480 150 T 600 120" fill="none" stroke="#450C3F" strokeWidth="3.5" />
                      {/* Clean Generation Curve */}
                      <path d="M 0 160 Q 150 130, 250 160 T 380 50 T 490 60 T 600 160" fill="none" stroke="#526615" strokeDasharray="6 4" strokeWidth="3" />

                      {/* Markers */}
                      <circle cx="270" cy="52" fill="#BA1A1A" r="5" />
                      <text fill="#BA1A1A" fontSize="10" fontWeight="700" x="250" y="40">DIRTY PEAK</text>
                      <circle cx="430" cy="55" fill="#526615" r="5" />
                      <text fill="#526615" fontSize="10" fontWeight="700" x="410" y="80">SYNC WINDOW</text>
                    </svg>
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant pt-2">
                      <span>12:00 PM</span>
                      <span>3:00 PM</span>
                      <span>6:00 PM (Grid Stress)</span>
                      <span>9:00 PM</span>
                      <span>11:00 PM (Wind Peak)</span>
                      <span>4:00 AM</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                      <div>
                        <span className="font-title-sm text-title-sm text-on-surface block font-semibold">Cleaner energy available</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Charge your car when turbines are spinning faster than the grid can consume.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                      <div>
                        <span className="font-title-sm text-title-sm text-on-surface block font-semibold">Zero lifestyle compromise</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Set your ready-by parameters. Your EV is always 100% charged by 7:00 AM.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FLEXCOIN EXPLAINER SECTION */}
          <section className="w-full py-space-xl bg-surface-container-low shadow-inner" id="flexcoins">
            <div className="max-w-7xl mx-auto px-gutter">
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg lg:p-space-xl">
                <div className="max-w-3xl">
                  <span className="inline-block px-3 py-1 rounded bg-secondary-fixed/50 text-on-secondary-fixed text-label-sm font-label-sm font-bold uppercase tracking-wider mb-space-sm">
                    Impact Simulation
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-primary-container tracking-tight mb-space-md">
                    What are FlexCoins?
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-lg leading-relaxed">
                    FlexCoins gamify and track your positive energy choices without claiming real cash donation. They are a transparent digital ledger reflecting every kilowatt-hour you successfully steer away from dirty peaker plants.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xl">
                  <div className="p-space-md rounded-lg bg-surface-container-low">
                    <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center mb-space-sm">
                      <span className="material-symbols-outlined text-[20px]">token</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-primary-container font-semibold mb-1">Simulated Scoring</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Every avoided carbon kilogram adds FlexCoins to your account based on real-time marginal emissions rates published by your regional ISO.
                    </p>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low">
                    <div className="w-10 h-10 rounded bg-secondary text-on-secondary flex items-center justify-center mb-space-sm">
                      <span className="material-symbols-outlined text-[20px]">group</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-primary-container font-semibold mb-1">Community Challenges</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Pool flexible capacity with your neighborhood to hit collective city targets, triggering verified public badges and partner reward perks.
                    </p>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low">
                    <div className="w-10 h-10 rounded bg-primary text-on-primary flex items-center justify-center mb-space-sm">
                      <span className="material-symbols-outlined text-[20px]">shield</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-primary-container font-semibold mb-1">Zero Speculation</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      FlexCoins are intentionally not a volatile cryptocurrency or financial security. They represent clean energy action verifiable on an immutable ledger.
                    </p>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="pt-space-lg">
                  <h3 className="font-title-md text-title-md text-primary-container font-bold mb-space-md">
                    From Our Grid-Conscious Community
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="p-space-md rounded-lg bg-surface-container flex flex-col justify-between">
                      <p className="font-body-md text-body-md text-on-surface italic mb-space-md">
                        “Setting my EV charger on GreenSync was a 2-minute setup. Knowing that my commute is powered by overnight wind rather than the coal peaker in the valley is deeply satisfying.”
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center font-title-sm text-title-sm">
                          MT
                        </div>
                        <div>
                          <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Marcus Thorne</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Residential Solar &amp; EV • Austin, TX • 1,420 FlexCoins
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-space-md rounded-lg bg-surface-container flex flex-col justify-between">
                      <p className="font-body-md text-body-md text-on-surface italic mb-space-md">
                        “Our smart heat pump automatically pre-heats our home 45 minutes before peak hours kick in. The indoor temperature never fluctuates, yet our simulated carbon savings are through the roof.”
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary font-bold flex items-center justify-center font-title-sm text-title-sm">
                          EK
                        </div>
                        <div>
                          <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Elena Kostas</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Heat Pump Automation • Portland, OR • 2,890 FlexCoins
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM CTA BANNER */}
          <section className="w-full py-space-xl px-gutter max-w-7xl mx-auto">
            <div className="bg-primary-container rounded-xl shadow-xl p-space-lg sm:p-space-xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-space-xl text-on-primary">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-highest/20 text-secondary-fixed text-label-sm font-label-sm font-semibold mb-3">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed"></span> Instant Cloud Integration
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-primary mb-space-sm font-bold tracking-tight">
                  Ready to align your home with clean energy?
                </h2>
                <p className="font-body-lg text-body-lg text-primary-fixed-dim/90 max-w-xl">
                  Join thousands of homes coordinating flexibility. Free forever for residential households. No extra hardware required.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-md w-full md:w-auto shrink-0">
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto font-title-sm text-title-sm bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim px-space-xl py-3 rounded shadow transition-all text-center font-bold"
                >
                  Start Syncing for Free
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto font-title-sm text-title-sm bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-on-primary px-space-lg py-3 rounded transition-colors text-center"
                >
                  Explore Hardware
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.03)] py-space-xl">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl mb-space-xl">
            <div className="space-y-space-md">
              <div className="flex items-center gap-space-xs">
                <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed"></div>
                </div>
                <div className="flex items-baseline">
                  <span className="font-headline-sm text-headline-sm text-primary-container tracking-tight">Green</span>
                  <span className="font-headline-sm text-headline-sm text-secondary tracking-tight">Sync</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Connecting residential and enterprise demand response with live transmission grid signals for real-time decarbonization.
              </p>
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Grid Synced: Live
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-title-sm text-title-sm text-on-surface mb-space-md">Platform</h4>
              <ul className="space-y-space-xs">
                <li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#how-it-works">How It Works</a></li>
                <li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#benefits">Benefits &amp; Rewards</a></li>
                <li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#flexcoins">FlexCoins Ledger</a></li>
                <li className="font-body-sm text-body-sm"><Link className="text-on-surface-variant hover:text-on-surface transition-colors" to="/dashboard">Grid Telemetry</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-title-sm text-title-sm text-on-surface mb-space-md">Resources &amp; Trust</h4>
              <ul className="space-y-space-xs">
                <li className="font-body-sm text-body-sm"><Link className="text-on-surface-variant hover:text-on-surface transition-colors" to="/impact">Impact Methodology</Link></li>
                <li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Privacy Policy</a></li>
                <li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Terms of Service</a></li>
                <li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Data Governance &amp; Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-title-sm text-title-sm text-on-surface mb-space-md">Impact Simulation Disclaimer</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Modeled carbon reductions and FlexCoins reward projections are non-binding estimates based on real-time ISO/RTO telemetry, ambient regional temperatures, and historical grid dispatch profiles. Actual flexibility incentives may vary by utility territory.
              </p>
            </div>
          </div>

          <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-variant">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              © 2025 GreenSync Energy Inc. All rights reserved. Transforming demand flexibility.
            </p>
            <div className="flex items-center gap-space-lg">
              <span className="font-label-sm text-label-sm text-on-surface-variant">ISO-NE / PJM / CAISO Interfaced</span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">99.98% Grid Node Uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
