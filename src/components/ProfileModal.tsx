import React from 'react';
import { 
  X, 
  UserCheck, 
  ShieldCheck, 
  Phone, 
  Building2, 
  Ribbon, 
  HandHeart, 
  AlertTriangle, 
  Infinity as InfinityIcon, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  LogOut, 
  LogIn,
  Fingerprint,
  Lock,
  Unlock
} from 'lucide-react';
import { CreatorProfile, BawmCategory } from '../types';
import { BAWM_CONFIG } from '../data/initialData';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorProfile: CreatorProfile;
  onResetData: () => void;
  onOpenPhonePePortal?: () => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onOpenAdmin?: () => void;
  biometricEnabled?: boolean;
  onToggleBiometric?: () => void;
  onLockNow?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  creatorProfile,
  onResetData,
  onOpenPhonePePortal,
  onLogout,
  onLoginClick,
  onOpenAdmin,
  biometricEnabled = true,
  onToggleBiometric,
  onLockNow,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3.5 shadow-2xl border border-indigo-200 relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-900 to-purple-900 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-black shadow-md border-2 border-amber-300">
            {creatorProfile.name ? creatorProfile.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <h3 className="font-black text-slate-900 text-sm mt-1">{creatorProfile.name || 'RonPay User'}</h3>
          <p className="text-[10px] text-slate-500 font-medium">{creatorProfile.designation || 'Creator Member'} • {creatorProfile.orgName || 'Mizoram Branch'}</p>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Mobile:</span>
            <span className="font-bold text-slate-800">{creatorProfile.phone || '9862300000'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Account Status:</span>
            <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[9.5px]">
              {creatorProfile.isApproved ? 'APPROVED CREATOR' : 'STANDARD USER'}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-2">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
              Active Bawm Creator Rights:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {creatorProfile.approvedCategories.map(cat => (
                <span key={cat} className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" /> {BAWM_CONFIG[cat].name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Biometric Security Control Box */}
        <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200/90 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              <span className="font-black text-[11px] text-slate-900">Biometric Lock</span>
            </div>
            {onToggleBiometric && (
              <button
                type="button"
                onClick={onToggleBiometric}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  biometricEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    biometricEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Fingerprint / Face ID protection for Sulhnu History & Personal Profile.
          </p>
          {biometricEnabled && onLockNow && (
            <button
              type="button"
              onClick={() => {
                onLockNow();
                onClose();
              }}
              className="w-full mt-1 bg-white hover:bg-slate-100 border border-indigo-200 text-indigo-700 font-bold py-1.5 px-2 rounded-xl text-[10.5px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Lock className="w-3 h-3" /> Lock App / Reset Session
            </button>
          )}
        </div>

        {/* PhonePe PG V2 Management Trigger */}
        {onOpenPhonePePortal && (
          <button
            onClick={() => {
              onClose();
              onOpenPhonePePortal();
            }}
            className="w-full bg-purple-50 hover:bg-purple-100/90 border border-purple-200 text-purple-900 p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PhonePe TSP & PG V2 Portal
            </span>
            <span className="text-[10px] text-purple-600 font-mono">UAT</span>
          </button>
        )}

        {/* Master Admin Console Trigger */}
        {onOpenAdmin && (
          <button
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-400/40 text-amber-300 p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              RonPay Admin Console
            </span>
            <span className="text-[9.5px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-black uppercase">
              Admin Login
            </span>
          </button>
        )}

        {/* Creator Session Login / Logout Action */}
        {creatorProfile.isApproved ? (
          onLogout && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black p-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" /> Creator Logout (Back to Normal User)
            </button>
          )
        ) : (
          onLoginClick && (
            <button
              onClick={() => {
                onClose();
                onLoginClick();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black p-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Creator Login / In-Register
            </button>
          )
        )}

        <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200 text-center">
          <p className="text-[10px] text-amber-900 font-bold">
            RonPay Community Platform v2.5
          </p>
          <p className="text-[9px] text-amber-800/80">Protected with Biometrics & End-to-End Integrity</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onResetData}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[10.5px] transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Demo
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-[10.5px] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
