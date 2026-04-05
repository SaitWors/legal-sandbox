# Audit: labs 1–3 + Docker lab

## Lab 1 — roles and permissions

Implemented:
- RBAC model with `user`, `manager`, `admin`
- permission checks on backend through dependencies and service-level access checks
- `403 Forbidden` on insufficient permissions
- admin endpoint for listing users and changing roles
- protected UI routes and role-aware interface

## Lab 2 — access/refresh authentication

Implemented:
- endpoints: register, login, refresh, logout, me
- short-lived access token + long-lived refresh token
- refresh token rotation on refresh
- refresh token storage and revocation in DB
- layered backend structure: API → service → repository
- centralized auth state on frontend
- automatic token refresh through API wrapper

## Lab 3 — filtering and object storage

Implemented:
- document CRUD with validation
- filtering by search/category/status
- sorting and pagination
- filter state stored in query params
- file upload/list/download/delete
- protected download links
- object storage support through S3-compatible backend; MinIO configured in Docker
- upload restrictions by type and size

## Docker lab (Lab 6)

Implemented:
- Dockerfile for FastAPI
- Dockerfile for Next.js frontend
- docker-compose orchestration for frontend/api/postgres/minio/nginx
- reverse proxy configuration through Nginx
- healthchecks for core services
- environment-based configuration
