import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  QrCode, 
  MapPin, 
  ExternalLink, 
  Clock, 
  Calendar, 
  ChevronRight,
  Filter,
  Camera,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Maximize2,
  Share2,
  AlertCircle
} from 'lucide-react';
import { BawmCategory, Campaign } from '../types';
import { BAWM_CONFIG } from '../data/initialData';
import { formatDateDDMMYYYY, isCampaignExpired } from '../utils/date';
import { Language, TRANSLATIONS, translateDynamicText } from '../utils/translations';

interface BawmExplorerScreenProps {
  category: BawmCategory;
  campaigns: Campaign[];
  onBack: () => void;
  onSelectCampaign: (campaign: Campaign) => void;
  onStartScanner: (category: BawmCategory) => void;
  onPreviewImage?: (imageUrl: string, title?: string, subtitle?: string, location?: string) => void;
  onShareCampaign?: (campaign: Campaign) => void;
  language?: Language;
}

export const BawmExplorerScreen: React.FC<BawmExplorerScreenProps> = ({
  category,
  campaigns,
  onBack,
  onSelectCampaign,
  onStartScanner,
  onPreviewImage,
  onShareCampaign,
  language = 'mizo',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const config = BAWM_CONFIG[category];
  const t = TRANSLATIONS[language];

  // Filter campaigns strictly for this category & search query & active status
  const categoryCampaigns = campaigns.filter(c => c.category === category);
  
  // Extract unique locations for clean Veng-te selector
  const locations = Array.from(new Set(categoryCampaigns.map(c => c.location.split(',')[0].trim())));

  const filteredCampaigns = categoryCampaigns.filter(c => {
    // Location filter
    if (filterLocation !== 'all' && !c.location.includes(filterLocation)) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const locMatch = c.location.toLowerCase().includes(q);
      const mitthiMatch = c.mitthiHming ? c.mitthiHming.toLowerCase().includes(q) : false;
      const orgMatch = c.orgName ? c.orgName.toLowerCase().includes(q) : false;
      const idMatch = c.id.toLowerCase().includes(q);
      if (!titleMatch && !locMatch && !mitthiMatch && !orgMatch && !idMatch) {
        return false;
      }
    }
    return true;
  });

  const openGoogleMaps = (e: React.MouseEvent, coords: string) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps?q=${encodeURIComponent(coords || '23.7271, 92.7176')}`, '_blank');
  };

  const handleImageClick = (e: React.MouseEvent, camp: Campaign) => {
    e.stopPropagation();
    if (camp.imageUrl && onPreviewImage) {
      onPreviewImage(
        camp.imageUrl, 
        camp.title, 
        camp.mitthiHming ? `Mitthi: ${camp.mitthiHming} (${camp.age || 70} yrs)` : camp.cause || camp.orgName, 
        camp.location
      );
    }
  };

  const handleShareClick = (e: React.MouseEvent, camp: Campaign) => {
    e.stopPropagation();
    if (onShareCampaign) {
      onShareCampaign(camp);
    }
  };

  const isRalna = category === 'ralna';

  return (
    <div className="space-y-4 pb-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
        <button
          onClick={onBack}
          className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 hover:text-indigo-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className={`text-[9.5px] uppercase font-black px-2.5 py-1 rounded-md border ${
          isRalna ? 'bg-white text-slate-900 border-slate-300 shadow-xs' :
          category === 'khawlsak' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
          category === 'rikrum' ? 'bg-rose-100 text-rose-900 border-rose-300' :
          'bg-blue-100 text-blue-900 border-blue-300'
        }`}>
          {config.name} Hub
        </span>
      </div>

      {/* Category Hero / Summary Banner */}
      <div className={`p-4 rounded-2xl border text-slate-800 shadow-xs relative overflow-hidden ${
        isRalna ? 'bg-gradient-to-br from-white via-slate-50 to-red-50/50 border-2 border-slate-200/90' :
        category === 'khawlsak' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 border-emerald-200' :
        category === 'rikrum' ? 'bg-gradient-to-br from-rose-50 to-rose-100/80 border-rose-200' :
        'bg-gradient-to-br from-blue-50 to-blue-100/80 border-blue-200'
      }`}>
        {/* YMA Tri-color accent for Ralna */}
        {isRalna && (
          <div className="absolute top-0 right-0 overflow-hidden rounded-bl-lg border-l border-b border-slate-200">
            <div className="flex h-3 w-14">
              <div className="flex-1 bg-black" />
              <div className="flex-1 bg-white border-x border-slate-200" />
              <div className="flex-1 bg-red-600" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h2 className="font-black text-sm text-slate-900">{config.name}</h2>
              {isRalna && (
                <span className="text-[8px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded border border-red-200 uppercase">
                  YMA PUAL
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-600">{config.subtitle}</p>
            <p className="text-[9.5px] font-bold pt-0.5 text-slate-500">
              Active Verified QRs: <span className="font-black text-slate-900">{categoryCampaigns.length}</span>
            </p>
          </div>

          <button
            onClick={() => onStartScanner(category)}
            className={`${
              isRalna ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200/90'
            } px-3 py-2 rounded-xl text-[10.5px] font-bold border shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0`}
          >
            <Camera className="w-3.5 h-3.5" /> Scan This Bawm
          </button>
        </div>
      </div>

      {/* Dedicated Search Engine & Clean Veng-te Selector */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-indigo-600" /> Search {config.name} Directory
          </label>
          <span className="text-[9px] text-slate-400 font-bold">
            Showing {filteredCampaigns.length} of {categoryCampaigns.length}
          </span>
        </div>

        {/* Search Input & Veng-te Dropdown in compact row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${category === 'ralna' ? 'Mitthi hming, veng...' : category === 'kumtluang' ? 'Kohhran / NGO / Veng...' : 'Title, veng, location...'}`}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-8.5 pr-3 text-xs font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition"
            />
          </div>

          <div>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 transition"
            >
              <option value="all">Veng-te: All Localities</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory List of Active QRs in this Bawm */}
      <div className="space-y-3">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">
              {language === 'english' ? 'No QR Codes found' : 'QR Code hmuh a ni lo'}
            </p>
            <p className="text-[10px] text-slate-500">
              {language === 'english' 
                ? `No matching campaigns for "${searchQuery}". Please try another search term or location filter.` 
                : `I thil zawn "${searchQuery}" nen inmil a awm lo. Zawn dan thlak la i hmu thei mai ang.`}
            </p>
          </div>
        ) : (
          filteredCampaigns.map((camp) => {
            const expired = isCampaignExpired(camp.validityDate, camp.status);
            const translatedTitle = translateDynamicText(camp.title, language);
            const translatedCause = translateDynamicText(camp.cause, language);

            return (
              <div
                key={camp.id}
                onClick={() => onSelectCampaign(camp)}
                className={`bg-white p-3.5 rounded-2xl border shadow-xs hover:shadow-md transition cursor-pointer space-y-3 group ${
                  expired ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/90 hover:border-indigo-400'
                }`}
              >
                <div className="flex gap-3">
                  {/* Clickable Photo to Enlarge or Icon */}
                  {camp.imageUrl ? (
                    <div 
                      onClick={(e) => handleImageClick(e, camp)}
                      className="relative group/img cursor-zoom-in shrink-0"
                      title="Click to view full photo"
                    >
                      <img
                        src={camp.imageUrl}
                        alt={camp.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs group-hover/img:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4 drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-xs shrink-0 ${
                      isRalna ? 'bg-red-600 border border-red-500 text-white' :
                      category === 'khawlsak' ? 'bg-emerald-600' :
                      category === 'rikrum' ? 'bg-rose-600' : 'bg-blue-600'
                    }`}>
                      <QrCode className="w-8 h-8" />
                    </div>
                  )}

                  {/* Campaign Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
                        {translatedTitle}
                      </h3>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase shrink-0 ${
                        expired 
                          ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {expired ? (language === 'english' ? 'EXPIRED' : 'HUN A TAWP') : (language === 'english' ? 'LIVE' : 'ACTIVE')}
                      </span>
                    </div>

                    {camp.mitthiHming && (
                      <p className="text-[10px] text-slate-600 font-medium">
                        {language === 'english' ? 'Deceased' : 'Mitthi'}: <span className="font-bold text-slate-800">{camp.mitthiHming}</span> ({language === 'english' ? `Age ${camp.age || 70}` : `Kum ${camp.age || 70}`})
                      </p>
                    )}

                    {camp.cause && (
                      <p className="text-[10px] text-slate-600 line-clamp-1 font-medium">
                        {translatedCause}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        onClick={(e) => openGoogleMaps(e, camp.gpsCoords)}
                        className="text-[9.5px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-rose-500" /> {camp.location}
                      </button>

                      <span className="text-[9px] font-bold text-slate-400">
                        {language === 'english' ? 'Validity' : 'Hun tawp'}: {formatDateDDMMYYYY(camp.validityDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Strip with Share QR & 'Pekna-ah lut rawh' */}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium font-mono text-[9.5px]">
                      UPI: {camp.upiId}
                    </span>
                    <button
                      onClick={(e) => handleShareClick(e, camp)}
                      className="p-1 px-2 text-[9.5px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition cursor-pointer border border-indigo-200 shadow-2xs"
                      title="Share QR code"
                    >
                      <Share2 className="w-3 h-3" /> {t.share}
                    </button>
                  </div>

                  {expired ? (
                    <span className="font-extrabold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {language === 'english' ? 'Contribution Closed' : 'Pek hun a tawp'}
                    </span>
                  ) : (
                    <span className="font-extrabold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {language === 'english' ? 'Proceed to Contribute' : 'Pekna-ah lut rawh'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
