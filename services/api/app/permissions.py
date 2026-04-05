from __future__ import annotations

from typing import Iterable

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "guest": set(),
    "user": {
        "docs:create",
        "docs:read:own",
        "docs:update:own",
        "docs:delete:own",
        "files:create:own",
        "files:read:own",
        "files:delete:own",
    },
    "manager": {
        "docs:create",
        "docs:read:own",
        "docs:update:own",
        "docs:delete:own",
        "docs:read:any",
        "docs:update:any",
        "files:create:own",
        "files:read:own",
        "files:delete:own",
        "files:read:any",
        "files:delete:any",
    },
    "admin": {
        "docs:create",
        "docs:read:own",
        "docs:update:own",
        "docs:delete:own",
        "docs:read:any",
        "docs:update:any",
        "docs:delete:any",
        "files:create:own",
        "files:read:own",
        "files:delete:own",
        "files:read:any",
        "files:delete:any",
        "roles:manage",
        "users:read:any",
    },
}

AVAILABLE_ROLES = tuple(ROLE_PERMISSIONS.keys())


def get_permissions(role: str | None) -> set[str]:
    return ROLE_PERMISSIONS.get(role or "guest", set())


def has_permission(role: str | None, permission: str) -> bool:
    return permission in get_permissions(role)


def has_any_permission(role: str | None, permissions: Iterable[str]) -> bool:
    current = get_permissions(role)
    return any(permission in current for permission in permissions)
