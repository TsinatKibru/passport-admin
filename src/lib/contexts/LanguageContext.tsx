'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'am';

type Translations = Record<string, string>;

const amharicTranslations: Translations = {
  // Sidebar
  'sidebar.main': 'ዋና',
  'sidebar.management': 'አስተዳደር',
  'sidebar.settings': 'ቅንብሮች',
  'sidebar.dashboard': 'ዳሽቦርድ',
  'sidebar.passports': 'ፓስፖርቶች',
  'sidebar.boxes': 'ሳጥኖች',
  'sidebar.structure': 'መዋቅር',
  'sidebar.logs': 'የኦዲት መዝገቦች',
  'sidebar.profile': 'መገለጫ',
  'sidebar.security': 'ደህንነት',
  'sidebar.setup': 'ማዋቀር',
  'sidebar.logout': 'ውጣ',

  // Header
  'header.search_placeholder': 'ፓስፖርቶች፣ ሳጥኖች፣ ቦታዎችን ፈልግ...',
  'header.profile_tooltip': 'መገለጫ እይ',
  'header.search_no_results': 'ምንም ውጤት አልተገኘም',
  'header.search_searching': 'በመፈለግ ላይ...',
  'header.search_min_char': 'ቢያንስ 2 ቁምፊዎችን ያስገቡ',

  // Dashboard
  'dashboard.title': 'የዳሽቦርድ አጠቃላይ እይታ',
  'dashboard.subtitle': 'የእውነተኛ ጊዜ ክትትል ማጠቃለያ',
  'dashboard.total_boxes': 'አጠቃላይ ተንቀሳቃሽ ሳጥኖች',
  'dashboard.total_boxes_sub': 'ሁሉም የተመዘገቡ ሳጥኖች',
  'dashboard.occupied_boxes': 'የተያዙ ሳጥኖች',
  'dashboard.occupied_boxes_sub': 'በአሁኑ ጊዜ በጥቅም ላይ ያሉ',
  'dashboard.vacant_boxes': 'ክፍት ሳጥኖች',
  'dashboard.vacant_boxes_sub': 'ለአገልግሎት ዝግጁ የሆኑ',
  'dashboard.occupancy_rate': 'የመያዝ መጠን',
  'dashboard.occupancy_rate_sub': 'አጠቃላይ አጠቃቀም',
  'dashboard.table_title': 'የተንቀሳቃሽ ሳጥን አጠቃላይ እይታ',
  'dashboard.refresh': 'አድስ',
  'dashboard.showing_recent': 'የቅርብ ጊዜዎቹን እያሳየ ነው',
  'dashboard.view_all': 'ሁሉንም እይ',
  'dashboard.col_box_id': 'የሳጥን መለያ',
  'dashboard.col_label': 'ስም',
  'dashboard.col_location': 'ቦታ',
  'dashboard.col_occupied': 'የተያዙ',
  'dashboard.col_capacity': 'አቅም',
  'dashboard.col_status': 'ሁኔታ',
  'dashboard.loading_stats': 'የዳሽቦርድ ስታቲስቲክስ በመጫን ላይ...',

  // Passports page
  'passports.title': 'የፓስፖርት ምዝገባ',
  'passports.subtitle': 'ሁሉንም ፓስፖርቶች ያስተዳድሩ እና ይከታተሉ',
  'passports.add_passport': 'አዲስ ፓስፖርት ይመዝግቡ',
  'passports.search_placeholder': 'በስም ፣ በመለያ ቁጥር ወይም በQR ፈልግ...',
  'passports.col_holder': 'ባለቤት',
  'passports.col_passport_no': 'የፓስፖርት ቁጥር',
  'passports.col_qr_code': 'የQR ኮድ',
  'passports.col_status': 'ሁኔታ',
  'passports.status_active': 'ንቁ',
  'passports.status_inactive': 'ያልነቃ',

  // Boxes page
  'boxes.title': 'ተንቀሳቃሽ ሳጥኖች',
  'boxes.subtitle': 'የተንቀሳቃሽ ሳጥኖችን አቀማመጥ እና ሁኔታ ይቆጣጠሩ',
  'boxes.add_box': 'አዲስ ሳጥን ፍጠር',

  // Structure page
  'structure.title': 'የአካላዊ መዋቅር አቀማመጥ',
  'structure.subtitle': 'ክፍሎችን፣ መደርደሪያዎችን፣ ረድፎችን እና ቦታዎችን ያዋቅሩ',

  // Logs page
  'logs.title': 'የስርዓት ኦዲት መዝገቦች',
  'logs.subtitle': 'የስርዓት እንቅስቃሴዎችን እና እንቅስቃሴዎችን ይከታተሉ',

  // Security page
  'security.title': 'ደህንነት እና የተጠቃሚዎች አስተዳደር',
  'security.subtitle': 'የስርዓት ተጠቃሚዎችን እና ፍቃዶችን ያስተዳድሩ',

  // Profile page
  'profile.title': 'የተጠቃሚ መገለጫ ቅንብሮች',
  'profile.subtitle': 'የመገለጫ መረጃዎን ያስተዳድሩ',

  // Setup page
  'setup.title': 'የስርዓት መጀመሪያ ማዋቀሪያ',
  'setup.subtitle': 'አጠቃላይ የስርዓት መረጃዎችን እዚህ ይቆጣጠሩ',
};

const englishTranslations: Translations = {
  // Sidebar
  'sidebar.main': 'MAIN',
  'sidebar.management': 'MANAGEMENT',
  'sidebar.settings': 'SETTINGS',
  'sidebar.dashboard': 'Dashboard',
  'sidebar.passports': 'Passports',
  'sidebar.boxes': 'Boxes',
  'sidebar.structure': 'Structure',
  'sidebar.logs': 'Audit Logs',
  'sidebar.profile': 'Profile',
  'sidebar.security': 'Security',
  'sidebar.setup': 'Setup',
  'sidebar.logout': 'Logout',

  // Header
  'header.search_placeholder': 'Search passports, boxes, slots...',
  'header.profile_tooltip': 'View Profile',
  'header.search_no_results': 'No results found',
  'header.search_searching': 'Searching...',
  'header.search_min_char': 'Type at least 2 characters',

  // Dashboard
  'dashboard.title': 'Dashboard Overview',
  'dashboard.subtitle': 'Real-time tracking summary',
  'dashboard.total_boxes': 'Total Movable Boxes',
  'dashboard.total_boxes_sub': 'All registered boxes',
  'dashboard.occupied_boxes': 'Occupied Boxes',
  'dashboard.occupied_boxes_sub': 'Currently in use',
  'dashboard.vacant_boxes': 'Vacant Boxes',
  'dashboard.vacant_boxes_sub': 'Available for use',
  'dashboard.occupancy_rate': 'Occupancy Rate',
  'dashboard.occupancy_rate_sub': 'Overall utilization',
  'dashboard.table_title': 'Movable Box Overview',
  'dashboard.refresh': 'Refresh',
  'dashboard.showing_recent': 'Showing most recent',
  'dashboard.view_all': 'View all',
  'dashboard.col_box_id': 'Box ID',
  'dashboard.col_label': 'Label',
  'dashboard.col_location': 'Location',
  'dashboard.col_occupied': 'Occupied',
  'dashboard.col_capacity': 'Capacity',
  'dashboard.col_status': 'Status',
  'dashboard.loading_stats': 'Loading dashboard statistics...',

  // Passports page
  'passports.title': 'Passport Registry',
  'passports.subtitle': 'Manage and track all passports',
  'passports.add_passport': 'Register New Passport',
  'passports.search_placeholder': 'Search by name, ID number, or QR...',
  'passports.col_holder': 'Holder',
  'passports.col_passport_no': 'Passport No',
  'passports.col_qr_code': 'QR Code',
  'passports.col_status': 'Status',
  'passports.status_active': 'Active',
  'passports.status_inactive': 'Inactive',

  // Boxes page
  'boxes.title': 'Movable Boxes',
  'boxes.subtitle': 'Manage movable boxes locations and status',
  'boxes.add_box': 'Create New Box',

  // Structure page
  'structure.title': 'Physical Structure Layout',
  'structure.subtitle': 'Configure rooms, shelves, rows and slots',

  // Logs page
  'logs.title': 'System Audit Logs',
  'logs.subtitle': 'Monitor system actions and movements',

  // Security page
  'security.title': 'Security & User Management',
  'security.subtitle': 'Manage system users and access levels',

  // Profile page
  'profile.title': 'User Profile Settings',
  'profile.subtitle': 'Manage your personal profile information',

  // Setup page
  'setup.title': 'System Initialization Setup',
  'setup.subtitle': 'Configure system defaults and meta metadata',
};

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale === 'en' || savedLocale === 'am') {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string, defaultValue?: string): string => {
    const translations = locale === 'am' ? amharicTranslations : englishTranslations;
    return translations[key] || defaultValue || key;
  };

  // SSR Safe rendering (defaults to English on server, updates on mount)
  return (
    <LanguageContext.Provider value={{ locale: isMounted ? locale : 'en', setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
