#!/usr/bin/env bash
# EC2 서버에서 실행: 컨테이너 빌드/재시작 후 헬스체크
# GitHub Actions 가 자동으로 호출하며, 서버에서 직접 실행해도 됩니다: bash ~/app/scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f backend/.env ]; then
  echo "backend/.env 가 없습니다. TMDB 키를 설정하세요." >&2
  exit 1
fi

docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

echo "헬스체크 중..."
for i in $(seq 1 30); do
  if curl -fsS http://localhost/api/health >/dev/null 2>&1; then
    echo "배포 성공 ✅"
    docker compose ps
    exit 0
  fi
  sleep 3
done

echo "헬스체크 실패 ❌ - 최근 로그:" >&2
docker compose logs --tail=50 >&2
exit 1
