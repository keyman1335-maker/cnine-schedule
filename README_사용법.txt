CNINE Schedule Center v3 - GitHub API 저장 방식

구성:
- cnine_schedule.html : 실제 일정표 페이지
- index.html : 루트 접속 시 cnine_schedule.html로 이동
- ygosu_paste_INLINE.txt : 와이고수 본문 붙여넣기용
- data/schedule.json : 일정 데이터 저장 파일
- netlify/functions/save-schedule.js : GitHub API로 schedule.json 저장
- netlify.toml : Netlify Functions 설정

중요:
Netlify는 배포 파일을 직접 수정할 수 없어서, v3부터 GitHub API로 data/schedule.json을 수정합니다.
그래서 Netlify 환경변수에 GitHub 토큰을 등록해야 저장됩니다.

Netlify 환경변수:
1) GITHUB_TOKEN = GitHub Fine-grained token 또는 classic token
2) GITHUB_OWNER = keyman1335-maker
3) GITHUB_REPO = cnine-schedule
4) GITHUB_BRANCH = main
5) SCHEDULE_FILE_PATH = data/schedule.json

GitHub 토큰 권한:
- Repository: cnine-schedule 선택
- Contents: Read and write
- Metadata: Read

처음 저장:
- 일정표에서 수정 후 저장
- 처음 입력한 비밀번호가 관리자 비밀번호로 등록됩니다.

와고 운영:
- 와고 글은 ygosu_paste_INLINE.txt를 최초 1회 붙여넣으면 됩니다.
- 이후 일정 수정은 일정표 내부 저장으로 처리합니다.
- 와고 글 수정은 필요 없습니다.
