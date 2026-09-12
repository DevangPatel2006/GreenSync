import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('alex.chen@gridflow-energy.org');
  const [password, setPassword] = useState('DemandResponse2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('alex.chen@gridflow-energy.org');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setAuthErrorMessage(null);
    setShowError(false);

    try {
      await login(email.trim(), password);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      setIsSubmitting(false);
      setShowError(true);
      setAuthErrorMessage(err.message || "That email or password doesn't match our records.");
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setResetSubmitting(true);
    setTimeout(() => {
      setResetSubmitting(false);
      setResetSuccess(true);
    }, 1000);
  };

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-center items-center">
      <main className="w-full flex-1 flex flex-col items-center justify-center p-gutter">
        <div className="flex flex-col w-full max-w-6xl mx-auto px-space-md py-space-xl items-center justify-center relative">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
            {/* Left Column: Vision & Live Proof */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-space-lg pr-0 lg:pr-space-md">
              <div className="space-y-space-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed text-label-sm font-label-sm tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  GRID TELEMETRY ACTIVE • REGION ERCOT-N
                </div>
                <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight">
                  Intelligent energy balancing, simplified.
                </h1>
                <p className="text-body-lg font-body-lg text-on-surface-variant">
                  Sign in to orchestrate your flexible battery storage, scheduled EV charging arrays, and optimize for peak renewable dispatch hours.
                </p>
              </div>

              <div className="bg-surface-container p-space-lg rounded-xl space-y-space-md relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-secondary text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      bolt
                    </span>
                    <span className="text-title-sm font-title-sm text-on-surface">Live Grid Signal</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm">
                    84% Renewable
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-label-sm font-label-sm text-on-surface-variant">
                    <span>Flexible Capacity Dispatched</span>
                    <span className="text-primary font-bold">14.8 MW / 18.0 MW</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden flex gap-0.5">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '78%' }}></div>
                    <div className="h-full bg-secondary-fixed-dim rounded-full" style={{ width: '14%' }}></div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">eco</span> Next zero-carbon window
                  </span>
                  <span className="font-title-sm text-on-surface">14:00 - 17:30 CST</span>
                </div>
              </div>

              <div className="flex items-center space-x-space-md pt-space-xs text-on-surface-variant text-body-sm font-body-sm">
                <div className="flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                  <span>SOC2 Type II</span>
                </div>
                <span className="text-outline-variant">•</span>
                <div className="flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                  <span>256-bit TLS v1.3</span>
                </div>
                <span className="text-outline-variant">•</span>
                <span>Zero-Tracker Telemetry</span>
              </div>
            </div>

            {/* Right Column: Sign In Form */}
            <div className="lg:col-span-7 flex justify-center w-full">
              <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-space-lg sm:p-space-xl relative">
                <div className="flex items-center justify-between mb-space-lg">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        sync_saved_locally
                      </span>
                    </div>
                    <span className="text-headline-sm font-headline-sm text-primary tracking-tight">GreenSync</span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span className="text-label-sm font-label-sm text-secondary uppercase">Node v4.1</span>
                  </div>
                </div>

                <div className="space-y-1 mb-space-lg">
                  <h2 className="text-headline-md font-headline-md text-on-surface">Sign in</h2>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Enter your organization credentials to manage grid flexible demand.
                  </p>
                </div>

                {/* Sandbox / Error Banner */}
                {!showError ? (
                  <div className="mb-space-md p-space-md rounded-lg bg-surface-container-low flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">info</span>
                      <div>
                        <p className="text-title-sm font-title-sm text-on-surface">Interactive Sandbox Active</p>
                        <p className="text-body-sm font-body-sm text-on-surface-variant">
                          Prefilled credentials for enterprise demand operator role.
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-label-sm font-label-sm text-primary hover:underline ml-2 whitespace-nowrap"
                      onClick={() => setShowError(true)}
                      type="button"
                    >
                      Simulate Error
                    </button>
                  </div>
                ) : (
                  <div className="mb-space-md p-space-md rounded-lg bg-error-container text-on-error-container flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2">
                      <span className="material-symbols-outlined text-[20px] text-error">warning</span>
                      <div className="text-body-sm font-body-sm">
                        <span className="font-semibold">Authentication failed:</span> {authErrorMessage || "That email or password doesn't match our records."}
                      </div>
                    </div>
                    <button
                      className="text-label-sm font-label-sm text-on-error-container hover:underline ml-2 whitespace-nowrap"
                      onClick={() => setShowError(false)}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <form className="space-y-space-md" onSubmit={handleSignIn}>
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface" htmlFor="email">
                      Work Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                        alternate_email
                      </span>
                      <input
                        className={`w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border outline-none transition-all shadow-sm focus:border-primary ${
                          fieldErrors.email ? 'border-error' : 'border-surface-variant'
                        }`}
                        id="email"
                        name="email"
                        placeholder="name@organization.com"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                        }}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                        check_circle
                      </span>
                    </div>
                    {fieldErrors.email && (
                      <span className="text-label-sm font-label-sm text-error block mt-1">{fieldErrors.email}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-label-md font-label-md text-on-surface" htmlFor="password">
                        Password
                      </label>
                      <button
                        className="text-title-sm font-title-sm text-primary hover:text-on-primary-container focus:outline-none transition-colors"
                        onClick={() => setModalOpen(true)}
                        type="button"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                        lock
                      </span>
                      <input
                        className={`w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border outline-none transition-all shadow-sm focus:border-primary ${
                          fieldErrors.password ? 'border-error' : 'border-surface-variant'
                        }`}
                        id="password"
                        name="password"
                        placeholder="••••••••••"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                        }}
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface focus:outline-none flex items-center justify-center p-1"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <span className="text-label-sm font-label-sm text-error block mt-1">{fieldErrors.password}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        defaultChecked
                        className="w-4 h-4 rounded text-primary focus:ring-secondary-fixed accent-primary cursor-pointer"
                        type="checkbox"
                      />
                      <span className="text-body-sm font-body-sm text-on-surface-variant select-none">
                        Remember device for 30 days
                      </span>
                    </label>
                  </div>

                  <button
                    className={`w-full h-11 text-on-primary font-title-sm text-title-sm rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-[0.99] ${
                      submitSuccess
                        ? 'bg-secondary text-on-secondary-fixed'
                        : 'bg-primary hover:bg-primary-container'
                    }`}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        <span>Validating session...</span>
                      </>
                    ) : submitSuccess ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        <span>Authenticated • Loading Grid View</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to GreenSync</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-space-lg pt-space-md text-center bg-surface-container-lowest">
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Don't have an enterprise account?
                    <Link to="/sign-up" className="text-primary font-title-sm text-title-sm hover:underline ml-1">
                      Request Platform Access
                    </Link>
                  </p>
                </div>

                <div className="mt-space-md pt-space-sm flex items-center justify-center gap-4 text-label-sm font-label-sm text-outline border-t border-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">shield</span> 256-bit Encrypted
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">gavel</span> Utility Tariff Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FORGOT PASSWORD MODAL */}
          {modalOpen && (
            <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-gutter transition-opacity duration-200">
              <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden p-space-lg sm:p-space-xl border border-surface-variant">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[24px]">key</span>
                  </div>
                  <button
                    aria-label="Close modal"
                    className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors"
                    onClick={() => {
                      setModalOpen(false);
                      setResetSuccess(false);
                    }}
                    type="button"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-1 mb-space-lg">
                  <h3 className="text-headline-sm font-headline-sm text-on-surface">Reset your password</h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Enter your registered operator email and we will issue a secure 6-digit verification pin to reset your access tokens.
                  </p>
                </div>

                {resetSuccess && (
                  <div className="mb-space-md p-space-md rounded-lg bg-secondary-container/50 text-on-secondary-fixed flex items-start space-x-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary">mark_email_read</span>
                    <div className="text-body-sm font-body-sm">
                      <span className="font-semibold">Verification code sent!</span> Check your inbox for security code instructions. Code expires in 15 minutes.
                    </div>
                  </div>
                )}

                <form className="space-y-space-md" onSubmit={handleResetSubmit}>
                  <div className="space-y-1.5">
                    <label className="block text-label-md font-label-md text-on-surface" htmlFor="reset-email">
                      Registered Work Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                        mail
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-4 bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border border-surface-variant outline-none transition-all shadow-sm focus:border-primary"
                        id="reset-email"
                        placeholder="operator@energy-domain.com"
                        required
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      className="w-full h-11 bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                      disabled={resetSubmitting}
                      type="submit"
                    >
                      {resetSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          <span>Dispatching code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset Instructions</span>
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        </>
                      )}
                    </button>
                    <button
                      className="w-full h-10 text-on-surface hover:text-primary font-title-sm text-title-sm rounded-lg hover:bg-surface-container transition-all"
                      onClick={() => {
                        setModalOpen(false);
                        setResetSuccess(false);
                      }}
                      type="button"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>

                <div className="mt-space-lg pt-space-md bg-surface-container-low -mx-space-lg -mb-space-lg sm:-mx-space-xl sm:-mb-space-xl p-space-md flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">verified</span> Direct SAML / SSO Active
                  </span>
                  <a className="text-primary hover:underline font-semibold" href="#">
                    SSO Portal Login
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
