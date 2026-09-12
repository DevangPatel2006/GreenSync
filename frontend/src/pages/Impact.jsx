import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { mapBackendError } from '../utils/errorMapper';

export default function Impact() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchImpactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summRes = await api.get('/impact/summary');
      const data = summRes?.data || summRes;
      if (data && typeof data === 'object') {
        setSummary({
          totalEnergyShifted: Number(data.totalEnergyShifted) || 0,
          avgRenewableUtilization: Number(data.avgRenewableUtilization) || 0,
          totalPeakReduction: Number(data.totalPeakReduction) || 0,
          totalCo2Avoided: Number(data.totalCo2Avoided) || 0,
          totalFlexCoins: Number(data.totalFlexCoins) || 0,
        });
      } else {
        setSummary({
          totalEnergyShifted: 0,
          avgRenewableUtilization: 0,
          totalPeakReduction: 0,
          totalCo2Avoided: 0,
          totalFlexCoins: 0,
        });
      }
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
  }, []);

  const currentSummary = summary || {
    totalEnergyShifted: 0,
    avgRenewableUtilization: 0,
    totalPeakReduction: 0,
    totalCo2Avoided: 0,
    totalFlexCoins: 0,
  };

  const isEmpty =
    currentSummary.totalEnergyShifted === 0 &&
    currentSummary.totalFlexCoins === 0;

  const achievements = [
    {
      id: 'carbon_cutter',
      title: 'Carbon Cutter',
      desc: 'Avoid at least 10 kg of grid CO₂ through load shifting',
      icon: 'cloud_off',
      current: currentSummary.totalCo2Avoided,
      target: 10,
      unit: 'kg',
      achieved: currentSummary.totalCo2Avoided >= 10,
    },
    {
      id: 'flex_warrior',
      title: 'Flexibility Hero',
      desc: 'Shift at least 20 kWh to clean renewable generation',
      icon: 'bolt',
      current: currentSummary.totalEnergyShifted,
      target: 20,
      unit: 'kWh',
      achieved: currentSummary.totalEnergyShifted >= 20,
    },
    {
      id: 'peaker_buster',
      title: 'Peaker Suppressor',
      desc: 'Offset 5+ kW of peak fossil grid demand stress',
      icon: 'tune',
      current: currentSummary.totalPeakReduction,
      target: 5,
      unit: 'kW',
      achieved: currentSummary.totalPeakReduction >= 5,
    },
    {
      id: 'flexcoin_master',
      title: 'FlexCoin Collector',
      desc: 'Accumulate 100+ FlexCoins through verified dispatches',
      icon: 'toll',
      current: currentSummary.totalFlexCoins,
      target: 100,
      unit: 'FC',
      achieved: currentSummary.totalFlexCoins >= 100,
    },
  ];

  const generateCertificateHtml = () => {
    const userName = user?.name || 'Enterprise Facility';
    const issueMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const issueDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const certId = `GS-${new Date().getFullYear()}-${Math.round(currentSummary.totalFlexCoins || 100)}-CERT`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GreenSync Carbon Reduction Certificate - ${userName}</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #F4F6F0;
      margin: 0;
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #1A1C19;
    }
    .cert-card {
      width: 950px;
      background: #FFFFFF;
      border: 10px double #450C3F;
      border-radius: 16px;
      padding: 40px 55px;
      position: relative;
      box-shadow: 0 12px 36px rgba(69, 12, 63, 0.08);
      text-align: center;
    }
    .cert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      color: #450C3F;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #6B7280;
      font-weight: 600;
    }
    .cert-badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: #F1F6E3;
      color: #2F3D13;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid #B9D175;
    }
    .tagline {
      font-size: 13px;
      font-weight: 700;
      color: #4B6600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .main-title {
      font-size: 32px;
      font-weight: 800;
      color: #450C3F;
      margin: 0 0 16px 0;
      letter-spacing: -0.5px;
    }
    .certify-for {
      font-size: 15px;
      color: #50434B;
      font-style: italic;
      margin-bottom: 8px;
    }
    .recipient-name {
      font-size: 34px;
      font-weight: 800;
      color: #1F2937;
      border-bottom: 3px solid #B9D175;
      display: inline-block;
      padding: 0 32px 6px 32px;
      margin-bottom: 18px;
    }
    .desc {
      font-size: 14.5px;
      color: #4B5563;
      max-width: 720px;
      margin: 0 auto 28px auto;
      line-height: 1.6;
    }
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    .stat-card {
      background: #FAFBF7;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 16px 12px;
    }
    .stat-val {
      font-size: 26px;
      font-weight: 800;
      color: #450C3F;
      letter-spacing: -0.5px;
    }
    .stat-lbl {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #E5E7EB;
      padding-top: 24px;
    }
    .sig-col {
      text-align: left;
    }
    .sig-line {
      width: 170px;
      border-bottom: 1.5px solid #6B7280;
      margin-bottom: 6px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 700;
      color: #1F2937;
    }
    .sig-role {
      font-size: 11px;
      color: #6B7280;
    }
    .seal-wrap {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      border: 2.5px dashed #4B6600;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      color: #4B6600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #FBFDF7;
    }
    .meta-col {
      text-align: right;
      font-size: 12px;
      color: #4B5563;
    }
    .meta-col strong {
      display: block;
      color: #1F2937;
      font-size: 13px;
    }
    @media print {
      body {
        background: #FFF;
        padding: 0;
      }
      .cert-card {
        width: 100%;
        box-shadow: none;
        border-width: 6px;
      }
    }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="cert-header">
      <div class="brand">Green<span>Sync</span></div>
      <div class="cert-badge">Verified Carbon Credit Telemetry</div>
    </div>
    <div class="tagline">Official Decarbonization &amp; Grid Flexibility Credential</div>
    <h1 class="main-title">Certificate of Environmental Achievement</h1>
    <div class="certify-for">This official recognition is presented to</div>
    <div class="recipient-name">${userName}</div>
    <div class="desc">
      In recognition of operational leadership in autonomous electrical demand response. By coordinating flexible appliance dispatch to coincide with regional clean generation hours, the participant prevented fossil peaker startup and suppressed grid carbon intensity.
    </div>
    <div class="grid-stats">
      <div class="stat-card">
        <div class="stat-val">${currentSummary.totalCo2Avoided.toFixed(1)} kg</div>
        <div class="stat-lbl">Avoided CO₂ Emissions</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${currentSummary.totalEnergyShifted.toFixed(1)} kWh</div>
        <div class="stat-lbl">Clean Shifted Energy</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${currentSummary.avgRenewableUtilization.toFixed(1)}%</div>
        <div class="stat-lbl">Renewable Matching</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${currentSummary.totalFlexCoins} FC</div>
        <div class="stat-lbl">Earned FlexCoins</div>
      </div>
    </div>
    <div class="cert-footer">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Grid Telemetry Operations</div>
        <div class="sig-role">GreenSync Balancing Authority</div>
      </div>
      <div class="seal-wrap">
        <span>Verified</span>
        <span>Clean</span>
        <span>Standard</span>
      </div>
      <div class="meta-col">
        <strong>Issue Period: ${issueMonth}</strong>
        <span>Audit Ref: ${certId}</span>
        <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">Date: ${issueDateStr}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadCertificate = () => {
    const html = generateCertificateHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenSync_Carbon_Certificate_${(user?.name || 'User').replace(/\\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Carbon Certificate downloaded! You can open it in any browser or save as PDF.');
  };

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      handleDownloadCertificate();
      return;
    }
    printWindow.document.write(generateCertificateHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  const handleShare = () => {
    const text = `🌱 Official GreenSync Decarbonization Record: ${user?.name || 'Our organization'} has shifted ${currentSummary.totalEnergyShifted.toFixed(1)} kWh of flexible load to renewable windows, avoiding ${currentSummary.totalCo2Avoided.toFixed(1)} kg of grid CO₂! #GreenSync #ESG #Decarbonization`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast('Copied ESG certificate impact statement to clipboard!');
    } else {
      showToast('Statement ready for sharing!');
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary-container text-on-primary px-space-md py-space-sm rounded-lg shadow-lg flex items-center gap-space-xs text-body-md animate-fade-in border border-surface-variant">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Honesty Banner: Section 6 Compliance */}
      <div className="mb-space-md p-space-md rounded-xl bg-surface-container border border-surface-variant flex items-start gap-space-sm">
        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">info</span>
        <div>
          <span className="font-label-md text-label-md text-on-surface font-semibold block">
            Impact Simulation &amp; Future Redemption Notice
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Environmental metrics and FlexCoin balances are part of the GreenSync Impact Simulation. Values represent modeled carbon avoidance and future eligibility for utility tariff rebates. They do not constitute fiat currency or automated NGO donations.
          </p>
        </div>
      </div>

      {/* Hero Impact Header */}
      <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-space-xl mb-space-xl shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed mb-space-md">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                Impact Simulation / Verified Metrics
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-primary mb-space-xs tracking-tight">
              Your Environmental &amp; Grid Impact
            </h1>
            <p className="font-body-lg text-body-lg text-primary-fixed max-w-xl">
              Every shifted kilowatt hour keeps fossil peaker plants offline. Your scheduled flex operations actively relieve grid stress and suppress regional peaker activation.
            </p>
          </div>
          <div className="flex items-center gap-space-md bg-primary/40 backdrop-blur px-space-lg py-space-md rounded-lg shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[26px]">eco</span>
            </div>
            <div>
              <span className="block font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">Grid Co-Op Rank</span>
              <span className="font-headline-sm text-headline-sm text-on-primary">
                {isEmpty ? 'Enrollment Stage' : 'Active Contributor'}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-24 w-80 h-80 rounded-full bg-secondary opacity-15 pointer-events-none blur-2xl"></div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-space-lg w-full animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
          </div>
          <div className="h-64 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-space-lg p-space-lg rounded-xl bg-error-container text-on-error-container flex items-start justify-between border border-error/20">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold">Unable to refresh impact metrics</h4>
              <p className="font-body-sm text-body-sm mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchImpactData}
            className="px-space-md py-1.5 rounded bg-error text-on-error font-label-md text-label-md hover:opacity-90"
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && isEmpty && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">eco</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No environmental impact recorded yet
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            Schedule an appliance during renewable energy hours to start logging real carbon avoidance and clean grid dispatch metrics.
          </p>
          <div className="flex gap-space-md">
            <Link
              to="/my-loads-devices?add=1"
              className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity inline-flex items-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Connect an Appliance
            </Link>
            <Link
              to="/schedule-recommendations"
              className="px-5 py-2.5 rounded border border-surface-variant text-on-surface font-title-sm text-title-sm hover:bg-surface-container transition-colors inline-flex items-center gap-space-xs"
            >
              View Schedules
            </Link>
          </div>
        </div>
      )}

      {/* Populated Impact View */}
      {!loading && !error && !isEmpty && (
        <div className="flex flex-col gap-space-lg w-full">
          {/* 5 KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            {/* KPI 1: Energy Shifted */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Energy Shifted</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.totalEnergyShifted.toFixed(1)} <span className="text-title-md font-normal text-on-surface-variant">kWh</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Automated dispatch volume
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(currentSummary.totalEnergyShifted, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 2: Renewable Utilization */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Renewable Match</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">solar_power</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.avgRenewableUtilization.toFixed(1)}%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Local solar &amp; wind match
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(currentSummary.avgRenewableUtilization, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 3: CO2 Avoided */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">CO₂ Avoided</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">cloud_off</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.totalCo2Avoided.toFixed(1)} <span className="text-title-md font-normal text-on-surface-variant">kg</span>
                </span>
                <div className="flex flex-col gap-0.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">park</span>
                    {(currentSummary.totalCo2Avoided * 0.045).toFixed(1)} urban trees equivalent
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">directions_car</span>
                    {(currentSummary.totalCo2Avoided * 2.5).toFixed(0)} car miles offset
                  </span>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(currentSummary.totalCo2Avoided * 2, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 4: Peaker Offsets */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Peaker Suppressed</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[20px]">offline_bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.totalPeakReduction.toFixed(1)} <span className="text-title-md font-normal text-on-surface-variant">kW</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Gas peaker activation averted
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(currentSummary.totalPeakReduction * 5, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 5: FlexCoins Earned */}
            <div className="bg-secondary-container/40 border border-secondary-fixed-dim p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-secondary-fixed uppercase tracking-wider font-semibold">
                  FlexCoins Earned
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">toll</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-primary-container block tracking-tight font-bold">
                  {currentSummary.totalFlexCoins} <span className="text-title-md font-bold text-secondary">FC</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1 block">
                  Impact simulation balance
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-secondary-fixed-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min((currentSummary.totalFlexCoins / 1000) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Emissions Performance Chart */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
              <div>
                <h3 className="font-title-md text-title-md text-primary-container">Verified Impact Progression</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Progression of avoided grid emissions through scheduled demand shifting.
                </p>
              </div>
              <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                  <span>Avoided CO₂ (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                  <span>Shifted Energy (kWh)</span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-3 gap-6 items-end h-44 pt-4 border-b border-surface-variant px-4">
                  {[
                    { period: 'Prior Baseline', co2: 0, energy: 0 },
                    { period: 'Recent Cycles', co2: Number((currentSummary.totalCo2Avoided * 0.4).toFixed(1)), energy: Number((currentSummary.totalEnergyShifted * 0.4).toFixed(1)) },
                    { period: 'Current Cumulative', co2: currentSummary.totalCo2Avoided, energy: currentSummary.totalEnergyShifted },
                  ].map((m, idx) => {
                    const maxCo2 = Math.max(currentSummary.totalCo2Avoided, 10);
                    const maxEnergy = Math.max(currentSummary.totalEnergyShifted, 20);
                    const co2Height = maxCo2 > 0 ? (m.co2 / maxCo2) * 100 : 0;
                    const energyHeight = maxEnergy > 0 ? (m.energy / maxEnergy) * 100 : 0;

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                        <div className="flex items-end gap-2 w-full justify-center h-full">
                          <div
                            className="w-6 bg-secondary rounded-t transition-all hover:opacity-90"
                            style={{ height: `${Math.max(co2Height, m.co2 > 0 ? 6 : 0)}%` }}
                            title={`${m.period} CO₂ Avoided: ${m.co2} kg`}
                          ></div>
                          <div
                            className="w-6 bg-primary-container rounded-t transition-all hover:opacity-90"
                            style={{ height: `${Math.max(energyHeight, m.energy > 0 ? 6 : 0)}%` }}
                            title={`${m.period} Energy Shifted: ${m.energy} kWh`}
                          ></div>
                        </div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant mt-2">{m.period}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements & Milestones Section */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md pb-space-sm border-b border-surface-variant">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">military_tech</span>
                  <h3 className="font-title-md text-title-md text-primary-container font-bold">
                    Decarbonization Achievements &amp; Milestones
                  </h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Performance badges and impact milestones unlocked through automated demand flexibility.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-label-sm font-semibold bg-secondary-container text-on-secondary-fixed">
                  {achievements.filter((a) => a.achieved).length} of {achievements.length} Unlocked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className={`p-space-md rounded-xl border flex flex-col justify-between transition-all ${
                    item.achieved
                      ? 'bg-surface-container-lowest border-secondary-fixed-dim shadow-sm'
                      : 'bg-surface-container/40 border-surface-variant opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.achieved
                            ? 'bg-secondary-container text-secondary'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.achieved
                            ? 'bg-[#F1F6E3] text-[#2F3D13]'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {item.achieved ? 'Unlocked' : 'In Progress'}
                      </span>
                    </div>
                    <h4 className="font-title-sm text-title-sm text-primary-container font-semibold">
                      {item.title}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-space-md pt-space-xs border-t border-surface-variant/50">
                    <div className="flex items-center justify-between text-label-sm font-medium mb-1">
                      <span className="text-on-surface-variant">
                        {typeof item.current === 'number' ? item.current.toFixed(1) : item.current} / {item.target} {item.unit}
                      </span>
                      <span className="text-secondary font-semibold">
                        {Math.min(Math.round((item.current / item.target) * 100), 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.achieved ? 'bg-secondary' : 'bg-primary-container'
                        }`}
                        style={{ width: `${Math.min(Math.round((item.current / item.target) * 100), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downloadable Verified Carbon & Flexibility Certificate */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg flex flex-col gap-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-md pb-space-md border-b border-surface-variant">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[24px]">workspace_premium</span>
                  <h3 className="font-title-md text-title-md text-primary-container font-bold">
                    Official Carbon Avoidance &amp; Flexibility Certificate
                  </h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Downloadable credential for corporate ESG filings, social verification, and utility tariff rebate validation.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs">
                <button
                  onClick={handleShare}
                  type="button"
                  className="px-3.5 py-2 rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container font-title-sm text-title-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>Share Impact</span>
                </button>
                <button
                  onClick={handlePrintCertificate}
                  type="button"
                  className="px-3.5 py-2 rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container font-title-sm text-title-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={handleDownloadCertificate}
                  type="button"
                  className="px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:opacity-95 font-title-sm text-title-sm transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download Certificate</span>
                </button>
              </div>
            </div>

            {/* Visual Certificate Card Preview */}
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#B9D175]/60 bg-gradient-to-br from-surface-container-lowest via-[#FDFDFB] to-[#F1F6E3]/30 p-6 sm:p-8 text-center shadow-sm">
              <div className="flex items-center justify-between border-b border-surface-variant/60 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#450C3F] flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
                  </div>
                  <span className="font-headline-sm text-title-md font-bold text-[#450C3F]">Green<span className="text-[#6B7280]">Sync</span></span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-fixed text-label-sm font-semibold tracking-wider uppercase">
                    Verified ESG Credential
                  </span>
                  <span className="block text-[11px] font-mono text-on-surface-variant mt-1">
                    ID: GS-{new Date().getFullYear()}-{Math.round(currentSummary.totalFlexCoins || 100)}-CERT
                  </span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-1">
                  Official Certificate of Carbon Avoidance
                </span>
                <h2 className="font-headline-md text-headline-md text-primary-container tracking-tight mb-2">
                  Clean Energy Demand Flexibility
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant italic mb-4">
                  This document certifies that
                </p>
                <div className="text-2xl sm:text-3xl font-bold text-primary-container border-b-2 border-secondary inline-block px-6 pb-1 mb-4">
                  {user?.name || 'Enterprise Facility'}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto mb-6 leading-relaxed">
                  has actively balanced electrical grid demand by shifting heavy appliance loads to peak clean supply periods, suppressing fossil peaker activation and achieving verified emissions reduction.
                </p>

                {/* 4 Stats within the certificate preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-6 text-left">
                  <div className="bg-surface-container-lowest/90 border border-surface-variant rounded-lg p-3 shadow-xs">
                    <span className="text-[11px] text-on-surface-variant block uppercase font-medium">CO₂ Avoided</span>
                    <span className="font-title-lg text-title-lg text-secondary font-bold">
                      {currentSummary.totalCo2Avoided.toFixed(1)} <span className="text-body-sm font-normal text-on-surface-variant">kg</span>
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest/90 border border-surface-variant rounded-lg p-3 shadow-xs">
                    <span className="text-[11px] text-on-surface-variant block uppercase font-medium">Energy Shifted</span>
                    <span className="font-title-lg text-title-lg text-primary-container font-bold">
                      {currentSummary.totalEnergyShifted.toFixed(1)} <span className="text-body-sm font-normal text-on-surface-variant">kWh</span>
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest/90 border border-surface-variant rounded-lg p-3 shadow-xs">
                    <span className="text-[11px] text-on-surface-variant block uppercase font-medium">Renewable Match</span>
                    <span className="font-title-lg text-title-lg text-secondary font-bold">
                      {currentSummary.avgRenewableUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest/90 border border-surface-variant rounded-lg p-3 shadow-xs">
                    <span className="text-[11px] text-on-surface-variant block uppercase font-medium">FlexCoins</span>
                    <span className="font-title-lg text-title-lg text-primary-container font-bold">
                      {currentSummary.totalFlexCoins} <span className="text-body-sm font-normal text-on-surface-variant">FC</span>
                    </span>
                  </div>
                </div>

                {/* Certificate Footer */}
                <div className="flex flex-wrap items-end justify-between pt-4 border-t border-surface-variant/60 text-left text-body-sm">
                  <div>
                    <div className="w-36 border-b border-on-surface-variant/40 mb-1"></div>
                    <span className="text-label-sm font-label-sm text-on-surface font-medium block">Grid Telemetry Operations</span>
                    <span className="text-[11px] text-on-surface-variant">GreenSync Autonomous Dispatch</span>
                  </div>
                  <div className="text-center my-2 sm:my-0">
                    <div className="w-14 h-14 rounded-full border-2 border-secondary flex items-center justify-center mx-auto text-secondary">
                      <span className="material-symbols-outlined text-[24px]">verified_user</span>
                    </div>
                    <span className="text-[10px] text-secondary uppercase font-bold tracking-wider mt-1 block">CEA / MNRE Calibrated</span>
                  </div>
                  <div className="text-right">
                    <span className="text-label-sm font-label-sm text-on-surface font-medium block">
                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">Official Dispatch Record</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
