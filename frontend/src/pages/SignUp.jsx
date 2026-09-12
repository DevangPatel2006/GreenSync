import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('residential');
  const [fullName, setFullName] = useState('Devang Patel');
  const [email, setEmail] = useState('devang.patel@greensync.energy');
  const [password, setPassword] = useState('GreenFlex2025!');
  const [confirmPassword, setConfirmPassword] = useState('GreenFlex2025!');
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid work email format.';
    }
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      if (err.isNetworkError) {
        setErrorMessage("We couldn't reach GreenSync. Check your connection and try again.");
      } else if (err.status >= 500) {
        setErrorMessage("Something went wrong on our end. Please try again in a moment.");
      } else {
        setErrorMessage(err.message || "Registration failed. Please check your information and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-center items-center">
      <main className="w-full flex-1 flex flex-col items-center justify-center p-gutter">
        <div className="flex flex-col w-full max-w-7xl mx-auto py-space-md lg:py-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-start">
            {/* Left Column: Vision, Perks & Live Telemetry Proof */}
            <div className="lg:col-span-5 flex flex-col gap-space-lg lg:sticky lg:top-8">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-space-xs self-start px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bolt
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Demand Flexibility Network</span>
              </div>

              {/* Main Headline */}
              <div className="flex flex-col gap-space-xs">
                <h1 className="font-display text-display text-primary tracking-tight leading-none">
                  Join the clean energy flexibility movement.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Orchestrate domestic smart loads with regional grid pulses. Turn daily consumption into automated climate action.
                </p>
              </div>

              {/* Verified Grid Visual Micro-Card */}
              <div className="bg-surface-container p-space-lg rounded-xl flex flex-col gap-space-md shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">
                      CAISO ISO Dispatch Signal
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary bg-surface px-2 py-0.5 rounded font-semibold">
                    Clean Peak Active
                  </span>
                </div>

                {/* Telemetry Data Line Chart */}
                <div className="w-full h-20 relative flex items-end">
                  <svg className="w-full h-full text-secondary-container" fill="none" preserveAspectRatio="none" viewBox="0 0 320 70">
                    <path d="M0,55 Q40,58 70,38 T140,42 T210,12 T260,25 T320,8 L320,70 L0,70 Z" fill="currentColor" fillOpacity="0.35" />
                    <path d="M0,55 Q40,58 70,38 T140,42 T210,12 T260,25 T320,8" fill="none" stroke="#526615" strokeLinecap="round" strokeWidth="2.5" />
                  </svg>
                  <div className="absolute right-2 top-1 bg-surface shadow-sm rounded px-2 py-1 text-right">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">Optimal Window</div>
                    <div className="font-title-sm text-title-sm text-primary">13:00 – 16:30 PST</div>
                  </div>
                </div>
              </div>

              {/* Value Props Stack */}
              <div className="flex flex-col gap-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
                    <span className="material-symbols-outlined text-lg">touch_app</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface">Shift energy in 1-click</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Seamless device automation redirects home consumption when fossil peaker plants fire up.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center shrink-0 text-on-secondary-container">
                    <span className="material-symbols-outlined text-lg">eco</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface">Earn FlexCoins for every shifted kWh</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Accrue simulated impact units and unlock real utility rebates through certified clean shifts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
                    <span className="material-symbols-outlined text-lg">shield_with_heart</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface">Bolster neighborhood grid reliability</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Prevent localized brownouts during heatwaves and sub-zero cold fronts through collective resilience.
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm shadow-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-title-sm font-bold shadow-sm">
                    ER
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-title-sm text-title-sm text-on-surface">Elena Rostova</span>
                      <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Grid Dispatcher &amp; Solar Host • Austin, TX</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface italic">
                  “GreenSync turned our thermal water heater and EV into an autonomous virtual battery. We shed 14.8 kWh during last month’s alert without noticing a single comfort compromise.”
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-semibold">
                    +420 FlexCoins Earned
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">32.4 kg CO₂ prevented</span>
                </div>
              </div>
            </div>

            {/* Right Column: Registration Form Container */}
            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest rounded-xl shadow-xl p-space-lg lg:p-space-xl border border-surface-variant">
                <div className="flex items-center justify-between pb-space-md border-b border-surface-variant mb-space-lg">
                  <Link to="/" className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-secondary-fixed"></div>
                    </div>
                    <div className="flex items-baseline">
                      <span className="font-headline-sm text-headline-sm text-primary-container tracking-tight">Green</span>
                      <span className="font-headline-sm text-headline-sm text-secondary tracking-tight">Sync</span>
                    </div>
                  </Link>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Step 1 of 2: Create Account</span>
                </div>

                <div className="space-y-1 mb-space-lg">
                  <h2 className="text-headline-md font-headline-md text-primary-container">Create your GreenSync account</h2>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Start automating your flexible household or facility energy demand.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-space-md p-space-md rounded-lg bg-error-container text-on-error-container flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2">
                      <span className="material-symbols-outlined text-[20px] text-error">warning</span>
                      <div className="text-body-sm font-body-sm">{errorMessage}</div>
                    </div>
                    <button
                      className="text-label-sm font-label-sm text-on-error-container hover:underline ml-2 whitespace-nowrap"
                      onClick={() => setErrorMessage(null)}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <form className="space-y-space-md" onSubmit={handleSubmit}>
                  {/* Account Role Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface">Account Type</label>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <button
                        type="button"
                        className={`p-space-sm rounded-lg border text-left flex items-start gap-2 transition-all ${
                          role === 'residential'
                            ? 'border-primary-container bg-primary-container/5 ring-1 ring-primary-container'
                            : 'border-surface-variant hover:bg-surface-container'
                        }`}
                        onClick={() => setRole('residential')}
                      >
                        <span className="material-symbols-outlined text-primary-container text-[20px] mt-0.5">home</span>
                        <div>
                          <span className="font-title-sm text-title-sm text-on-surface block">Residential Prosumer</span>
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Home EV, Heat Pump, Solar</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`p-space-sm rounded-lg border text-left flex items-start gap-2 transition-all ${
                          role === 'commercial'
                            ? 'border-primary-container bg-primary-container/5 ring-1 ring-primary-container'
                            : 'border-surface-variant hover:bg-surface-container'
                        }`}
                        onClick={() => setRole('commercial')}
                      >
                        <span className="material-symbols-outlined text-primary-container text-[20px] mt-0.5">apartment</span>
                        <div>
                          <span className="font-title-sm text-title-sm text-on-surface block">Commercial &amp; Fleet</span>
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Multi-depot, Enterprise Facility</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface" htmlFor="fullName">
                      Full Name
                    </label>
                    <input
                      className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border border-surface-variant outline-none transition-all focus:border-primary"
                      id="fullName"
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: null });
                      }}
                    />
                    {fieldErrors.fullName && (
                      <span className="text-label-sm font-label-sm text-error block">{fieldErrors.fullName}</span>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface" htmlFor="signup-email">
                      Email Address
                    </label>
                    <input
                      className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border border-surface-variant outline-none transition-all focus:border-primary"
                      id="signup-email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                      }}
                    />
                    {fieldErrors.email && (
                      <span className="text-label-sm font-label-sm text-error block">{fieldErrors.email}</span>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface" htmlFor="signup-password">
                      Password
                    </label>
                    <input
                      className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border border-surface-variant outline-none transition-all focus:border-primary"
                      id="signup-password"
                      placeholder="At least 8 characters"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                      }}
                    />
                    {fieldErrors.password && (
                      <span className="text-label-sm font-label-sm text-error block">{fieldErrors.password}</span>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface" htmlFor="confirm-password">
                      Confirm Password
                    </label>
                    <input
                      className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border border-surface-variant outline-none transition-all focus:border-primary"
                      id="confirm-password"
                      placeholder="Repeat password"
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                      }}
                    />
                    {fieldErrors.confirmPassword && (
                      <span className="text-label-sm font-label-sm text-error block">{fieldErrors.confirmPassword}</span>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      className="w-full h-11 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Free Account &amp; Connect Device</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-space-lg pt-space-md text-center border-t border-surface-variant">
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Already registered with an active node?
                    <Link to="/sign-in" className="text-primary font-title-sm text-title-sm hover:underline ml-1">
                      Sign In to Console
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
