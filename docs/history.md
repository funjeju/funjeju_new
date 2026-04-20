# STAYLINK — 개발 히스토리

> 이슈, 버그, 결정사항을 시간순으로 기록. 최신 항목이 위에 오도록 유지.

---

## 2026-04-20 (3) — 버그 수정

### ✅ Live Feed
- [BUG FIX] "수정하기" 클릭 시 이미 저장된 피드 DELETE API 호출로 고아 피드 방지
- [BUG FIX] `/live-feed` 페이지 정렬을 `freshScore desc → createdAt desc`로 수정 (홈과 동일)

### ✅ CCTV 지도
- [BUG FIX] `app/map/page.tsx` — `filtered`, `markers` 배열을 `useMemo`로 감싸 KakaoMap 불필요한 재초기화 방지
- [BUG FIX] `KakaoMap.tsx` — 카카오맵 스크립트 중복 추가 방지 (querySelector 체크)

### ✅ 오름 스탬프
- [BUG FIX] `oreums/page.tsx` — `oreum_stamps` 전체 조회 → `where('uid', '==', user.uid)` 쿼리로 변경

### ✅ 지오캐싱
- [BUG FIX] `geocaching/[id]/page.tsx` — `toggleFavorite` 해제 시 `arrayUnion()` → `arrayRemove(cache.id)` 수정
- [BUG FIX] `geocaching/[id]/page.tsx` — `submitLog`에 `alreadyFound` 체크 추가, found 중복 제출 차단
- [BUG FIX] `geocaching/[id]/page.tsx` — 페이지 레벨 `useGPS(true)` 중복 제거 (GPSCacheVerify 내부에서 처리)
- [BUG FIX] `geocaching/new/page.tsx` — 멀티캐시 등록 시 대표 좌표(현위치 버튼) UI 추가
- [BUG FIX] `firestore.indexes.json` — `cache_logs`, `geocaches`, `oreum_stamps` 복합 인덱스 추가

---

## 2026-04-20 (2)

### ✅ 지오캐싱 시스템 전체 구현
- **타입 시스템**: Geocache, CacheLog, CacheTrackable, CacheWaypoint, ChallengeRequirement 등 types/index.ts 추가
- **컴포넌트 4종**: GeocacheCard, HintPanel (ROT13 + 사진 블러), CacheLogForm, GPSCacheVerify (단일 + 멀티)
- **페이지 3종**: `/geocaching` (목록+달성률배너), `/geocaching/[id]` (상세+GPS인증+로그북), `/geocaching/new` (4단계 위저드)
- **관리자**: `/admin/geocaching` 승인·비공개·보관 관리
- **API**: `/api/geocaching`, `/api/geocaching/[id]`, `/api/geocaching/[id]/log`
- **네비**: 헤더 + 모바일 탭바에 지오캐싱 추가
- **Firestore 컬렉션**: geocaches, cache_logs, cache_trackables, cache_progress
- **이슈 트래킹에 추가**: 트래블 아이템 로그 UI, 힌트 사진 업로드 구현 필요

---

## 2026-04-20

### ✅ AI 챗봇 모달 탭 분리 (commit: 14066e7)
- ChatPanel을 도슨트 AI / 날씨캐스터 두 탭으로 분리
- 날씨캐스터: 기상청 KMA 수치 + AI 브리핑 + 오름 추천 자동 표시
- 도슨트 AI: Gemini + GPS 컨텍스트 기반 대화

### ✅ 파트너 프로필 마이페이지 저장 + 업로드 자동 적용 (commit: bd9528b)
- `/mypage`에서 업체명/CTA 저장 → `/partner/upload`에서 자동 로드
- 파트너 뱃지 표시 로직 추가

### ✅ 제주 소식 YouTube 관리 페이지 추가 (commit: c43dab6)
- `/admin/jeju-tube` 페이지 생성
- YouTube 동기화 API 라우트 (`/api/jeju-tube/sync`)

---

## 2026-04 (초기 ~ 19일)

### ✅ CCTV 팝업 변경 (commit: b33c9fb)
- 기존 새 창 → 컴팩트 팝업(900×620, 화면 중앙 정렬)으로 변경

### ✅ CCTV 영상 보기 버튼 항상 표시 (commit: 705efd5)
- ubinWrId 없어도 영상 보기 버튼 노출 (CCTV 목록 페이지 기본 URL fallback)

### ✅ Firestore 복합 인덱스 추가 (commit: 850d415)
- `live_feeds`: isApproved + freshScore + createdAt 복합 인덱스

### ✅ live_feeds CCTV 기반 seed 데이터 제거 (commit: 12f9895)
- live_feeds는 소상공인 업로드 전용으로 분리

### ✅ CCTV → ubin.onpr.co.kr 새 창 연동 (commit: f80adfb)

### ✅ HLS 프록시 수정 (commit: 07695c7)
- Node.js 런타임으로 변경, 서울/도쿄 리전 지정

### ✅ Live 피드 전용 페이지 (`/live-feed`) (commit: 2eb8422)
- EXIF 오버레이, freshScore 컬러, CTA 버튼

### ✅ 헤더 로그인 상태 반영 (commit: 189bde8)
- 로그인 시 프로필 사진 + 로그아웃 버튼 표시

### ✅ EXIF 기반 Live 피드 시스템 (commit: 713a6d3)
- freshScore: EXIF 촬영 시각 → 신선도 점수 계산
- Gemini Vision: 사진 분석 → caption + CTA 자동 생성
- freshLabel 배지 (LIVE / 1시간전 / 오늘 등)

---

## 이슈 트래킹

| 날짜 | 유형 | 내용 | 상태 |
|------|------|------|------|
| 2026-04-20 | BUG | jeju-tube 실제 YouTube API 미연동, 샘플 데이터 사용 중 | 🔴 미해결 |
| 2026-04-20 | TODO | 쿠폰함 페이지 미구현 | 🟡 백로그 |
| 2026-04-20 | TODO | 찜(즐겨찾기) 저장 로직 미구현 | 🟡 백로그 |
| 2026-04-20 | TODO | 포인트 적립/사용 로직 미구현 | 🟡 백로그 |
| 2026-04-20 | TODO | 미션 완료 시 포인트 지급 미구현 | 🟡 백로그 |
| 2026-04-20 | INFO | 오름 썸네일 대부분 placeholder | 🟡 백로그 |
| 2026-04-20 | TODO | 캐시 힌트 사진 업로드 UI 미구현 (등록 후 추가 필요) | 🔴 미해결 |
| 2026-04-20 | TODO | 트래블 아이템 픽업/드롭 로그 UI 미구현 | 🟡 백로그 |
| 2026-04-20 | FIXED | 즐겨찾기 캐시 arrayRemove 누락 → 수정됨 | 🟢 해결 |
| 2026-04-20 | FIXED | Live Feed "수정하기" 고아 피드 → 수정됨 | 🟢 해결 |
| 2026-04-20 | FIXED | Live Feed freshScore 정렬 누락 → 수정됨 | 🟢 해결 |
| 2026-04-20 | FIXED | KakaoMap 매 렌더 재초기화 → useMemo로 수정됨 | 🟢 해결 |
| 2026-04-20 | FIXED | oreum_stamps 전체 조회 → where uid 쿼리로 수정됨 | 🟢 해결 |
| 2026-04-20 | FIXED | geocache found 중복 제출 → 체크 추가됨 | 🟢 해결 |

---

> 새 이슈 추가 형식:
> `| YYYY-MM-DD | BUG/TODO/INFO/DONE | 내용 | 🔴/🟡/🟢 상태 |`
