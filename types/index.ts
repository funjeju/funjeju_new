import { Timestamp } from 'firebase/firestore';

// ====== CCTV ======
export interface CCTVLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  streamUrl: string;
  tags: string[];
  nearbyPoiIds: string[];
  nearbyOreumIds: string[];
  isActive: boolean;
  thumbnailUrl: string;
  lastThumbnailAt: Timestamp;
  region: string;
}

// ====== POI ======
export interface POI {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'accommodation' | 'cafe';
  lat: number;
  lng: number;
  address: string;
  description: string;
  phone?: string;
  hours?: string;
  tags: string[];
  thumbnailUrl: string;
  partnerId?: string;
  source: 'admin' | 'visitjeju' | 'tourapi' | 'partner';
}

// ====== 파트너 업체 ======
export interface Partner {
  uid: string;
  bizName: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  description: string;
  menuInfo?: string;
  photos: string[];
  approved: boolean;
  createdAt: Timestamp;
}

// ====== 회원 ======
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  type: 'user' | 'partner';
  createdAt: Timestamp;
  stampCount: number;
  missionCompleteCount: number;
  savedPoiIds: string[];
  savedOreumIds: string[];
  points: number;
}

// ====== 미션 ======
export interface MissionSpot {
  order: 1 | 2 | 3;
  name: string;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  thumbnailUrl: string;
  hint?: string;
}

export interface MissionReward {
  type: 'coupon' | 'point' | 'mixed';
  points?: number;
  couponId?: string;
  description: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  tags: string[];
  spots: MissionSpot[];
  reward: MissionReward;
  isPublished: boolean;
  createdAt: Timestamp;
  participantCount: number;
  linkedOreumIds?: string[];
}

// ====== 미션 진행 ======
export interface MissionProgress {
  id: string;
  uid: string;
  missionId: string;
  status: 'in_progress' | 'completed';
  completedSpots: number[];
  startedAt: Timestamp;
  completedAt?: Timestamp;
}

// ====== 오름 ======
export interface Oreum {
  id: string;
  name: string;
  nameOrigin: string;
  description: string;
  characteristics: string;
  lat: number;
  lng: number;
  stampLat: number;
  stampLng: number;
  altitude: number;
  address: string;
  region: string;
  direction: 'E' | 'W' | 'S' | 'N';
  difficulty: 1 | 2 | 3 | 4 | 5;
  bestSeasons: ('spring' | 'summer' | 'autumn' | 'winter')[];
  monthKeywords: number[];
  tags: string[];
  parking: string;
  trailInfo: string;
  openTime: string;
  photos: {
    main: string[];
    summit: string[];
    parking: string[];
    trail: string[];
    view: string[];
  };
  thumbnailUrl: string;
  thumbnailBwUrl: string;
  nearbyPoiIds: string[];
  linkedMissionIds: string[];
  nearestCctvId?: string;
  isPublished: boolean;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  stampCount: number;
}

// ====== 오름 스탬프 ======
export interface OreumStamp {
  id: string;
  uid: string;
  oreumId: string;
  oreumName: string;
  stampedAt: Timestamp;
  lat: number;
  lng: number;
  photoUrl?: string;
}

// ====== 오름 유저 업로드 사진 ======
export interface OreumUserPhoto {
  id: string;
  uid: string;
  userName: string;
  section: 'summit' | 'parking' | 'trail' | 'view' | 'etc';
  photoUrl: string;
  uploadedAt: Timestamp;
  approved: boolean;
}

// ====== 쿠폰 ======
export interface Coupon {
  id: string;
  title: string;
  description: string;
  partnerId?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  expiresAt: Timestamp;
  isActive: boolean;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  title: string;
  isUsed: boolean;
  issuedAt: Timestamp;
  usedAt?: Timestamp;
  source: 'mission' | 'event' | 'admin';
  sourceMissionId?: string;
}

// ====== 날씨 캐시 ======
export interface WeatherCache {
  cctvId: string;
  visionAnalysis: {
    sky: string;
    cloudType: string;
    wave: string;
    wind: string;
    visibility: string;
    foggy: boolean;
    condition: string;
  };
  kmaData: {
    temp: number;
    humidity: number;
    windSpeed: number;
    windDir: string;
    rainProb: number;
  };
  briefing: string;
  updatedAt: Timestamp;
}

// ====== Live 피드 (소상공인 사진 + EXIF + CTA) ======
export interface LiveFeed {
  id: string;
  partnerId: string;
  businessName: string;
  photoUrl: string;
  caption?: string;
  region: string;
  tags: string[];
  // EXIF 추출 위치
  exifLat?: number;
  exifLng?: number;
  exifTakenAt?: Timestamp;
  // CTA 자동생성
  ctaType: 'visit' | 'call' | 'menu' | 'reserve';
  ctaLabel: string;
  ctaUrl?: string;
  ctaPhone?: string;
  isApproved: boolean;
  createdAt: Timestamp;
}

// ====== 유튜브 캐시 ======
export interface JejuTubeCache {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  summary: string;
  category: string;
  publishedAt: Timestamp;
  cachedAt: Timestamp;
}
