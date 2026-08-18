# KAIST I&TM 동문회 대시보드

Notion DB와 실시간 연동되는 동문회 현황 대시보드입니다.

## 배포 순서

### 1단계 — Notion API 토큰 발급
1. https://www.notion.so/my-integrations 접속
2. "새 API 통합" 클릭 → 이름 입력 → 저장
3. "내부 통합 시크릿" 복사 (ntn_xxxxxxxx 형태)
4. 동문회록 노션 페이지 → 우측 상단 ··· → 연결(Connections) → 방금 만든 통합 추가

### 2단계 — GitHub 업로드
1. https://github.com 가입/로그인
2. "New repository" → 저장소 이름 입력 (예: kaist-dashboard) → Create
3. 이 폴더의 파일 전체 업로드

### 3단계 — Vercel 배포
1. https://vercel.com 가입 (GitHub 계정으로 로그인)
2. "Add New Project" → GitHub 저장소 선택 → Import
3. Settings > Environment Variables 에 아래 두 가지 입력:
   - NOTION_TOKEN       = ntn_xxxxxxxx (발급한 토큰)
   - NOTION_DATABASE_ID = b96fd44e2aea48a492fe17cbb486cc65
4. "Deploy" 클릭

### 4단계 — 노션에 임베드
1. Vercel에서 발급된 URL 복사 (예: https://kaist-itm.vercel.app)
2. 노션 페이지에서 /embed → URL 붙여넣기

## 데이터 자동 갱신
- 노션 DB가 수정되면 대시보드 새로고침 시 자동 반영
- 5분 캐시 적용 (서버 부하 최소화)

## 파일 구조
```
kaist-dashboard/
├── vercel.json          # Vercel 설정
├── package.json
├── api/
│   └── notion-data.js   # Notion API 프록시 (서버리스)
└── public/
    └── index.html       # 대시보드 HTML
```
