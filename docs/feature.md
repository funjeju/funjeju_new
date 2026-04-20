# STAYLINK — Feature 현황

> 제주 스마트 관광 플랫폼 | Next.js (App Router) + Firebase + Gemini AI
> 마지막 업데이트: 2026-04-20

---

## ✅ 구현 완료

### 1. 레이아웃 & 공통 UI
- **Header** (`components/layout/Header.tsx`) — 로그인 상태 반영, 프로필/로그아웃 버튼
- **MobileTabBar** (`components/layout/MobileTabBar.tsx`) — 하단 탭바 (모바일)
- **FloatingChatbot** (`components/layout/FloatingChatbot.tsx`) — 우하단 플로팅 버튼, 모바일 슬라이드업 / PC 사이드 드로어
- **LiveBadge** (`components/ui/LiveBadge.tsx`) — 빨간 LIVE 뱃지
- **LoginPrompt** (`components/ui/LoginPrompt.tsx`) — 비로그인 접근 시 유도 모달
- 스켈레톤 로딩 애니메이션 (홈 페이지 전체)

### 2. 인증 (Firebase Auth)
- Google 소셜 로그인 (`/auth`)
- 로그인/로그아웃, 세션 유지
- `authStore` (Zustand) — 전역 유저 상태

### 3. 홈 페이지 (`/`)
- **Hero 섹션** — 랜덤 CCTV 선택, 실시간 영상 보기 버튼 (팝업 900×620)
- **지금 제주 Live 피드** — freshScore 정렬, 최대 8개 그리드 표시
- **이번 주 미션** — 가로 스크롤 카드
- **오름 스탬프 Pick** — 3개 그리드

### 4. CCTV 시스템
- **지도 페이지** (`/map`) — 카카오맵 마커, 태그 필터(해안/도심/오름/항구/드라이브)
- **CCTVPopup** (`components/cctv/CCTVPopup.tsx`) — 마커 클릭 시 팝업
- **CCTVPlayer** (`components/cctv/CCTVPlayer.tsx`) — ubin.onpr.co.kr 연동
- **새 창 팝업** — 컴팩트 팝업(900×620, 화면 중앙 정렬)
- **HLS 프록시** (`/api/hls-proxy`) — Node.js 런타임, 서울/도쿄 리전
- **CCTV Seed** (`/api/seed`) — 44개 제주 공식 CCTV 데이터
- Firestore 컬렉션: `cctv_locations`

### 5. Live 피드 (소상공인)
- **피드 전용 페이지** (`/live-feed`) — EXIF 오버레이, CTA 버튼, freshScore 컬러
- **파트너 업로드** (`/partner/upload`) — 사진 업로드, EXIF 파싱, Gemini Vision 자동 CTA 생성
- **freshScore 시스템** — EXIF 촬영 시각 기반 신선도 점수 (100→0)
- **Gemini Vision** — 사진 분석 후 caption + CTA 자동 생성
- **피드 만료 크론** (`/api/cron/expire-feeds`) — 오래된 피드 자동 만료
- **썸네일 크론** (`/api/cron/thumbnail`) — 썸네일 자동 생성
- **라이브 피드 API** (`/api/live-feed`, `/api/live-feed/upload`)
- Firestore 컬렉션: `live_feeds` (복합 인덱스: isApproved + freshScore + createdAt)

### 6. AI 챗봇 (`ChatPanel`)
- **도슨트 AI 탭** — Gemini 기반 제주 여행 가이드, GPS 주변 POI 컨텍스트 주입
- **날씨캐스터 탭** — 기상청 API 연동, AI 브리핑, 수치 카드(기온/습도/바람/강수확률), 오름 추천
- **탭 분리 UI** — 하단 탭으로 도슨트/날씨캐스터 전환
- Quick Questions 버튼 (빈 대화 상태)
- `chatStore` (Zustand) — 메시지 기록, 탭 상태

### 7. 날씨
- **날씨 API** (`/api/weather`) — 기상청 KMA 연동, Gemini 브리핑 생성
- **날씨 페이지** (`/weather`)

### 8. 오름 (Oreum)
- **오름 목록** (`/oreums`) — 지역/난이도 필터, 검색, 무한스크롤(24개)
- **오름 상세** (`/oreums/[id]`) — 상세 정보
- **OreumCard** (`components/oreum/OreumCard.tsx`)
- **StampAnimation** (`components/oreum/StampAnimation.tsx`)
- **스탬프 시스템** — 로그인 유저 스탬프 기록
- Firestore 컬렉션: `oreums`, `oreum_stamps`
- 오름 데이터 Import API (`/api/import-oreums`)

### 9. 미션
- **미션 목록** (`/missions`) — 필터(전체/진행중/완료/해안/오름)
- **미션 상세** (`/missions/[id]`)
- **MissionCard** (`components/mission/MissionCard.tsx`)
- **GPS 인증 버튼** (`components/mission/GPSVerifyButton.tsx`) — GPS 기반 현장 인증
- **진행 상태 추적** — `mission_progress` 컬렉션
- GPS 유틸 (`lib/utils/gps.ts`)

### 10. 마이페이지 (`/mypage`)
- 프로필 (Google 사진, 이름, 이메일)
- 통계 카드 (오름 스탬프 수 / 미션 완료 수 / 포인트)
- **소상공인 파트너 프로필 설정** — 업체명, CTA 유형, 버튼 문구, 전화/URL 저장
- 파트너 뱃지 표시
- 찜한 오름 / 내 미션 현황 / 쿠폰함 메뉴

### 11. 제주 소식 YouTube (`/jeju-tube`)
- 카테고리 필터 (여행/맛집/자연/문화/액티비티)
- YouTube 동기화 API (`/api/jeju-tube/sync`)
- 관리자 YouTube 관리 페이지 (`/admin/jeju-tube`)
- **현재 샘플 데이터로 표시 중** (실제 YouTube API 연동 미완)

### 12. 관리자 (`/admin`)
- **관리자 대시보드** — 이메일 기반 접근 제어
- CCTV 관리 (`/admin/cctv`)
- 오름 관리 (`/admin/oreums`)
- 미션 관리 (`/admin/missions`)
- 라이브 피드 관리 (`/admin/live-feeds`) — 승인/거절
- 제주 소식 관리 (`/admin/jeju-tube`)
- 데이터 Import 버튼 (CCTV Seed, POI 5,981개, 오름)

### 13. POI 데이터
- POI Import API (`/api/import-pois`) — 200개씩 배치 처리, 5,981개
- GPS 기반 주변 POI 검색 (챗봇 컨텍스트)
- Firestore 컬렉션: `pois`

### 14. 인프라
- Firebase (Auth + Firestore + Storage)
- Vercel 배포 (`vercel.json`, 서울/도쿄 리전)
- Gemini AI (`lib/gemini/client.ts`)
- 카카오맵 (`components/map/KakaoMap.tsx`)
- Zustand 상태관리 (`authStore`, `chatStore`)
- useGPS 훅 (`hooks/useGPS`)
- useAuth 훅 (`hooks/useAuth`)
- HLS 스트림 유틸 (`lib/utils/hls.ts`)

---

### 15. 지오캐싱 시스템 (`/geocaching`) — 2026-04-20 추가
- **메인 목록 페이지** (`/geocaching`) — 타입·거리·선물 필터, 정렬, 달성률 배너
- **캐시 상세 페이지** (`/geocaching/[id]`) — GPS 인증, 힌트, 로그북, 트래블 아이템
- **캐시 등록 폼** (`/geocaching/new`) — 4단계 위저드 (타입·위치·힌트·연계)
- **관리자 승인 페이지** (`/admin/geocaching`) — 승인/비공개/비활성화/보관

**캐시 타입 6종:**
- 전통(Traditional): 좌표에 실제 용기
- 멀티(Multi): 순차 웨이포인트 탐색
- 수수께끼(Mystery): 퍼즐 풀어 실제 좌표 획득
- 가상(Virtual): 용기 없이 현장 질문 답변
- 자연(EarthCache): 지질·자연 학습 후 인증
- 챌린지(Challenge): 조건 충족(캐시수/스탬프/미션) 후 인증

**힌트 시스템:**
- 사진 힌트 최대 3장 (블러 처리 → 클릭으로 공개)
- 텍스트 힌트 (ROT13 암호화, 버튼 클릭으로 해독)
- 라이트박스 확대

**GPS 인증:**
- `GPSCacheVerify` — 단일 지점 거리 게이지 + 프로그레스 바
- `MultiCacheVerify` — 웨이포인트 단계별 순차 인증, 단서 공개
- 챌린지 조건 미충족 시 인증 차단

**선물/보상 시스템:**
- 실물 선물 / 쿠폰 / 포인트 / 오름 스탬프 연계
- 선물 수령 여부 로그에 기록

**로그북:**
- 찾았어요 / 못 찾았어요(DNF) / 메모 / 관리 필요 4종
- 사진 첨부
- 전체 로그 목록 표시

**트래블 아이템 (Travel Bug):**
- 캐시 간 이동하는 물건 추적
- 이동 거리·방문 캐시 수 카운트

**챌린지 조건 5종:**
- N개 캐시 발견 / N개 오름 스탬프 / N개 미션 완료
- 특정 캐시 목록 전부 발견 / 특정 지역 캐시 발견

**연계:**
- 오름 스탬프 연계 (`linkedOreumId`)
- 미션 연계 (`linkedMissionId`)

**즐겨찾기:** favoriteCount 증감

**Firestore 컬렉션:**
- `geocaches`: 캐시 문서
- `cache_logs`: 발견/DNF/메모 로그
- `cache_trackables`: 트래블 아이템
- `cache_progress`: 멀티캐시 진행 상태

**API 라우트:**
- `GET/POST /api/geocaching` — 목록 조회
- `GET /api/geocaching/[id]` — 상세 조회
- `PATCH /api/geocaching/[id]` — 관리자 수정
- `POST /api/geocaching/[id]/log` — 로그 등록

**네비게이션:**
- PC 헤더에 `📦 지오캐싱` 추가
- 모바일 탭바에 `📦 보물` 추가
- 관리자 대시보드에 `🗺 지오캐싱` 카드 추가

---

## ❌ 미구현 / 미완성

### 기능 미완성
- **제주 소식 YouTube API 실연동** — 현재 하드코딩 샘플 데이터 사용 중
- **쿠폰함** — 마이페이지에 메뉴만 있고 페이지/기능 없음
- **찜(즐겨찾기)** — 오름/미션 찜 기능 UI만 있고 저장 로직 미구현
- **포인트 시스템** — 마이페이지에 필드는 있으나 적립/사용 로직 없음
- **미션 보상 지급** — 미션 완료 시 포인트 지급 로직 미구현
- **파트너 피드 승인 플로우** — 관리자 승인 페이지는 있으나 알림/워크플로우 없음
- **오름 썸네일 이미지** — 대부분 실제 사진 없이 이모지 placeholder

### 페이지 미완성
- `/weather` 페이지 — 파일 존재하나 내용 미확인 (ChatPanel WeatherTab으로 통합 운영 중)
- 쿠폰함 페이지 (`/coupons` 또는 유사)
