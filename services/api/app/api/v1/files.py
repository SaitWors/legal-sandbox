from __future__ import annotations

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.responses import FileResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.deps import get_current_active_user, get_session
from app.models.db_models import UserDB
from app.models.schemas import AttachmentListResponse, AttachmentOut, DownloadLinkResponse
from app.repositories.document_repository import DocumentRepository
from app.repositories.file_repository import FileRepository
from app.services.document_service import DocumentService
from app.services.file_service import FileService
from app.services.storage_service import StorageService

router = APIRouter(tags=["files"])


def _service(session: AsyncSession) -> FileService:
    doc_service = DocumentService(DocumentRepository(session))
    return FileService(FileRepository(session), doc_service, StorageService())


@router.get("/documents/{document_id}", response_model=AttachmentListResponse)
async def list_document_files(
    document_id: int,
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    return await _service(session).list_files(user, document_id)


@router.post("/documents/{document_id}", response_model=AttachmentOut, status_code=201)
async def upload_document_file(
    document_id: int,
    file: UploadFile = File(...),
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    return await _service(session).upload_file(user, document_id, file)


@router.get("/{file_id}/link", response_model=DownloadLinkResponse)
async def get_file_link(
    file_id: int,
    request: Request,
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    service = _service(session)
    attachment = await service.get_file(user, file_id)
    storage = StorageService()
    url, expires_in = storage.build_download_url(file_id, attachment.storage_key)
    if url.startswith("/"):
        base = str(request.base_url).rstrip("/")
        url = f"{base}{url}"
    return DownloadLinkResponse(url=url, expires_in=expires_in)


@router.get("/{file_id}/download")
async def download_file(file_id: int, token: str, session: AsyncSession = Depends(get_session)):
    attachment = await FileRepository(session).get_by_id(file_id)
    if not attachment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
    storage = StorageService()
    storage.validate_download_token(token, file_id, attachment.storage_key)
    path, content_type = storage.get_local_file(attachment.storage_key)
    return FileResponse(path, media_type=content_type, filename=attachment.original_name)


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: int,
    user: UserDB = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    await _service(session).delete_file(user, file_id)
    return None
