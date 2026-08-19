import React, { useState, useEffect, useRef } from 'react';
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
  Edit3,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Download,
  Upload,
  Building,
  Smartphone,
  Fingerprint,
  ScanFace,
  Megaphone,
  History,
  Database,
  Ban,
  Check,
  Percent,
  Calendar,
  Layers,
  Eye,
  Sliders,
  Save,
  RotateCcw,
  Tag,
  AlertCircle
} from 'lucide-react';
import { 
  Campaign, 
  CreatorProfile, 
  Transaction, 
  BawmCategory, 
  SystemPricingConfig, 
  BawmFeeRule, 
  AuditLog, 
  AnnouncementBanner 
} from '../types';
import { formatDateDDMMYYYY } from '../utils/date';
import { BAWM_CONFIG, DEFAULT_PRICING_CONFIG } from '../data/initialData';
import { 
  exportFullDatabaseBackup, 
  restoreFullDatabaseBackup, 
  recordAuditLog,
  getStoredAuditLogs,
  getStoredAnnouncement,
  saveStoredAnnouncement
} from '../utils/storage';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  transactions: Transaction[];
  creators: CreatorProfile[];
  pricingConfig: SystemPricingConfig;
  announcement?: AnnouncementBanner;
  auditLogs?: AuditLog[];
  onUpdatePricingConfig: (config: SystemPricingConfig) => void;
  onUpdateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onApproveCampaign: (campaign: Campaign) => void;
  onRejectCampaign?: (campaignId: string, remarks?: string) => void;
  onUpdateCreator: (creator: CreatorProfile) => void;
  onBlockCreator?: (creatorPhone: string, isBlocked: boolean) => void;
  onApproveCreatorRegistration?: (creator: CreatorProfile, categories: BawmCategory[], validityDays: number) => void;
  onRejectCreatorRegistration?: (creatorPhone: string, reason: string) => void;
  onUpdateAnnouncement?: (ann: AnnouncementBanner) => void;
  onRestoreDatabase?: (jsonString: string) => boolean;
  onResetData: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  transactions,
  creators,
  pricingConfig,
  announcement,
  auditLogs,
  onUpdatePricingConfig,
  onUpdateCampaign,
  onDeleteCampaign,
  onApproveCampaign,
  onRejectCampaign,
  onUpdateCreator,
  onBlockCreator,
  onApproveCreatorRegistration,
  onRejectCreatorRegistration,
  onUpdateAnnouncement,
  onRestoreDatabase,
  onResetData,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUserId, setAdminUserId] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('ronpay2026');
  const [loginError, setLoginError] = useState<string>('');
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);

  // Admin tabs
  const [activeTab, setActiveTab] = useState<'creators' | 'campaigns' | 'announcement' | 'audit' | 'backup' | 'rates' | 'finances' | 'gateway'>('campaigns');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Creators sub-filter
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'pending' | 'approved' | 'blocked'>('all');
  
  // Campaigns sub-filter
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Rates / Pricing state
  const [localPricing, setLocalPricing] = useState<SystemPricingConfig>(pricingConfig || DEFAULT_PRICING_CONFIG);
  const [activePricingCategory, setActivePricingCategory] = useState<BawmCategory>('khawlsak');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [testAmount, setTestAmount] = useState<number>(1000);

  // Announcement state
  const [localAnnouncement, setLocalAnnouncement] = useState<AnnouncementBanner>(() => {
    return announcement || getStoredAnnouncement();
  });
  const [announcementSavedNotice, setAnnouncementSavedNotice] = useState<boolean>(false);

  // Audit Logs state
  const [logsList, setLogsList] = useState<AuditLog[]>(() => {
    return auditLogs || getStoredAuditLogs();
  });
  const [auditFilter, setAuditFilter] = useState<string>('all');

  // Creator License Modal
  const [editingCreator, setEditingCreator] = useState<CreatorProfile | null>(null);
  const [licenseDuration, setLicenseDuration] = useState<number>(365); // days
  const [selectedCreatorCategories, setSelectedCreatorCategories] = useState<BawmCategory[]>(['ralna', 'khawlsak']);

  // Admin Campaign Edit Modal
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Restore file state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreNotice, setRestoreNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  // Sync pricing & announcements when props change
  useEffect(() => {
    if (pricingConfig) setLocalPricing(pricingConfig);
  }, [pricingConfig]);

  useEffect(() => {
    if (announcement) setLocalAnnouncement(announcement);
  }, [announcement]);

  if (!isOpen) return null;

  // Biometric Login handler for Admin
  const handleAdminBiometricLogin = () => {
    setIsBiometricScanning(true);
    setLoginError('');
    
    // Simulate biometric check with feedback
    setTimeout(() => {
      setIsBiometricScanning(false);
      setIsAuthenticated(true);
      recordAuditLog('Admin Biometric Login', 'Administrator authenticated via Biometrics (Fingerprint/FaceID).', 'system');
      setLogsList(getStoredAuditLogs());
    }, 850);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (adminUserId.trim().toLowerCase() === 'admin' || adminUserId.trim().toLowerCase() === 'admin@ronpay.mizoram.gov.in') &&
      (adminPassword === 'admin' || adminPassword === 'ronpay2026' || adminPassword === 'ronpay@admin2026')
    ) {
      setIsAuthenticated(true);
      setLoginError('');
      recordAuditLog('Admin Password Login', 'Administrator authenticated via Master Credentials.', 'system');
      setLogsList(getStoredAuditLogs());
    } else {
      setLoginError('User ID emaw Password a dik lo. (Default: admin / ronpay2026)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUserId('admin');
    setAdminPassword('');
  };

  // Pending counts
  const pendingCreators = creators.filter(c => !c.isApproved);
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending_approval');
  const rejectedCampaigns = campaigns.filter(c => c.status === 'rejected');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  // Creator moderation
  const handleApproveCreator = (creator: CreatorProfile) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + licenseDuration);

    const updated: CreatorProfile = {
      ...creator,
      isApproved: true,
      isBlocked: false,
      isPhoneVerified: true,
      approvedCategories: selectedCreatorCategories.length > 0 ? selectedCreatorCategories : ['ralna', 'khawlsak', 'rikrum', 'kumtluang'],
      trialExpiresAt: expiresAt.toISOString(),
    };

    onUpdateCreator(updated);
    recordAuditLog(
      'Creator Approved',
      `Approved creator application for ${creator.name} (${creator.phone}) with categories: ${updated.approvedCategories.join(', ')}.`,
      'creator',
      creator.phone
    );
    setLogsList(getStoredAuditLogs());
    setEditingCreator(null);
    alert(`✅ CREATOR APPROVED!\n\n${creator.name} is now approved with active Creator privileges.`);
  };

  const handleRejectCreator = (creator: CreatorProfile) => {
    const reason = prompt('Rejection reason (Mizo/English):', 'In-verify-na lehkha a chiang tawk lo');
    if (reason === null) return;

    const updated: CreatorProfile = {
      ...creator,
      isApproved: false,
      rejectionReason: reason
    };

    if (onRejectCreatorRegistration) {
      onRejectCreatorRegistration(creator.phone, reason);
    } else {
      onUpdateCreator(updated);
    }

    recordAuditLog(
      'Creator Application Rejected',
      `Rejected registration for ${creator.name} (${creator.phone}). Reason: ${reason}`,
      'creator',
      creator.phone
    );
    setLogsList(getStoredAuditLogs());
  };

  const handleToggleBlockCreator = (creator: CreatorProfile) => {
    const isCurrentlyBlocked = !!creator.isBlocked;
    const nextBlocked = !isCurrentlyBlocked;

    const updated: CreatorProfile = {
      ...creator,
      isBlocked: nextBlocked
    };

    if (onBlockCreator) {
      onBlockCreator(creator.phone, nextBlocked);
    } else {
      onUpdateCreator(updated);
    }

    recordAuditLog(
      nextBlocked ? 'Creator Blocked' : 'Creator Unblocked',
      `${nextBlocked ? 'Blocked' : 'Unblocked'} creator account for ${creator.name} (${creator.phone}).`,
      'creator',
      creator.phone
    );
    setLogsList(getStoredAuditLogs());
  };

  // Campaign moderation
  const handleApproveCampaignClick = (camp: Campaign) => {
    const updated: Campaign = {
      ...camp,
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Admin'
    };
    onApproveCampaign(updated);
    recordAuditLog(
      'Campaign Approved & Activated',
      `Approved QR Campaign '${camp.title}' (${camp.id}) in category ${camp.category}. QR is now LIVE.`,
      'campaign',
      camp.id
    );
    setLogsList(getStoredAuditLogs());
    alert(`✅ CAMPAIGN APPROVED!\n\n'${camp.title}' is now ACTIVE and ready to receive donations.`);
  };

  const handleRejectCampaignClick = (camp: Campaign) => {
    const remarks = prompt('Rejection remarks / Reason:', 'Beneficiary details or UPI ID needs verification');
    if (remarks === null) return;

    const updated: Campaign = {
      ...camp,
      status: 'rejected',
      approvalRemarks: remarks
    };

    if (onRejectCampaign) {
      onRejectCampaign(camp.id, remarks);
    } else {
      onUpdateCampaign(updated);
    }

    recordAuditLog(
      'Campaign Rejected',
      `Rejected QR Campaign '${camp.title}' (${camp.id}). Remark: ${remarks}`,
      'campaign',
      camp.id
    );
    setLogsList(getStoredAuditLogs());
  };

  const handleSaveCampaignEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    onUpdateCampaign(editingCampaign);
    recordAuditLog(
      'Admin Edited Campaign Post',
      `Admin updated details of post/campaign '${editingCampaign.title}' (${editingCampaign.id}). Category: ${editingCampaign.category}, Status: ${editingCampaign.status}.`,
      'campaign',
      editingCampaign.id
    );
    setLogsList(getStoredAuditLogs());
    const campTitle = editingCampaign.title;
    setEditingCampaign(null);
    alert(`✅ CAMPAIGN POST UPDATED!\n\n'${campTitle}' has been successfully updated.`);
  };

  // Announcement Save
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AnnouncementBanner = {
      ...localAnnouncement,
      updatedAt: new Date().toISOString()
    };
    saveStoredAnnouncement(updated);
    if (onUpdateAnnouncement) {
      onUpdateAnnouncement(updated);
    }
    recordAuditLog(
      'Announcement Updated',
      `Updated community announcement: "${updated.title}" (Active: ${updated.isActive})`,
      'announcement'
    );
    setLogsList(getStoredAuditLogs());
    setAnnouncementSavedNotice(true);
    setTimeout(() => setAnnouncementSavedNotice(false), 3000);
  };

  // Backup Export
  const handleExportBackup = () => {
    const jsonString = exportFullDatabaseBackup();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ronpay_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLogsList(getStoredAuditLogs());
  };

  // Backup Restore
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const result = restoreFullDatabaseBackup(content);
      if (result.success) {
        setRestoreNotice({
          message: `✅ Backup successfully restored! Loaded ${result.counts?.campaigns} campaigns, ${result.counts?.transactions} transactions, and ${result.counts?.creators} creators.`
        });
        if (onRestoreDatabase) {
          onRestoreDatabase(content);
        }
        setLogsList(getStoredAuditLogs());
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setRestoreNotice({
          message: `❌ Failed to restore: ${result.error}`,
          isError: true
        });
      }
    };
    reader.readAsText(file);
  };

  // Filtered Creators list
  const filteredCreators = creators.filter(c => {
    if (creatorFilter === 'pending' && c.isApproved) return false;
    if (creatorFilter === 'approved' && (!c.isApproved || c.isBlocked)) return false;
    if (creatorFilter === 'blocked' && !c.isBlocked) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.orgName && c.orgName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Campaigns list
  const filteredCampaigns = campaigns.filter(c => {
    if (campaignFilter === 'pending' && c.status !== 'pending_approval') return false;
    if (campaignFilter === 'active' && c.status !== 'active') return false;
    if (campaignFilter === 'rejected' && c.status !== 'rejected') return false;
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

  // Financial Stats
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalPlatformFees = transactions.reduce((acc, t) => acc + (t.platformFee || Math.round(t.amount * 0.01)), 0);

  return (
    <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fadeIn text-slate-800">
      <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl border border-indigo-200 relative flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md border border-indigo-400/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">RonPay Admin Console</h2>
                <span className="text-[9.5px] font-extrabold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/40 uppercase">
                  v2.5 Master
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Community Moderation, Biometric Security & Core Platform Config</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Logout
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auth Guard Screen */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center shadow-lg">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg font-black text-slate-900">Admin Authentication Required</h3>
              <p className="text-xs text-slate-500">
                Log in using Biometrics (Fingerprint / Face ID) or Master Credentials.
              </p>
            </div>

            {/* Quick Biometric Admin Unlock */}
            <div className="w-full max-w-xs space-y-3">
              <button
                type="button"
                onClick={handleAdminBiometricLogin}
                disabled={isBiometricScanning}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Fingerprint className={`w-5 h-5 ${isBiometricScanning ? 'animate-pulse text-amber-300' : ''}`} />
                {isBiometricScanning ? 'Scanning Admin Biometrics...' : 'Admin Biometric Login (Instant)'}
              </button>

              <div className="flex items-center gap-2 text-slate-300 my-2">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Or Master Password</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {/* Password Form */}
              <form onSubmit={handleLogin} className="space-y-3 text-left">
                <div>
                  <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Admin Username</label>
                  <input
                    type="text"
                    value={adminUserId}
                    onChange={(e) => setAdminUserId(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Master Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    placeholder="ronpay2026"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200 text-center">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer"
                >
                  Verify Master Password
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tab Navigation Bar */}
            <div className="bg-slate-100/80 border-b border-slate-200/90 px-3 pt-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                { 
                  id: 'campaigns', 
                  label: 'Campaign Moderation', 
                  icon: Layers,
                  badge: pendingCampaigns.length > 0 ? pendingCampaigns.length : undefined,
                  badgeColor: 'bg-amber-500 text-white'
                },
                { 
                  id: 'creators', 
                  label: 'Creators & Approval', 
                  icon: Users,
                  badge: pendingCreators.length > 0 ? pendingCreators.length : undefined,
                  badgeColor: 'bg-indigo-600 text-white'
                },
                { 
                  id: 'announcement', 
                  label: 'Announcement Banner', 
                  icon: Megaphone,
                  badge: localAnnouncement.isActive ? 'Active' : undefined,
                  badgeColor: 'bg-emerald-600 text-white'
                },
                { id: 'audit', label: 'Audit & Activity Log', icon: History },
                { id: 'backup', label: 'Backup & Restore', icon: Database },
                { id: 'rates', label: 'Platform Rates & Fees', icon: Percent },
                { id: 'finances', label: 'Finances', icon: DollarSign },
                { id: 'gateway', label: 'PhonePe PG V2', icon: Smartphone },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2.5 rounded-t-2xl font-black text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-indigo-700 border-t-2 border-x border-slate-200/90 border-t-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-extrabold ${tab.badgeColor}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              
              {/* ========================================================= */}
              {/* TAB 1: CAMPAIGN MODERATION & QR ACTIVATION (Request 7)   */}
              {/* ========================================================= */}
              {activeTab === 'campaigns' && (
                <div className="space-y-4">
                  {/* Top Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[
                        { key: 'all', label: `All (${campaigns.length})` },
                        { key: 'pending', label: `Pending Review (${pendingCampaigns.length})` },
                        { key: 'active', label: `Active QRs (${activeCampaigns.length})` },
                        { key: 'rejected', label: `Rejected (${rejectedCampaigns.length})` },
                      ].map(f => (
                        <button
                          key={f.key}
                          onClick={() => setCampaignFilter(f.key as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            campaignFilter === f.key
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search campaign, creator, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Moderation Cards Queue */}
                  {filteredCampaigns.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-1">
                      <Layers className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-600">No campaigns found in this filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredCampaigns.map(camp => {
                        const isPending = camp.status === 'pending_approval';
                        const isActive = camp.status === 'active';
                        const isRejected = camp.status === 'rejected';
                        const catInfo = BAWM_CONFIG[camp.category];

                        return (
                          <div
                            key={camp.id}
                            className={`p-4 rounded-2xl border transition shadow-2xs space-y-3 ${
                              isPending
                                ? 'bg-amber-50/70 border-2 border-amber-300 ring-2 ring-amber-100'
                                : isRejected
                                ? 'bg-rose-50/60 border-rose-200 opacity-90'
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200">
                                    {catInfo?.name || camp.category}
                                  </span>
                                  {isPending && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-white animate-pulse">
                                      ⚠️ PENDING REVIEW
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> ACTIVE QR
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                                      REJECTED
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-black text-slate-900">{camp.title}</h4>
                                <p className="text-[10.5px] text-slate-500">{camp.location} • ID: <span className="font-mono">{camp.id}</span></p>
                              </div>

                              {camp.imageUrl && (
                                <img
                                  src={camp.imageUrl}
                                  alt={camp.title}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              )}
                            </div>

                            {/* Beneficiary & Specifics */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                              {camp.mitthiHming && (
                                <p><span className="text-slate-400 font-bold">Mitthi:</span> <strong className="text-slate-800">{camp.mitthiHming}</strong> ({camp.age} yrs)</p>
                              )}
                              {camp.cause && (
                                <p><span className="text-slate-400 font-bold">Cause:</span> <strong className="text-slate-800">{camp.cause}</strong></p>
                              )}
                              {camp.targetAmount && (
                                <p><span className="text-slate-400 font-bold">Target Goal:</span> <strong className="text-indigo-600">₹{camp.targetAmount.toLocaleString()}</strong></p>
                              )}
                              <p><span className="text-slate-400 font-bold">UPI ID:</span> <span className="font-mono font-bold text-slate-700">{camp.upiId}</span></p>
                              {camp.createdBy && (
                                <p><span className="text-slate-400 font-bold">Creator Phone:</span> <span className="font-mono font-bold text-slate-700">{camp.createdBy}</span></p>
                              )}
                              {camp.approvalRemarks && (
                                <p className="text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                                  Remark: {camp.approvalRemarks}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={() => setEditingCampaign({ ...camp })}
                                className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black py-1.5 rounded-xl text-xs transition border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                title="Edit post details"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit Post
                              </button>

                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handleApproveCampaignClick(camp)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve & Activate
                                  </button>
                                  <button
                                    onClick={() => handleRejectCampaignClick(camp)}
                                    className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black py-1.5 rounded-xl text-xs transition border border-rose-200 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <>
                                  {isRejected && (
                                    <button
                                      onClick={() => handleApproveCampaignClick(camp)}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-1.5 rounded-xl text-xs transition cursor-pointer"
                                    >
                                      Re-Approve & Activate
                                    </button>
                                  )}
                                  {onDeleteCampaign && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete campaign '${camp.title}'?`)) {
                                          onDeleteCampaign(camp.id);
                                          recordAuditLog('Campaign Deleted', `Deleted campaign '${camp.title}' (${camp.id}).`, 'campaign', camp.id);
                                          setLogsList(getStoredAuditLogs());
                                        }
                                      }}
                                      className="px-3 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold py-1.5 rounded-xl text-xs transition cursor-pointer ml-auto"
                                      title="Delete Campaign"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: CREATOR REGISTRATION APPROVAL & BLOCK (Req 5, 6)   */}
              {/* ========================================================= */}
              {activeTab === 'creators' && (
                <div className="space-y-4">
                  {/* Sub Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[
                        { key: 'all', label: `All (${creators.length})` },
                        { key: 'pending', label: `Pending Registration (${pendingCreators.length})` },
                        { key: 'approved', label: `Approved Active (${creators.filter(c => c.isApproved && !c.isBlocked).length})` },
                        { key: 'blocked', label: `Blocked (${creators.filter(c => c.isBlocked).length})` },
                      ].map(f => (
                        <button
                          key={f.key}
                          onClick={() => setCreatorFilter(f.key as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            creatorFilter === f.key
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search creator name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Creator List */}
                  {filteredCreators.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-1">
                      <Users className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-600">No creator profiles found in this category.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCreators.map(creator => {
                        const isPending = !creator.isApproved;
                        const isBlocked = !!creator.isBlocked;

                        return (
                          <div
                            key={creator.phone || creator.name}
                            className={`p-4 rounded-2xl border transition space-y-3 shadow-2xs ${
                              isPending
                                ? 'bg-indigo-50/70 border-2 border-indigo-300'
                                : isBlocked
                                ? 'bg-rose-50 border-rose-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900">{creator.name || 'Unnamed Applicant'}</h4>
                                  {isPending && (
                                    <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                      Registration Pending
                                    </span>
                                  )}
                                  {isBlocked && (
                                    <span className="text-[9px] font-black uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Ban className="w-2.5 h-2.5" /> BLOCKED
                                    </span>
                                  )}
                                  {!isPending && !isBlocked && (
                                    <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                      Active Creator
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                  {creator.designation || 'Member'} • <strong className="text-slate-700">{creator.orgName || 'Community Member'}</strong> • Mobile: <span className="font-mono font-bold text-slate-800">{creator.phone}</span>
                                </p>
                              </div>

                              {/* Approved categories badges */}
                              <div className="flex flex-wrap gap-1">
                                {creator.approvedCategories?.map(cat => (
                                  <span key={cat} className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {BAWM_CONFIG[cat]?.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Document proof & metadata */}
                            {creator.authDocName && (
                              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs flex items-center gap-2 text-slate-600">
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Auth Document: <strong className="text-slate-800">{creator.authDocName}</strong></span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCreator(creator);
                                      setSelectedCreatorCategories(creator.approvedCategories?.length > 0 ? creator.approvedCategories : ['ralna', 'khawlsak', 'rikrum', 'kumtluang']);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve Registration
                                  </button>
                                  <button
                                    onClick={() => handleRejectCreator(creator)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black px-3 py-2 rounded-xl text-xs transition border border-rose-200 cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Block / Unblock Button (Request 6) */}
                                  <button
                                    onClick={() => handleToggleBlockCreator(creator)}
                                    className={`font-black px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer ${
                                      isBlocked
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                    {isBlocked ? 'Unblock Creator (Restore Rights)' : 'Block Creator (Disable Posts)'}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingCreator(creator);
                                      setSelectedCreatorCategories(creator.approvedCategories || []);
                                    }}
                                    className="bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-slate-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Settings className="w-3.5 h-3.5" /> Edit License & Categories
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: CUSTOM ANNOUNCEMENT BANNER (Request 3)             */}
              {/* ========================================================= */}
              {activeTab === 'announcement' && (
                <div className="space-y-5 max-w-2xl mx-auto">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-indigo-600" />
                      Global Community Announcement System
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure the live banner displayed at the top of the HomeScreen for all users.
                    </p>
                  </div>

                  {/* Live Banner Preview Card */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">Live Preview</label>
                    {localAnnouncement.isActive ? (
                      <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${
                        localAnnouncement.type === 'urgent'
                          ? 'bg-gradient-to-r from-red-500 via-rose-600 to-red-600 text-white border-red-400'
                          : localAnnouncement.type === 'info'
                          ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white border-indigo-500'
                          : localAnnouncement.type === 'notice'
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400'
                          : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-500'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <span className="p-1.5 bg-white/20 rounded-xl shrink-0 backdrop-blur-xs">
                            <Megaphone className="w-4 h-4" />
                          </span>
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white">
                                {localAnnouncement.type}
                              </span>
                              <h4 className="text-xs font-black">{localAnnouncement.title}</h4>
                            </div>
                            <p className="text-[11px] text-white/90 leading-snug">{localAnnouncement.message}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                        Announcement banner is currently <strong>DISABLED</strong>.
                      </div>
                    )}
                  </div>

                  {/* Announcement Form */}
                  <form onSubmit={handleSaveAnnouncement} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800">Banner Display Status</label>
                      <button
                        type="button"
                        onClick={() => setLocalAnnouncement(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          localAnnouncement.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            localAnnouncement.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['urgent', 'info', 'notice', 'event'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setLocalAnnouncement(prev => ({ ...prev, type }))}
                          className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                            localAnnouncement.type === type
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Banner Headline / Title</label>
                      <input
                        type="text"
                        value={localAnnouncement.title}
                        onChange={(e) => setLocalAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                        placeholder="Mizoram Community Notice..."
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Announcement Message</label>
                      <textarea
                        value={localAnnouncement.message}
                        onChange={(e) => setLocalAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                        placeholder="Type announcement details here..."
                        required
                      />
                    </div>

                    {announcementSavedNotice && (
                      <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-center">
                        ✅ Announcement successfully published to HomeScreen!
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Save & Broadcast Announcement
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: AUDIT & ACTIVITY LOG (Request 2)                   */}
              {/* ========================================================= */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-600" />
                        System Audit & Moderation Activity Log
                      </h3>
                      <p className="text-xs text-slate-500">Chronological history of approvals, changes, and admin operations.</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setLogsList(getStoredAuditLogs());
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>
                  </div>

                  {/* Logs list */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 divide-y divide-slate-200/80 max-h-[500px] overflow-y-auto space-y-2">
                    {logsList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-bold">
                        No audit logs recorded yet.
                      </div>
                    ) : (
                      logsList.map(log => (
                        <div key={log.id} className="pt-2 first:pt-0 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-slate-900 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                log.targetType === 'creator' ? 'bg-indigo-500' :
                                log.targetType === 'campaign' ? 'bg-emerald-500' :
                                log.targetType === 'pricing' ? 'bg-amber-500' : 'bg-purple-500'
                              }`} />
                              {log.action}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateDDMMYYYY(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{log.details}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>By: <strong className="text-slate-600">{log.performedBy}</strong></span>
                            {log.targetId && <span>• Target: <code className="bg-slate-200/60 px-1 py-0.2 rounded text-slate-700">{log.targetId}</code></span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: DATA BACKUP & RESTORE (JSON) (Request 4)          */}
              {/* ========================================================= */}
              {activeTab === 'backup' && (
                <div className="space-y-5 max-w-2xl mx-auto">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-600" />
                      Database Backup & Restoration Subsystem
                    </h3>
                    <p className="text-xs text-slate-500">
                      Export full system data snapshots (campaigns, transactions, profiles, audit records) to JSON or restore existing backups.
                    </p>
                  </div>

                  {restoreNotice && (
                    <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
                      restoreNotice.isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {restoreNotice.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Export Card */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-center flex flex-col justify-between">
                      <div className="space-y-1">
                        <Download className="w-8 h-8 mx-auto text-indigo-600" />
                        <h4 className="text-xs font-black text-slate-900">Export Backup (JSON)</h4>
                        <p className="text-[11px] text-slate-500">Download complete snapshot including all active Bawms, QR records, and transactions.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download .JSON Backup
                      </button>
                    </div>

                    {/* Restore Card */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-center flex flex-col justify-between">
                      <div className="space-y-1">
                        <Upload className="w-8 h-8 mx-auto text-purple-600" />
                        <h4 className="text-xs font-black text-slate-900">Restore Backup (JSON)</h4>
                        <p className="text-[11px] text-slate-500">Upload and restore a previous database file to instantly recover all records.</p>
                      </div>

                      <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileRestore}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Select Backup File (.json)
                      </button>
                    </div>
                  </div>

                  {/* Reset Demo Data Button */}
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-amber-900">Factory Demo Reset</h4>
                      <p className="text-[10.5px] text-amber-800/80">Re-initialize database with standard Mizoram sample campaigns & YMA Bawms.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to reset demo data?')) {
                          onResetData();
                          recordAuditLog('Database Reset to Factory Defaults', 'Administrator triggered demo reset.', 'system');
                          setLogsList(getStoredAuditLogs());
                          alert('✅ Database reset to factory default!');
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: RATES & PLATFORM FEES                             */}
              {/* ========================================================= */}
              {activeTab === 'rates' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-900">Platform Fee & Subscription Rules</h3>
                      <p className="text-xs text-slate-500">Configure category-wise platform fee percentages and creator license fees.</p>
                    </div>
                    {saveSuccessNotice && (
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ✅ Rates saved!
                      </span>
                    )}
                  </div>

                  {/* Category Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(['ralna', 'khawlsak', 'rikrum', 'kumtluang', 'others'] as BawmCategory[]).map(cat => {
                      const isActive = activePricingCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActivePricingCategory(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {BAWM_CONFIG[cat]?.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pricing Rule Editor */}
                  {localPricing.categories[activePricingCategory] && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Platform Fee (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={localPricing.categories[activePricingCategory].platformFeePercent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLocalPricing(prev => ({
                                ...prev,
                                categories: {
                                  ...prev.categories,
                                  [activePricingCategory]: {
                                    ...prev.categories[activePricingCategory],
                                    platformFeePercent: val
                                  }
                                }
                              }));
                            }}
                            className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Fixed QR Charge (₹)</label>
                          <input
                            type="number"
                            value={localPricing.categories[activePricingCategory].qrCreationCharge}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLocalPricing(prev => ({
                                ...prev,
                                categories: {
                                  ...prev.categories,
                                  [activePricingCategory]: {
                                    ...prev.categories[activePricingCategory],
                                    qrCreationCharge: val
                                  }
                                }
                              }));
                            }}
                            className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Free Trial Period (Days)</label>
                          <input
                            type="number"
                            value={localPricing.categories[activePricingCategory].trialPeriodDays}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setLocalPricing(prev => ({
                                ...prev,
                                categories: {
                                  ...prev.categories,
                                  [activePricingCategory]: {
                                    ...prev.categories[activePricingCategory],
                                    trialPeriodDays: val
                                  }
                                }
                              }));
                            }}
                            className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePricingConfig(localPricing);
                          recordAuditLog('Platform Pricing Updated', `Updated platform fee rules for ${BAWM_CONFIG[activePricingCategory]?.name}.`, 'pricing');
                          setLogsList(getStoredAuditLogs());
                          setSaveSuccessNotice(true);
                          setTimeout(() => setSaveSuccessNotice(false), 2500);
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Category Rates
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 7: FINANCES & ANALYTICS                               */}
              {/* ========================================================= */}
              {activeTab === 'finances' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200">
                      <p className="text-[10.5px] font-extrabold text-indigo-700 uppercase">Total Platform Volume</p>
                      <h3 className="text-xl font-black text-indigo-950 mt-1">₹{totalVolume.toLocaleString()}</h3>
                      <p className="text-[10px] text-indigo-600/80">{transactions.length} Total Transactions</p>
                    </div>
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                      <p className="text-[10.5px] font-extrabold text-emerald-700 uppercase">Total Platform Fees</p>
                      <h3 className="text-xl font-black text-emerald-950 mt-1">₹{totalPlatformFees.toLocaleString()}</h3>
                      <p className="text-[10px] text-emerald-600/80">Average ~1.0% community fee</p>
                    </div>
                    <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200">
                      <p className="text-[10.5px] font-extrabold text-purple-700 uppercase">Net Settlement</p>
                      <h3 className="text-xl font-black text-purple-950 mt-1">₹{(totalVolume - totalPlatformFees).toLocaleString()}</h3>
                      <p className="text-[10px] text-purple-600/80">Direct to NGO & YMA accounts</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 8: GATEWAY & TSP CONFIG                               */}
              {/* ========================================================= */}
              {activeTab === 'gateway' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 max-w-lg mx-auto text-xs">
                  <h4 className="font-black text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-600" /> PhonePe PG V2 / TSP Configuration
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Merchant ID (MID)</label>
                      <input
                        type="text"
                        readOnly
                        value="PGTESTPAYUAT86"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Salt Key Index</label>
                      <input
                        type="text"
                        readOnly
                        value="1"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-medium">
                      Status: <strong className="text-emerald-700">ONLINE (UAT Mode)</strong> with instant UPI intent routing.
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Admin Campaign Post Editor Modal Sheet */}
        {editingCampaign && (
          <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl border border-indigo-200 flex flex-col overflow-hidden text-slate-800">
              {/* Modal Top Header */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-white truncate">Edit Campaign Post (Admin Override)</h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">ID: {editingCampaign.id} • Creator: {editingCampaign.createdBy || 'Unknown'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCampaign(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveCampaignEdit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
                {/* 1. Core Post Details */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <h4 className="text-[10.5px] font-black uppercase text-indigo-900 tracking-wider">General Information</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase">Bawm Category</label>
                      <select
                        value={editingCampaign.category}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, category: e.target.value as BawmCategory })}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                      >
                        <option value="ralna">Ralna Bawm (Chhiatni)</option>
                        <option value="khawlsak">Khawlsak Bawm (Project/Tanpuina)</option>
                        <option value="rikrum">Rikrum Bawm (Emergency)</option>
                        <option value="kumtluang">Kumtluang Bawm (Kohhran/NGO)</option>
                        <option value="others">Others / Special</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase">Post / QR Status</label>
                      <select
                        value={editingCampaign.status}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value as any })}
                        className={`w-full mt-1 p-2 border rounded-xl text-xs font-black focus:outline-none ${
                          editingCampaign.status === 'active' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
                          editingCampaign.status === 'pending_approval' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                          editingCampaign.status === 'rejected' ? 'bg-rose-50 text-rose-900 border-rose-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="active">Active QR (Payment Enabled)</option>
                        <option value="pending_approval">Pending Approval (Inactive QR)</option>
                        <option value="rejected">Rejected (Payment Blocked)</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase">Campaign Title / Hming</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign.title}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                      placeholder="e.g. Pi Lalhmingliani Ralna"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase">Settlement UPI ID</label>
                      <input
                        type="text"
                        required
                        value={editingCampaign.upiId}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, upiId: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                        placeholder="e.g. bungkawn.yma@okaxis"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase">Validity Date & Time</label>
                      <input
                        type="text"
                        value={editingCampaign.validityDate || ''}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, validityDate: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                        placeholder="YYYY-MM-DDTHH:mm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase">Location / Veng</label>
                      <input
                        type="text"
                        value={editingCampaign.location || ''}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, location: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                        placeholder="e.g. Bungkawn, Aizawl"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase">GPS Coordinates</label>
                      <input
                        type="text"
                        value={editingCampaign.gpsCoords || ''}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, gpsCoords: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                        placeholder="23.7271, 92.7176"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Category Specific Details */}
                {editingCampaign.category === 'ralna' && (
                  <div className="space-y-3 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200">
                    <h4 className="text-[10.5px] font-black uppercase text-rose-900 tracking-wider">Ralna Bawm Specifics</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-rose-800 uppercase">Mitthi Hming</label>
                        <input
                          type="text"
                          value={editingCampaign.mitthiHming || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, mitthiHming: e.target.value })}
                          className="w-full mt-1 p-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800"
                          placeholder="Mitthi hming"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-rose-800 uppercase">Kum (Age)</label>
                        <input
                          type="number"
                          value={editingCampaign.age || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, age: parseInt(e.target.value) || undefined })}
                          className="w-full mt-1 p-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800"
                          placeholder="74"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9.5px] font-extrabold text-rose-800 uppercase">Thihni & Hun</label>
                        <input
                          type="text"
                          value={editingCampaign.thihni || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, thihni: e.target.value })}
                          className="w-full mt-1 p-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-slate-800"
                          placeholder="2026-08-17 22:30"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-extrabold text-rose-800 uppercase">Vui Hun</label>
                        <input
                          type="text"
                          value={editingCampaign.vuiHun || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, vuiHun: e.target.value })}
                          className="w-full mt-1 p-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-slate-800"
                          placeholder="2026-08-18 13:30"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-extrabold text-rose-800 uppercase">Vuitu</label>
                        <input
                          type="text"
                          value={editingCampaign.vuitu || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, vuitu: e.target.value })}
                          className="w-full mt-1 p-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-slate-800"
                          placeholder="Rev. Dr. C. Lalramnghaka"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(editingCampaign.category === 'khawlsak' || editingCampaign.category === 'rikrum') && (
                  <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                    <h4 className="text-[10.5px] font-black uppercase text-amber-900 tracking-wider">
                      {editingCampaign.category === 'khawlsak' ? 'Khawlsak Bawm Specifics' : 'Rikrum Bawm Specifics'}
                    </h4>

                    <div>
                      <label className="text-[10px] font-extrabold text-amber-800 uppercase">Chhan / Purpose / Cause</label>
                      <input
                        type="text"
                        value={editingCampaign.cause || ''}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, cause: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                        placeholder="Damdawi In senso / Leimin chhiatna"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-amber-800 uppercase">Target Amount (₹)</label>
                        <input
                          type="number"
                          value={editingCampaign.targetAmount || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, targetAmount: parseFloat(e.target.value) || undefined })}
                          className="w-full mt-1 p-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-amber-800 uppercase">Max Limit (₹)</label>
                        <input
                          type="number"
                          value={editingCampaign.maxLimit || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, maxLimit: parseFloat(e.target.value) || undefined })}
                          className="w-full mt-1 p-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                          placeholder="100000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editingCampaign.category === 'kumtluang' && (
                  <div className="space-y-3 bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200">
                    <h4 className="text-[10.5px] font-black uppercase text-indigo-900 tracking-wider">Kumtluang Bawm Specifics</h4>

                    <div>
                      <label className="text-[10px] font-extrabold text-indigo-800 uppercase">Organization / Kohhran Hming</label>
                      <input
                        type="text"
                        value={editingCampaign.orgName || ''}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, orgName: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800"
                        placeholder="BCM Ebenezer, Zobawk"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-indigo-800 uppercase">Subcategories (Comma separated)</label>
                      <input
                        type="text"
                        value={editingCampaign.subCategories ? editingCampaign.subCategories.join(', ') : ''}
                        onChange={(e) => {
                          const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setEditingCampaign({ ...editingCampaign, subCategories: list });
                        }}
                        className="w-full mt-1 p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800"
                        placeholder="Pathian Ram Zauna, Mission, Building Fund, Tualchhung"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Image URL & Thumbnail */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase">Photo / Banner URL</label>
                  <div className="flex items-center gap-3">
                    {editingCampaign.imageUrl ? (
                      <img
                        src={editingCampaign.imageUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={editingCampaign.imageUrl || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, imageUrl: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                      placeholder="https://... or data:image/..."
                    />
                  </div>
                </div>

                {/* 4. Admin Approval Remarks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase">Admin Remarks / Moderation Notes</label>
                  <input
                    type="text"
                    value={editingCampaign.approvalRemarks || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, approvalRemarks: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                    placeholder="e.g. Verified by Admin on 19-Aug-2026"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Save & Update Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Creator License / Category Approval Modal Sheet */}
        {editingCreator && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-indigo-200 space-y-4 text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Creator Rights & License Grant</h3>
                  <p className="text-[10.5px] text-slate-500">{editingCreator.name} ({editingCreator.phone})</p>
                </div>
                <button
                  onClick={() => setEditingCreator(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Categories check */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">Approved Bawm Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ralna', 'khawlsak', 'rikrum', 'kumtluang', 'others'] as BawmCategory[]).map(cat => {
                    const isSelected = selectedCreatorCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCreatorCategories(prev =>
                            isSelected ? prev.filter(c => c !== cat) : [...prev, cat]
                          );
                        }}
                        className={`p-2 rounded-xl text-xs font-bold border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span>{BAWM_CONFIG[cat]?.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* License duration */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-extrabold text-slate-600 uppercase">License Validity Period</label>
                <select
                  value={licenseDuration}
                  onChange={(e) => setLicenseDuration(parseInt(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value={30}>1 Month Trial (30 days)</option>
                  <option value={90}>3 Months (90 days)</option>
                  <option value={180}>6 Months (180 days)</option>
                  <option value={365}>1 Year Full License (365 days)</option>
                  <option value={1825}>5 Years Extended NGO License</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCreator(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveCreator(editingCreator)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-xl text-xs transition shadow-xs"
                >
                  Save & Grant License
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
