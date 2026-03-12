#!/bin/bash
# SimpleNow ITSM - Production Deployment Script

set -e

REGISTRY=${DOCKER_REGISTRY:-ghcr.io/simplenow}
VERSION=${VERSION:-$(git rev-parse --short HEAD)}
DEPLOY_ENV=${DEPLOY_ENV:-production}

echo "🚀 Deploying SimpleNow ITSM v${VERSION} to ${DEPLOY_ENV}"

echo "Building Docker images..."
docker build -t ${REGISTRY}/api:${VERSION} -t ${REGISTRY}/api:latest apps/api/
docker build -t ${REGISTRY}/frontend:${VERSION} -t ${REGISTRY}/frontend:latest apps/frontend/

echo "Pushing images..."
docker push ${REGISTRY}/api:${VERSION}
docker push ${REGISTRY}/api:latest
docker push ${REGISTRY}/frontend:${VERSION}
docker push ${REGISTRY}/frontend:latest

if command -v kubectl &> /dev/null; then
  echo "Deploying to Kubernetes..."
  kubectl apply -f k8s/namespace.yaml
  kubectl apply -f k8s/postgres.yaml
  kubectl apply -f k8s/api.yaml
  kubectl apply -f k8s/frontend.yaml

  echo "Waiting for rollout..."
  kubectl rollout status deployment/simplenow-api -n simplenow
  kubectl rollout status deployment/simplenow-frontend -n simplenow
  echo "✅ Kubernetes deployment complete"
else
  echo "Deploying with Docker Compose..."
  docker compose -f docker/docker-compose.yml up -d
  echo "✅ Docker Compose deployment complete"
fi

echo "✅ Deployment complete! Version: ${VERSION}"
