import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [currentAppliance, setCurrentAppliance] = useState('ev');
  const [kwh, setKwh] = useState(48);
  const [activeSection, setActiveSection] = useState('overview');

  const applianceData = {
    ev: { baseMultiplier: 1.56, name: 'EV Fleet', min: 10, max: 80, def: 48, icon: 'directions_car' },
    heat: { baseMultiplier: 0.95, name: 'Heat Pump', min: 4, max: 25, def: 12, icon: 'heat_pump' },
    washer: { baseMultiplier: 0.45, name: 'Smart Laundry', min: 2, max: 8, def: 4, icon: 'local_laundry_service' },
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'simulator', label: 'Load Simulator', icon: 'tune' },
    { id: 'how-it-works', label: 'How It Works', icon: 'schema' },
    { id: 'benefits', label: 'Grid Benefits', icon: 'insights' },
    { id: 'flexcoins', label: 'FlexCoins & Community', icon: 'toll' },
  ];

  const handleApplianceChange = (type) => {
    setCurrentAppliance(type);
    setKwh(applianceData[type].def);
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // IntersectionObserver to update active navigation tab based on scroll position
  useEffect(() => {
    const sectionElements = navItems.map((item) => document.getElementById(item.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -40% 0px' }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const currentConfig = applianceData[currentAppliance];
  const coins = Math.round(kwh * currentConfig.baseMultiplier);
  const co2 = (kwh * 0.402).toFixed(1);

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased scroll-smooth">
      {/* Fixed Top Header Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-b border-surface-variant z-50">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-gutter flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" onClick={() => scrollTo('overview')} className="flex items-center gap-2.5 focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-[#450C3F] flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L4 14H11L9 22L20 10H13L15 2H13Z" fill="#B9D175" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#450C3F]">
              Green<span className="text-[#6B7280] font-semibold">Sync</span>
            </span>
          </Link>

          {/* Section Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-variant/70">
            {navItems.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-medium transition-all cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="font-title-sm text-title-sm text-on-surface hover:text-primary-container px-3 py-1.5 rounded transition-colors hidden sm:inline-block"
              to="/sign-in"
            >
              Sign In
            </Link>
            <Link
              className="font-title-sm text-title-sm bg-primary-container text-on-primary hover:opacity-95 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              to="/dashboard"
            >
              <span>Launch App</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1: OVERVIEW (HERO)
         ========================================================================= */}
      <section
        id="overview"
        className="pt-28 pb-16 px-4 sm:px-gutter max-w-7xl mx-auto w-full scroll-mt-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Story & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-semibold">LIVE ISO TELEMETRY: CLEAN WIND &amp; SOLAR ACTIVE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-container tracking-tight mb-4 leading-tight">
              Find a better time to use electricity.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-6 leading-relaxed">
              Shift heavy home power loads—electric vehicles, heat pumps, and water heaters—to when renewable energy is surging. Cut grid stress, suppress peaker emissions, and earn verified FlexCoins.
            </p>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-6">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center font-title-sm text-title-sm bg-primary-container text-on-primary hover:opacity-95 px-6 py-3 rounded-lg shadow-sm transition-all text-center font-semibold"
              >
                Start Syncing for Free
              </Link>
              <button
                type="button"
                onClick={() => scrollTo('simulator')}
                className="inline-flex items-center justify-center gap-2 font-title-sm text-title-sm bg-surface-container text-on-surface hover:bg-surface-container-high px-5 py-3 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
                <span>Try Load Simulator</span>
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 font-title-sm text-title-sm text-on-surface-variant hover:text-primary-container px-4 py-3 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span>Live Grid Telemetry</span>
              </Link>
            </div>

            {/* Live Status Banner */}
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-variant shadow-xs">
              <span className="material-symbols-outlined text-secondary text-[22px]">energy_savings_leaf</span>
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Grid Status:</span>
                <span className="font-label-md text-label-md text-secondary font-bold">78% Clean Energy Available Right Now</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-surface-variant mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm text-primary-container font-bold block">
                      Automated Load Shifter
                    </span>
                    <span className="text-[12px] text-on-surface-variant">Regional Grid Node • Calibrated</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F1F6E3] text-[#2F3D13] border border-secondary-fixed-dim text-label-sm font-semibold">
                  Optimal Window
                </span>
              </div>

              <div className="space-y-4 mb-5">
                <div className="p-3.5 rounded-xl bg-surface-container/60 flex items-center justify-between border border-surface-variant/40">
                  <div>
                    <span className="text-[11px] text-on-surface-variant uppercase font-medium block">Active Dispatch Appliance</span>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold">Tesla Model 3 • Level 2 Charger</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">24 kWh</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant/40">
                    <span className="text-[11px] text-on-surface-variant uppercase font-medium block">Optimal Window</span>
                    <span className="font-title-sm text-title-sm text-primary-container font-bold">11:15 PM – 4:00 AM</span>
                    <span className="text-[11px] text-secondary font-medium block mt-0.5">Surplus Wind Surge</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant/40">
                    <span className="text-[11px] text-on-surface-variant uppercase font-medium block">Emissions Avoided</span>
                    <span className="font-title-sm text-title-sm text-secondary font-bold">9.6 kg CO₂</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">+84 FlexCoins</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-variant flex items-center justify-between text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                  Zero comfort compromise
                </span>
                <button
                  type="button"
                  onClick={() => scrollTo('simulator')}
                  className="text-secondary font-title-sm hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Simulate my device</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: LOAD SIMULATOR
         ========================================================================= */}
      <section
        id="simulator"
        className="py-16 sm:py-20 px-4 sm:px-gutter max-w-7xl mx-auto w-full scroll-mt-20 border-t border-surface-variant/40"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Context */}
          <div className="lg:col-span-5 flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold block mb-1">
              Interactive Dispatch Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight mb-3">
              See what happens when you shift your load.
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-5 leading-relaxed">
              Peak evening demand forces utilities to fire up dirty natural gas and diesel peaker plants. Shifting just a few kilowatt-hours to high-renewable periods prevents peaker starts and earns verified rewards.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                <div>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Continuous Diurnal Curves</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Calibrated against national grid telemetry and daily solar irradiance peaks.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                <div>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Realistic Load Sizing</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Configure EV batteries, hybrid heat pumps, or smart dishwashers.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/sign-up"
                className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-title-sm hover:opacity-95 transition-opacity font-semibold shadow-xs"
              >
                Connect Real Device
              </Link>
              <button
                type="button"
                onClick={() => scrollTo('how-it-works')}
                className="px-4 py-2.5 rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container font-title-sm transition-colors cursor-pointer"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Right Column: Simulator Tool */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-surface-variant mb-4">
                <div>
                  <span className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block">
                    Interactive Calculator
                  </span>
                  <h3 className="font-title-lg text-title-lg text-primary-container font-bold">Shift Load Simulator</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-semibold">
                  Real-time Node Model
                </span>
              </div>

              {/* Appliance Selector */}
              <div className="mb-4">
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2 font-medium">
                  Select Appliance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(applianceData).map((type) => {
                    const app = applianceData[type];
                    return (
                      <button
                        key={type}
                        className={`py-2.5 px-3 text-center rounded-xl font-title-sm text-title-sm transition-all flex flex-col items-center gap-1 cursor-pointer border ${
                          currentAppliance === type
                            ? 'bg-primary-container text-on-primary border-primary-container shadow-xs font-semibold'
                            : 'bg-surface-container text-on-surface border-transparent hover:bg-surface-container-high'
                        }`}
                        onClick={() => handleApplianceChange(type)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[22px]">{app.icon}</span>
                        <span>{app.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider */}
              <div className="mb-4 bg-surface-container-low p-3.5 rounded-xl border border-surface-variant/40">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium" htmlFor="energy-slider">
                    Energy Payload
                  </label>
                  <span className="font-title-md text-title-md text-primary-container font-extrabold">
                    {kwh} kWh
                  </span>
                </div>
                <input
                  className="w-full accent-primary-container cursor-pointer h-2 bg-surface-container-high rounded-lg appearance-none"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Usual Peak */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-error/20 flex flex-col justify-between">
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-error font-bold uppercase block">Usual Peak Time</span>
                      <div className="font-title-sm text-title-sm text-on-surface font-semibold">6:30 PM • High Carbon</div>
                    </div>
                  </div>
                  <span className="text-[12px] text-on-surface-variant block">Fossil peaker startup triggered</span>
                  <span className="text-label-sm font-bold text-error mt-2">0 FlexCoins</span>
                </div>

                {/* Recommended Shift */}
                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-secondary-fixed-dim flex flex-col justify-between">
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">eco</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-secondary font-bold uppercase block">Recommended Shift</span>
                      <div className="font-title-sm text-title-sm text-on-surface font-semibold">11:15 PM • Clean Surge</div>
                    </div>
                  </div>
                  <span className="text-[12px] text-on-surface-variant block">Surplus wind &amp; solar alignment</span>
                  <span className="text-title-md font-extrabold text-primary-container mt-1">+{coins} FlexCoins</span>
                </div>
              </div>

              {/* Impact Metrics Bar */}
              <div className="grid grid-cols-2 gap-3 text-center pt-1 border-t border-surface-variant">
                <div className="p-2.5 rounded-xl bg-surface-container">
                  <span className="text-[11px] text-on-surface-variant uppercase font-medium block">CO₂ Cut Equivalent</span>
                  <span className="font-title-lg text-title-lg text-primary-container font-extrabold">{co2} kg</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container">
                  <span className="text-[11px] text-on-surface-variant uppercase font-medium block">Grid Stress Offset</span>
                  <span className="font-title-lg text-title-lg text-secondary font-extrabold">-84% Peak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS
         ========================================================================= */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20 px-4 sm:px-gutter max-w-7xl mx-auto w-full scroll-mt-20 border-t border-surface-variant/40"
      >
        <div className="flex flex-col justify-center w-full">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold block mb-1">
              Simple Shift Mechanism
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight">
              How Demand Flexibility Works
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Transform heavy household electrical cycles into synchronized decarbonization events without giving up comfort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Step 1 */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                    01
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[30px]">electrical_services</span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold mb-2">
                  Connect your flexible appliances
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4 leading-relaxed">
                  Pair your electric vehicle charger, heat pump, or smart appliances with one click. Specify your deadline and energy needs.
                </p>
              </div>
              <div className="pt-3.5 bg-surface-container-low/70 -mx-6 -mb-6 px-6 pb-4 rounded-b-2xl flex items-center gap-2 border-t border-surface-variant/40">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                <span className="text-[12px] text-on-surface-variant font-medium">
                  Compatible with Tesla, ChargePoint, ecobee &amp; plugs
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                    02
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[30px]">schedule</span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold mb-2">
                  Get an optimal dispatch window
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4 leading-relaxed">
                  Our scheduling algorithm checks 24-hour renewable forecasts and automatically plans dispatches during peak clean energy supply.
                </p>
              </div>
              <div className="pt-3.5 bg-surface-container-low/70 -mx-6 -mb-6 px-6 pb-4 rounded-b-2xl flex items-center gap-2 border-t border-surface-variant/40">
                <span className="material-symbols-outlined text-secondary text-[18px]">bolt</span>
                <span className="text-[12px] text-on-surface-variant font-medium">
                  Fully automated with 1-click override anytime
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                    03
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[30px]">rewarded_ads</span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold mb-2">
                  Earn FlexCoins &amp; official certificates
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4 leading-relaxed">
                  Watch real carbon savings accumulate. Earn FlexCoins and download official verified ESG certificates for personal or corporate impact.
                </p>
              </div>
              <div className="pt-3.5 bg-surface-container-low/70 -mx-6 -mb-6 px-6 pb-4 rounded-b-2xl flex items-center gap-2 border-t border-surface-variant/40">
                <span className="material-symbols-outlined text-secondary text-[18px]">workspace_premium</span>
                <span className="text-[12px] text-on-surface-variant font-medium">
                  ISO-calibrated marginal emissions ledger
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => scrollTo('benefits')}
              className="inline-flex items-center gap-2 font-title-sm text-title-sm bg-primary-container text-on-primary hover:opacity-95 px-6 py-3 rounded-lg shadow-sm transition-all font-semibold cursor-pointer"
            >
              <span>Explore Grid Benefits</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: GRID BENEFITS & CURVE
         ========================================================================= */}
      <section
        id="benefits"
        className="py-16 sm:py-20 px-4 sm:px-gutter max-w-7xl mx-auto w-full scroll-mt-20 border-t border-surface-variant/40"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Collective Metrics */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold block mb-1">
                Audited Collective Metrics
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight">
                Concrete relief for regional power grids.
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Instead of activating expensive fossil peaker plants that run for only 50 hours a year, GreenSync coordinates smart devices into virtual battery storage.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-on-surface-variant block uppercase font-medium">Flexible Energy Shifted</span>
                  <span className="font-headline-md text-headline-md text-primary-container font-extrabold">142,000+ kWh</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">sync_alt</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-on-surface-variant block uppercase font-medium">Avoided Peaker Emissions</span>
                  <span className="font-headline-md text-headline-md text-secondary font-extrabold">84.2 Metric Tons</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">cloud_off</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-on-surface-variant block uppercase font-medium">Schedule Adoption Rate</span>
                  <span className="font-headline-md text-headline-md text-primary-container font-extrabold">98.4%</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">thumb_up</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Real-time Visual Curve Chart */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-title-md text-title-md text-primary-container font-bold">
                    Regional Carbon Intensity Dispatch Curve
                  </h3>
                  <p className="text-[12px] text-on-surface-variant">
                    Daily generation mix versus demand flexibility window
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-semibold self-start">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span> Optimal Window
                </span>
              </div>

              {/* SVG Chart */}
              <div className="w-full bg-surface-container-low rounded-xl p-4 mb-4 overflow-hidden border border-surface-variant/40">
                <svg className="w-full h-44 text-on-surface" preserveAspectRatio="none" viewBox="0 0 600 200">
                  <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.08" x1="0" x2="600" y1="40" y2="40" />
                  <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.08" x1="0" x2="600" y1="90" y2="90" />
                  <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.08" x1="0" x2="600" y1="140" y2="140" />

                  {/* Optimal Window Highlight */}
                  <rect fill="#B9D175" fillOpacity="0.25" height="170" rx="6" width="180" x="360" y="10" />
                  <text className="font-label-sm" fill="#4B6600" fontSize="11" fontWeight="700" x="370" y="32">
                    OPTIMAL WIND SURGE
                  </text>

                  {/* Carbon Curve */}
                  <path d="M 0 130 Q 150 150, 240 70 T 360 40 T 480 150 T 600 120" fill="none" stroke="#450C3F" strokeWidth="3.5" />
                  {/* Clean Generation Curve */}
                  <path d="M 0 160 Q 150 130, 250 160 T 380 50 T 490 60 T 600 160" fill="none" stroke="#4B6600" strokeDasharray="6 4" strokeWidth="3" />

                  {/* Markers */}
                  <circle cx="270" cy="52" fill="#BA1A1A" r="5" />
                  <text fill="#BA1A1A" fontSize="10" fontWeight="700" x="250" y="40">DIRTY PEAK</text>
                  <circle cx="430" cy="55" fill="#4B6600" r="5" />
                  <text fill="#4B6600" fontSize="10" fontWeight="700" x="410" y="80">SYNC WINDOW</text>
                </svg>
                <div className="flex justify-between items-center text-[11px] font-medium text-on-surface-variant pt-2">
                  <span>12:00 PM</span>
                  <span>3:00 PM</span>
                  <span className="text-error font-semibold">6:00 PM (Grid Stress)</span>
                  <span>9:00 PM</span>
                  <span className="text-secondary font-bold">11:00 PM (Wind Peak)</span>
                  <span>4:00 AM</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface block font-semibold">Cleaner energy available</span>
                    <span className="text-[12px] text-on-surface-variant">Charge your car when turbines spin faster than grid consumption.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface block font-semibold">Zero lifestyle compromise</span>
                    <span className="text-[12px] text-on-surface-variant">Set your ready-by parameters. Your EV is always 100% charged by 7:00 AM.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: FLEXCOINS & COMMUNITY & FOOTER
         ========================================================================= */}
      <section
        id="flexcoins"
        className="pt-16 sm:pt-20 pb-8 px-4 sm:px-gutter max-w-7xl mx-auto w-full scroll-mt-20 border-t border-surface-variant/40"
      >
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 sm:p-8 shadow-md mb-8">
          <div className="max-w-3xl mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-semibold uppercase tracking-wider mb-2">
              Impact &amp; Reward Concepts
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight mb-2">
              What are FlexCoins?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              FlexCoins quantify your positive energy choices. They represent a verified digital ledger reflecting every kilowatt-hour you successfully steer away from dirty peaker plants.
            </p>
          </div>

          {/* 3 Columns of FlexCoin principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">token</span>
              </div>
              <h3 className="font-title-sm text-title-sm text-primary-container font-bold mb-1">Simulated Scoring</h3>
              <p className="text-[13px] text-on-surface-variant">
                Every avoided carbon kilogram credits FlexCoins based on regional marginal emissions rates.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40">
              <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
              <h3 className="font-title-sm text-title-sm text-primary-container font-bold mb-1">Community Challenges</h3>
              <p className="text-[13px] text-on-surface-variant">
                Pool flexible capacity with neighbors to hit clean energy milestones and unlock badges.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40">
              <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <h3 className="font-title-sm text-title-sm text-primary-container font-bold mb-1">Carbon Verification</h3>
              <p className="text-[13px] text-on-surface-variant">
                Download official monthly carbon certificates for social verification and ESG reporting.
              </p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-6 pt-4 border-t border-surface-variant">
            <h4 className="font-title-sm text-title-sm text-primary-container font-bold mb-3">
              From Our Grid-Conscious Community
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between">
                <p className="font-body-sm text-body-sm text-on-surface italic mb-3">
                  “Setting my EV charger on GreenSync was a 2-minute setup. Knowing that my commute is powered by overnight wind rather than the coal peaker in the valley is deeply satisfying.”
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-label-sm">
                    MT
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold block leading-tight">Marcus Thorne</span>
                    <span className="text-[11px] text-on-surface-variant">Solar &amp; EV • 1,420 FlexCoins</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between">
                <p className="font-body-sm text-body-sm text-on-surface italic mb-3">
                  “Our smart heat pump automatically pre-heats our home 45 minutes before peak hours kick in. The indoor temperature never fluctuates, yet our simulated carbon savings are through the roof.”
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary font-bold flex items-center justify-center text-label-sm">
                    EK
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold block leading-tight">Elena Kostas</span>
                    <span className="text-[11px] text-on-surface-variant">Heat Pump • 2,890 FlexCoins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="bg-primary-container rounded-xl p-5 text-on-primary flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold">Ready to align your home with clean energy?</h3>
              <p className="text-body-sm text-primary-fixed-dim mt-0.5">Free forever for residential households. No extra hardware required.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/sign-up"
                className="px-5 py-2.5 rounded-lg bg-secondary-container text-on-secondary-fixed hover:bg-secondary font-title-sm font-bold shadow transition-all"
              >
                Start Free
              </Link>
              <button
                type="button"
                onClick={() => scrollTo('overview')}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-on-primary font-title-sm transition-colors cursor-pointer"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>

        {/* Clean Footer Bar */}
        <footer className="pt-4 border-t border-surface-variant text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-[12px]">
          <span>© 2026 GreenSync Energy Inc. Transforming demand flexibility.</span>
          <div className="flex items-center gap-4">
            <Link to="/impact" className="hover:text-primary-container transition-colors">Impact Methodology</Link>
            <span>•</span>
            <Link to="/dashboard" className="hover:text-primary-container transition-colors">Grid Telemetry</Link>
            <span>•</span>
            <span className="text-secondary font-semibold">99.98% Node Uptime</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
