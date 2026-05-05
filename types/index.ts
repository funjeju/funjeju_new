import { Timestamp } from 'firebase/firestore';

// ====== CCTV ======
export interface CCTVLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  streamUrl: string;
  tags: string[];
  direction?: '동' | '서' | '남' | '북';
  nearbyPoiIds: string[];
  nearbyOreumIds: string[];
  isActive: boolean;
  thumbnailUrl: string;
  lastThumbnailAt: Timestamp;
  region: string;
  ubinWrId?: number;
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

// ====== 지오캐싱 ======

export type CacheType =
  | 'traditional'  // 전통: 좌표에 캐시 존재
  | 'multi'        // 멀티: 여러 웨이포인트 순차 탐색
  | 'mystery'      // 수수께끼: 퍼즐 풀어 실제 좌표 획득
  | 'virtual'      // 가상: 용기 없이 질문 답변으로 인증
  | 'earthcache'   // 자연: 지질/자연 학습 후 인증
  | 'challenge';   // 챌린지: 조건 충족 후 인증 가능

export type CacheSize = 'nano' | 'micro' | 'small' | 'regular' | 'large' | 'virtual' | 'other';

export type GiftType = 'physical' | 'coupon' | 'points' | 'stamp';

export type LogType = 'found' | 'dnf' | 'note' | 'needs_maintenance' | 'owner_maintenance';

export type TrackableLogType = 'picked_up' | 'dropped_off' | 'discovered' | 'grabbed_from_owner';

// 멀티캐시 웨이포인트
export interface CacheWaypoint {
  order: number;
  label: string;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  clue?: string; // 이 지점에서 얻는 다음 단서
}

// 챌린지 조건
export interface ChallengeRequirement {
  type: 'cache_count' | 'stamp_count' | 'mission_count' | 'specific_caches' | 'region_caches';
  count?: number;
  cacheIds?: string[];  // specific_caches
  region?: string;      // region_caches
  description: string;  // 사람이 읽는 조건 설명
}

// 선물/보상
export interface CacheGift {
  type: GiftType;
  description: string;
  points?: number;
  couponId?: string;
  oreumStampId?: string; // stamp 타입일 때 연결 오름
}

// 메인 지오캐시 문서
export interface Geocache {
  id: string;
  title: string;
  description: string;
  type: CacheType;
  difficulty: number;    // 1.0 ~ 5.0 (0.5 단위)
  terrain: number;       // 1.0 ~ 5.0 (0.5 단위)
  size: CacheSize;
  lat: number;
  lng: number;
  radiusMeters: number;  // 인증 반경 (기본 30m)
  region: string;
  tags: string[];

  // 힌트
  hintText?: string;           // 텍스트 힌트 (ROT13 암호화 저장)
  hintPhotos: string[];        // 사진 힌트 최대 3장 URL

  // 선물
  hasGift: boolean;
  gift?: CacheGift;

  // 멀티캐시
  waypoints?: CacheWaypoint[];  // multi 타입

  // 챌린지 조건
  challengeRequirement?: ChallengeRequirement;  // challenge 타입

  // 연동
  linkedMissionId?: string;
  linkedOreumId?: string;

  // 트래블 아이템 (이 캐시에 있는 아이템 ID 목록)
  trackableIds: string[];

  // 통계
  foundCount: number;
  dnfCount: number;
  favoriteCount: number;

  // 관리
  createdBy: string;       // uid
  createdByName: string;
  isPublished: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Timestamp;
  lastFoundAt?: Timestamp;
}

// 발견 로그
export interface CacheLog {
  id: string;
  cacheId: string;
  cacheTitle: string;
  uid: string;
  userName: string;
  userPhotoUrl?: string;
  type: LogType;
  comment: string;
  photoUrl?: string;
  loggedAt: Timestamp;
  isGiftClaimed?: boolean;
  // 멀티캐시: 완료한 웨이포인트 순서
  completedWaypoints?: number[];
}

// 트래블 아이템 (캐시 간 이동하는 물건)
export interface CacheTrackable {
  id: string;
  name: string;
  description: string;
  goal: string;          // 이 아이템의 목표 (예: "한라산 정상에 가고 싶어요")
  photoUrl?: string;
  currentCacheId?: string;
  currentCacheName?: string;
  totalDistanceKm: number;
  visitedCacheCount: number;
  createdBy: string;
  createdAt: Timestamp;
  isActive: boolean;
}

export interface TrackableLog {
  id: string;
  trackableId: string;
  cacheId: string;
  cacheName: string;
  uid: string;
  userName: string;
  type: TrackableLogType;
  comment?: string;
  loggedAt: Timestamp;
}

// 유저별 지오캐싱 통계 (users 문서 내 서브필드)
export interface UserGeocacheStats {
  cachesFound: number;
  cachesDnf: number;
  cachesHidden: number;
  favoritePointsGiven: number;
  challengesCompleted: number;
  trackablesDiscovered: number;
}
