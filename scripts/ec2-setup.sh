#!/usr/bin/env bash
# EC2(Ubuntu) 최초 1회 실행: Docker 설치 + 스왑 메모리 설정
# 사용법: bash ec2-setup.sh
set -euo pipefail

# 1) 스왑 2GB (t3.micro 는 RAM 1GB 라서 Docker 빌드 시 메모리 부족 방지)
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 2) Docker Engine + Compose 플러그인 (Docker 공식 설치 스크립트)
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

# 3) 앱 폴더
mkdir -p ~/app

echo "설치 완료. docker 그룹 적용을 위해 SSH 접속을 끊었다가 다시 접속하세요."
docker --version || true
