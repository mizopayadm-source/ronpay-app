import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Settings, 
  Sparkles, 
  Award, 
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Download,
  Building,
  Smartphone
} from 'lucide-react';
import { Campaign, CreatorProfile, Transaction, BawmCategory, SystemPricingConfig, BawmFeeRule } from '../types';
import { formatDateDDMMYYYY } from '../utils/date';
import { BAWM_CONFIG, DEFAULT_PRICING_CONFIG } from '../data/initialData';
import { 
  Percent, 
  Tag, 
  Calendar, 
  Gift, 
  Sliders, 
  Save, 
  RotateCcw,
  Zap
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  transactions: Transaction[];
  creators: CreatorProfile[];
  pricingConfig: SystemPricingConfig;
  onUpdatePricingConfig: (config: SystemPricingConfig) => void;
  onUpdateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onApproveCampaign: (campaign: Campaign) => void;
  onUpdateCreator: (creator: CreatorProfile) => void;
  onResetData: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  transactions,
  creators,
  pricingConfig,
  onUpdatePricingConfig,
  onUpdateCampaign,
  onDeleteCampaign,
  onApproveCampaign,
  onUpdateCreator,
  onResetData,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUserId, setAdminUserId] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('ronpay2026');
  const [loginError, setLoginError] = useState<string>('');

  // Admin tabs: 'creators' | 'rates' | 'campaigns' | 'finances' | 'gateway'
  const [activeTab, setActiveTab] = useState<'creators' | 'rates' | 'campaigns' | 'finances' | 'gateway'>('rates');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Pricing & Rates state
  const [localPricing, setLocalPricing] = useState<SystemPricingConfig>(pricingConfig || DEFAULT_PRICING_CONFIG);
  const [activePricingCategory, setActivePricingCategory] = useState<BawmCategory>('khawlsak');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [testAmount, setTestAmount] = useState<number>(1000);

  // Selected creator for editing/license/discounts
  const [editingCreator, setEditingCreator] = useState<CreatorProfile | null>(null);
  const [licenseDuration, setLicenseDuration] = useState<number>(365); // days

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (adminUserId.trim().toLowerCase() === 'admin' || adminUserId.trim().toLowerCase() === 'admin@ronpay.mizoram.gov.in') &&
      (adminPassword === 'admin' || adminPassword === 'ronpay2026' || adminPassword === 'ronpay@admin2026')
    ) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('User ID emaw Password a dik lo. (Default: admin / ronpay2026)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUserId('admin');
    setAdminPassword('');
  };

  // Financial Stats
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalPlatformFees = transactions.reduce((acc, t) => acc + (t.platformFee || Math.round(t.amount * 0.01)), 0);
  const onlineCount = transactions.filter(t => t.paymentMethod === 'online').length;
  const cashCount = transactions.filter(t => t.paymentMethod === 'cash').length;

  // Filtered Campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (selectedCategoryFilter !== 'all' && c.category !== selectedCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.mitthiHming && c.mitthiHming.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Grant License to Creator
  const handleGrantLicense = (creator: CreatorProfile, tier: 'basic' | 'pro' | 'apex') => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + licenseDuration);

    const allCategories: BawmCategory[] = ['ralna', 'khawlsak', 'rikrum', 'kumtluang'];
    const updated: CreatorProfile = {
      ...creator,
      isApproved: true,
      isPhoneVerified: true,
      approvedCategories: tier === 'apex' ? allCategories : (tier === 'pro' ? ['ralna', 'khawlsak', 'rikrum'] : ['ralna', 'khawlsak']),
      trialExpiresAt: expiresAt.toISOString(),
    };

    onUpdateCreator(updated);
    alert(`✅ LICENSE GRANTED!\n\nCreator: ${creator.name} (${creator.orgName || 'Individual'})\nTier: ${tier.toUpperCase()}\nValidity: ${formatDateDDMMYYYY(expiresAt.toISOString())}`);
    setEditingCreator(null);
  };

  // Toggle Creator Category Permission
  const handleToggleCategory = (creator: CreatorProfile, cat: BawmCategory) => {
    const exists = creator.approvedCategories.includes(cat);
    const updatedApproved = exists
      ? creator.approvedCategories.filter(c => c !== cat)
      : [...creator.approvedCategories, cat];

    const updated: CreatorProfile = {
      ...creator,
      approvedCategories: updatedApproved,
    };
    onUpdateCreator(updated);
  };

  // Pricing Handlers
  const handleCategoryRuleChange = (cat: BawmCategory, field: keyof BawmFeeRule, value: any) => {
    setLocalPricing(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [cat]: {
          ...prev.categories[cat],
          [field]: value
        }
      }
    }));
  };

  const handleSubscriptionRateChange = (cat: BawmCategory, subField: string, value: number) => {
    setLocalPricing(prev => {
      const currentSub = prev.categories[cat]?.subscriptionRates || {
        monthly: 99,
        quarterly: 249,
        halfYearly: 449,
        yearly: 799,
        customPromoDiscount: 10,
      };
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [cat]: {
            ...prev.categories[cat],
            subscriptionRates: {
              ...currentSub,
              [subField]: value,
            }
          }
        }
      };
    });
  };

  const handleSavePricing = () => {
    const updated: SystemPricingConfig = {
      ...localPricing,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'RonPay Super Admin',
    };
    onUpdatePricingConfig(updated);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  const handleResetPricingDefaults = () => {
    if (confirm('Bawm fee, charges, trial & discounts zawng zawng hi Default State-ah reset i duh tak tak em?')) {
      setLocalPricing(DEFAULT_PRICING_CONFIG);
      onUpdatePricingConfig(DEFAULT_PRICING_CONFIG);
      alert('Rates leh settings zawng zawng default-ah dah let a ni ta.');
    }
  };

  const handleCreatorSpecialPrivileges = (creator: CreatorProfile, discountPct: number, freeService: boolean, trialDays: number) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + trialDays);
    const updated: CreatorProfile = {
      ...creator,
      isApproved: true,
      customDiscountPercent: discountPct,
      isFreeServiceGranted: freeService,
      trialExpiresAt: expiresAt.toISOString(),
      subscriptionExpiresAt: expiresAt.toISOString(),
    };
    onUpdateCreator(updated);
    alert(`✅ Creator Privileges Updated for ${creator.name || 'Creator'}!\n• Discount: ${discountPct}%\n• 100% Free Service: ${freeService ? 'YES (Active)' : 'NO'}\n• Trial Valid Until: ${formatDateDDMMYYYY(expiresAt.toISOString())}`);
  };

  const handleSetCreatorExpiryDays = (creator: CreatorProfile, days: number, planName: 'free_trial' | 'monthly' | 'quarterly' | 'yearly' = 'free_trial') => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const updated: CreatorProfile = {
      ...creator,
      isApproved: true,
      subscriptionPlan: planName,
      isFreeServiceGranted: false,
      trialExpiresAt: expiresAt.toISOString(),
      subscriptionExpiresAt: expiresAt.toISOString(),
    };
    onUpdateCreator(updated);
    alert(`🕒 Creator Trial Expiry Updated!\n• Plan: ${planName}\n• Days remaining: ${days} days\n• Expires On: ${formatDateDDMMYYYY(expiresAt.toISOString())}\n\nCreator Studio-ah 7-Day Warning Alert a lang nghal ang.`);
  };

  const currentCatRule = localPricing.categories[activePricingCategory] || DEFAULT_PRICING_CONFIG.categories[activePricingCategory];

  return (
    <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn text-slate-800">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-5 shadow-2xl border border-indigo-200 relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-md border border-slate-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">RonPay Admin Dashboard</h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium">
                System control, Creator licensing, Campaign moderation & Fee ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOGIN SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4 max-w-md mx-auto w-full my-auto text-xs">
            <div className="text-center space-y-1.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">Admin Authentication Required</h4>
              <p className="text-[11px] text-slate-500">
                Admin User ID leh Password hmangin login rawh le.
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-700 block">Admin User ID *</label>
              <input
                type="text"
                required
                value={adminUserId}
                onChange={(e) => setAdminUserId(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-700 block">Admin Password *</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-black py-3 rounded-xl transition cursor-pointer shadow-md text-xs flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>Login to Admin Control Panel</span>
            </button>

            <p className="text-[10px] text-center text-slate-400 pt-2">
              Default Credentials: <b>admin</b> / <b>ronpay2026</b>
            </p>
          </form>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD BODY */
          <div className="flex flex-col flex-1 overflow-hidden space-y-3 pt-2">
            {/* Top Stat Pills & Navigation Bar */}
            <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-2.5 overflow-x-auto text-xs shrink-0">
              <div className="flex gap-1.5">
                {[
                  { key: 'rates', label: 'Bawm Fee & Rates (Pricing)', icon: Sliders, badge: 'Active' },
                  { key: 'creators', label: `Creators (${creators.length})`, icon: Users },
                  { key: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: FileText },
                  { key: 'finances', label: `Fee & Ledger (₹${(totalPlatformFees).toLocaleString('en-IN')})`, icon: DollarSign },
                  { key: 'gateway', label: 'PhonePe Gateway', icon: Settings },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === tab.key
                          ? 'bg-slate-900 text-amber-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleLogout}
                className="text-[10.5px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer shrink-0"
              >
                Logout
              </button>
            </div>

            {/* TAB 0: BAWM FEE & RATES (PRICING, CHARGES, TRIALS, DISCOUNTS, KHAWLSAK SUBSCRIPTIONS) */}
            {activeTab === 'rates' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                {/* Notification Banner on Save */}
                {saveSuccessNotice && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-2xl flex items-center justify-between animate-fadeIn text-xs font-bold shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Rates, Fee rules, Trial periods & Discounts live save a ni ta!</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">
                      Live Synced
                    </span>
                  </div>
                )}

                {/* Top Pricing Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl border border-indigo-900 shadow-md gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-black text-xs flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5" /> Admin Fee & Pricing Manager
                      </span>
                      <span className="bg-amber-400/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/40 uppercase">
                        Real-Time Control
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 mt-0.5">
                      Bawm tin a Platform Fee, QR Siam man, Trial Period hun, leh Discount set na hmun.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleResetPricingDefaults}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10.5px] border border-slate-700 transition cursor-pointer flex items-center gap-1"
                      title="Reset to default fintech rates"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                    <button
                      onClick={handleSavePricing}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 border border-amber-300 active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" /> Save & Apply Rates
                    </button>
                  </div>
                </div>

                {/* Category Switcher Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(['ralna', 'khawlsak', 'rikrum', 'kumtluang', 'others'] as BawmCategory[]).map(catKey => {
                    const info = BAWM_CONFIG[catKey];
                    const rule = localPricing.categories[catKey] || DEFAULT_PRICING_CONFIG.categories[catKey];
                    const isSelected = activePricingCategory === catKey;

                    return (
                      <button
                        key={catKey}
                        onClick={() => setActivePricingCategory(catKey)}
                        className={`px-3 py-2 rounded-xl text-left transition cursor-pointer border flex-1 min-w-[110px] ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-black text-xs truncate ${isSelected ? 'text-indigo-950' : 'text-slate-700'}`}>
                            {info.name.split(' ')[0]} Bawm
                          </span>
                          {rule.isFreeTrialActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Free Trial Active" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                            {rule.platformFeePercent}% Fee
                          </span>
                          <span className="text-[9.5px] text-slate-400">
                            {rule.qrCreationCharge === 0 ? 'Free QR' : `₹${rule.qrCreationCharge}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ACTIVE CATEGORY PRICING CONFIGURATION FORM */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <span>{BAWM_CONFIG[activePricingCategory].name} Settings</span>
                        <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase">
                          {activePricingCategory}
                        </span>
                      </h4>
                      <p className="text-[10.5px] text-slate-500">{BAWM_CONFIG[activePricingCategory].subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 cursor-pointer bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                        <input
                          type="checkbox"
                          checked={currentCatRule.isFreeTrialActive}
                          onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'isFreeTrialActive', e.target.checked)}
                          className="accent-emerald-600 w-3.5 h-3.5 rounded"
                        />
                        <span className={currentCatRule.isFreeTrialActive ? 'text-emerald-700 font-black' : 'text-slate-500'}>
                          {currentCatRule.isFreeTrialActive ? '🎉 100% Free Service Active' : 'Paid Rates Active'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 3-Column Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Panel 1: Platform Settlement Fee */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs pb-1 border-b border-slate-100">
                        <Percent className="w-3.5 h-3.5 text-indigo-600" />
                        <span>1. Platform (TSP) Fee</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Fee Rate Percentage (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={currentCatRule.platformFeePercent}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'platformFeePercent', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-indigo-600 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Fixed Fee / Transaction (₹)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={currentCatRule.platformFeeFixed}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'platformFeeFixed', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-indigo-600 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                        </div>
                      </div>

                      <p className="text-[9.5px] text-slate-400 leading-tight pt-1">
                        Donor ten online-a an pek laia TSP deduction kal tlang zat tur.
                      </p>
                    </div>

                    {/* Panel 2: QR Siam Man & Charges */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs pb-1 border-b border-slate-100">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>2. QR Code Siam Man</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          QR Creation Charge (₹) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={currentCatRule.qrCreationCharge}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'qrCreationCharge', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-amber-600 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Print & Standee Charge (₹)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={currentCatRule.qrPrintProcessingCharge}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'qrPrintProcessingCharge', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-amber-600 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                        </div>
                      </div>

                      <p className="text-[9.5px] text-slate-400 leading-tight pt-1">
                        ₹0 = Free QR creation for creators. Physical card or setup charge.
                      </p>
                    </div>

                    {/* Panel 3: Trial Period & Discounts */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs pb-1 border-b border-slate-100">
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                        <span>3. Trial & Discount</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Trial Period (Days) *
                        </label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={currentCatRule.trialPeriodDays}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'trialPeriodDays', parseInt(e.target.value) || 30)}
                            className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                          />
                          <div className="flex gap-1 flex-1 overflow-x-auto">
                            {[14, 30, 60, 90, 365].map(days => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => handleCategoryRuleChange(activePricingCategory, 'trialPeriodDays', days)}
                                className={`px-1.5 py-1 rounded text-[9px] font-black border cursor-pointer ${
                                  currentCatRule.trialPeriodDays === days
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {days}d
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block">Discount (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentCatRule.discountPercent}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block">Flat (₹ Off)</label>
                          <input
                            type="number"
                            min="0"
                            value={currentCatRule.discountFlatAmount}
                            onChange={(e) => handleCategoryRuleChange(activePricingCategory, 'discountFlatAmount', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <p className="text-[9.5px] text-slate-400 leading-tight pt-1">
                        Creator trial chhunga discount emaw free service pek zat.
                      </p>
                    </div>
                  </div>

                  {/* KHAWLSAK BAWM SUBSCRIPTION RATES (MONTHLY/QUARTERLY/HALF YEARLY/YEARLY) */}
                  {(activePricingCategory === 'khawlsak' || activePricingCategory === 'kumtluang') && (
                    <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 p-3.5 rounded-xl border border-indigo-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs">
                          <Zap className="w-4 h-4 text-indigo-600" />
                          <span>Khawlsak / Bawm Hman Man: Recurring Subscription Plans & Volume Slabs</span>
                        </div>
                        <span className="text-[9.5px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-300">
                          Period Rates
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-500 block">Monthly Plan</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={currentCatRule.subscriptionRates?.monthly ?? 99}
                              onChange={(e) => handleSubscriptionRateChange(activePricingCategory, 'monthly', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-black text-slate-900 text-xs"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">₹/mo</span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-500 block">Quarterly Plan (3m)</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={currentCatRule.subscriptionRates?.quarterly ?? 249}
                              onChange={(e) => handleSubscriptionRateChange(activePricingCategory, 'quarterly', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-black text-slate-900 text-xs"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">₹/qtr</span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-500 block">Half-Yearly (6m)</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={currentCatRule.subscriptionRates?.halfYearly ?? 449}
                              onChange={(e) => handleSubscriptionRateChange(activePricingCategory, 'halfYearly', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-black text-slate-900 text-xs"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">₹/6m</span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-500 block">Yearly Plan (12m)</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={currentCatRule.subscriptionRates?.yearly ?? 799}
                              onChange={(e) => handleSubscriptionRateChange(activePricingCategory, 'yearly', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-black text-slate-900 text-xs"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">₹/yr</span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Volume Slab Rates Table */}
                      {currentCatRule.volumeSlabs && currentCatRule.volumeSlabs.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                            Volume Tiered Rate Slabs (Transaction zat a zira Rate)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
                            {currentCatRule.volumeSlabs.map((slab, sIdx) => (
                              <div key={sIdx} className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center text-[10.5px]">
                                <span className="font-medium text-slate-700">{slab.label}</span>
                                <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {slab.feePercent}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERACTIVE FEE SIMULATOR / TEST CALCULATOR */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2.5 border border-slate-800 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400 font-black text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Live Fee & Payout Simulator (Test Calculation)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] text-slate-400">Test Amount:</span>
                        <div className="relative">
                          <input
                            type="number"
                            min="10"
                            value={testAmount}
                            onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-black text-xs text-right"
                          />
                          <span className="absolute left-2 top-1 text-slate-400 text-xs">₹</span>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const feePercent = currentCatRule.isFreeTrialActive ? 0 : currentCatRule.platformFeePercent;
                      const fixedFee = currentCatRule.isFreeTrialActive ? 0 : currentCatRule.platformFeeFixed;
                      const calculatedFee = Math.round((testAmount * (feePercent / 100)) + fixedFee);
                      const netPayout = Math.max(0, testAmount - calculatedFee);
                      const baseQRCharge = currentCatRule.qrCreationCharge;
                      const discountedQRCharge = currentCatRule.isFreeTrialActive 
                        ? 0 
                        : Math.max(0, Math.round(baseQRCharge * (1 - currentCatRule.discountPercent / 100) - currentCatRule.discountFlatAmount));

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                            <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Donor Contribution</span>
                            <div className="text-base font-black text-white mt-0.5">₹{testAmount.toLocaleString('en-IN')}</div>
                          </div>

                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                            <span className="text-[9.5px] text-amber-300 uppercase font-bold block">
                              TSP Platform Fee ({feePercent}%)
                            </span>
                            <div className="text-base font-black text-amber-400 mt-0.5">
                              ₹{calculatedFee.toLocaleString('en-IN')}
                              {currentCatRule.isFreeTrialActive && <span className="text-[9px] ml-1 text-emerald-400 font-bold">(Free)</span>}
                            </div>
                          </div>

                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40">
                            <span className="text-[9.5px] text-emerald-300 uppercase font-bold block">Organizer Payout</span>
                            <div className="text-base font-black text-emerald-400 mt-0.5">₹{netPayout.toLocaleString('en-IN')}</div>
                          </div>

                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                            <span className="text-[9.5px] text-slate-400 uppercase font-bold block">QR Setup Charge</span>
                            <div className="text-base font-black text-slate-200 mt-0.5">
                              ₹{discountedQRCharge}
                              {currentCatRule.discountPercent > 0 && !currentCatRule.isFreeTrialActive && (
                                <span className="text-[9.5px] line-through text-slate-500 ml-1">₹{baseQRCharge}</span>
                              )}
                              {currentCatRule.isFreeTrialActive && (
                                <span className="text-[9px] ml-1 text-emerald-400 font-bold">(100% Off)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Save Action at bottom */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSavePricing}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2 border border-slate-700 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Apply {BAWM_CONFIG[activePricingCategory].name} Rates</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: CREATOR LICENSES & USER MANAGEMENT */}
            {activeTab === 'creators' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="flex justify-between items-center bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200">
                  <div>
                    <h4 className="font-black text-indigo-950 text-xs">Creator License, Role Verification & Custom Discounts</h4>
                    <p className="text-[10.5px] text-indigo-700 font-medium">
                      Bawm QR siam theihna tur license pek, phone verify, custom discount leh free service pek theihna
                    </p>
                  </div>
                  <span className="text-xs font-black bg-indigo-600 text-white px-2.5 py-1 rounded-xl shadow-xs">
                    {creators.length} Registered
                  </span>
                </div>

                <div className="space-y-2.5">
                  {creators.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 space-y-2.5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">{c.name || 'Unnamed Creator'}</span>
                            {c.isApproved ? (
                              <span className="text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Licensed Pro
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300">
                                Pending Approval
                              </span>
                            )}
                            {c.isFreeServiceGranted && (
                              <span className="text-[9.5px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-300">
                                🎁 VIP Free Service
                              </span>
                            )}
                            {(c.customDiscountPercent ?? 0) > 0 && (
                              <span className="text-[9.5px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-300">
                                🏷️ {c.customDiscountPercent}% Discount
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {c.designation || 'Member'} • <b className="text-slate-700">{c.orgName || 'Mizo Community Org'}</b>
                          </p>
                          <p className="text-[10.5px] text-slate-400 font-mono">
                            📞 {c.phone || '9862000000'} • License Expires: {c.trialExpiresAt ? formatDateDDMMYYYY(c.trialExpiresAt) : 'Permanent'}
                          </p>
                        </div>

                        {/* License & Discount Action Buttons */}
                        <div className="flex flex-col gap-1 sm:flex-row">
                          <button
                            onClick={() => handleCreatorSpecialPrivileges(c, 100, true, 365)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-[10.5px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Grant 100% Free VIP Service & 1 Year Trial"
                          >
                            <Gift className="w-3 h-3" /> Grant Free VIP
                          </button>
                          <button
                            onClick={() => handleCreatorSpecialPrivileges(c, 50, false, 90)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-[10.5px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Grant 50% Discount & 90 Days Trial"
                          >
                            <Tag className="w-3 h-3" /> 50% Promo
                          </button>
                          <button
                            onClick={() => handleGrantLicense(c, 'apex')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-[10.5px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Award className="w-3 h-3" /> Full Apex License
                          </button>
                        </div>
                      </div>

                      {/* Category Permissions Chips */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-500">Allowed Categories:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {(['ralna', 'khawlsak', 'rikrum', 'kumtluang'] as BawmCategory[]).map(cat => {
                            const isAllowed = c.approvedCategories?.includes(cat);
                            return (
                              <button
                                key={cat}
                                onClick={() => handleToggleCategory(c, cat)}
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer uppercase ${
                                  isAllowed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Trial Expiry & 7-Day Warning Test Simulator */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-1.5 bg-amber-50/50 p-2 rounded-xl border border-amber-200/60">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Test 7-Day Warning Alerts:</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleSetCreatorExpiryDays(c, 3, 'free_trial')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded-lg text-[9.5px] transition cursor-pointer"
                            title="Set trial to expire in 3 days (triggers 7-day warning)"
                          >
                            ⚠️ Set 3 Days Left
                          </button>
                          <button
                            onClick={() => handleSetCreatorExpiryDays(c, 1, 'monthly')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded-lg text-[9.5px] transition cursor-pointer"
                            title="Set plan to expire in 1 day (urgent warning)"
                          >
                            🚨 Set 1 Day Left
                          </button>
                          <button
                            onClick={() => handleSetCreatorExpiryDays(c, -1, 'free_trial')}
                            className="bg-slate-800 hover:bg-slate-900 text-rose-300 font-bold px-2 py-0.5 rounded-lg text-[9.5px] transition cursor-pointer"
                            title="Set trial as Expired"
                          >
                            🚫 Set Expired
                          </button>
                          <button
                            onClick={() => handleSetCreatorExpiryDays(c, 30, 'free_trial')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-0.5 rounded-lg text-[9.5px] transition cursor-pointer"
                            title="Reset to 30 Days Trial"
                          >
                            ✓ 30 Days Active
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CAMPAIGNS & MODERATION */}
            {activeTab === 'campaigns' && (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {/* Search & Category Filter */}
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search campaign, mitthi, location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">All Bawms</option>
                    <option value="ralna">Ralna</option>
                    <option value="khawlsak">Khawlsak</option>
                    <option value="rikrum">Rikrum</option>
                    <option value="kumtluang">Kumtluang</option>
                  </select>
                </div>

                {filteredCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            {camp.category}
                          </span>
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md ${
                            camp.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            camp.status === 'pending_approval' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {camp.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-xs mt-1">{camp.title}</h4>
                        <p className="text-[10.5px] text-slate-500">📍 {camp.location} • UPI: <b className="font-mono text-slate-700">{camp.upiId}</b></p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400">
                        <span>Validity: <b className="text-slate-800">{formatDateDDMMYYYY(camp.validityDate)}</b></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {camp.id}</span>
                      <div className="flex gap-1.5">
                        {camp.status === 'pending_approval' && (
                          <button
                            onClick={() => onApproveCampaign(camp)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1 rounded-xl text-[10.5px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve Now
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const newStatus = camp.status === 'active' ? 'expired' : 'active';
                            onUpdateCampaign({ ...camp, status: newStatus });
                          }}
                          className={`font-bold px-2.5 py-1 rounded-xl text-[10px] transition cursor-pointer border ${
                            camp.status === 'active'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {camp.status === 'active' ? 'Mark Expired' : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: FEE & FINANCIAL LEDGER */}
            {activeTab === 'finances' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-900 text-white p-3 rounded-2xl">
                    <span className="text-[9.5px] text-slate-400 uppercase font-bold">Total Platform Volume</span>
                    <div className="text-lg font-black text-amber-400 mt-1">₹{totalVolume.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-emerald-950 text-white p-3 rounded-2xl border border-emerald-800">
                    <span className="text-[9.5px] text-emerald-300 uppercase font-bold">RonPay 1% TSP Fee</span>
                    <div className="text-lg font-black text-emerald-400 mt-1">₹{totalPlatformFees.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold">Online UPI Trxn</span>
                    <div className="text-lg font-black text-slate-900 mt-1">{onlineCount}</div>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold">Cash Recorded</span>
                    <div className="text-lg font-black text-slate-900 mt-1">{cashCount}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-900 text-xs flex items-center justify-between">
                    <span>Recent Transaction Audit Stream</span>
                    <span className="text-[10px] text-slate-400">{transactions.length} total entries</span>
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {transactions.slice(0, 15).map(tx => (
                      <div key={tx.id} className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center text-[10.5px]">
                        <div>
                          <b className="text-slate-900">{tx.donorName}</b> • {tx.campaignTitle}
                          <div className="text-[9.5px] text-slate-400">{formatDateDDMMYYYY(tx.timestamp)} • Hash: {tx.txHash.substring(0, 10)}...</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-emerald-700">₹{tx.amount}</div>
                          <span className="text-[9px] text-slate-400">1% Fee: ₹{tx.platformFee || Math.round(tx.amount * 0.01)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PHONEPE GATEWAY & SYSTEM */}
            {activeTab === 'gateway' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-amber-400 text-xs">PhonePe TSP Gateway Status</span>
                    <span className="text-[9.5px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">ACTIVE UAT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-300 font-mono pt-1">
                    <div>Merchant ID: <b>TSPMIZOPAYUAT</b></div>
                    <div>Client Version: <b>v1 (PG V2)</b></div>
                    <div>Split Settlement: <b>99% Campaign / 1% RonPay</b></div>
                    <div>Webhooks: <b>Active (POST /api/phonepe/webhook)</b></div>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl space-y-2 text-rose-900">
                  <h4 className="font-black text-xs flex items-center gap-1.5 text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Danger Zone: Reset System Data
                  </h4>
                  <p className="text-[10.5px] text-rose-700">
                    He hian demo database leh transaction zawng zawng a tifai anga, initial template state-ah a dah let ang.
                  </p>
                  <button
                    onClick={onResetData}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl transition cursor-pointer text-xs"
                  >
                    Reset System Demo State
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
