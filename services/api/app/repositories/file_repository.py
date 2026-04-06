from __future__ import annotations

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.db_models import FileAttachmentDB


class FileRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, attachment: FileAttachmentDB) -> FileAttachmentDB:
        self.session.add(attachment)
        await self.session.commit()
        await self.session.refresh(attachment)
        return attachment

    async def get_by_id(self, file_id: int) -> FileAttachmentDB | None:
        return await self.session.get(FileAttachmentDB, file_id)

    async def list_by_document(self, document_id: int) -> list[FileAttachmentDB]:
        result = await self.session.exec(
            select(FileAttachmentDB)
            .where(FileAttachmentDB.document_id == document_id)
            .order_by(FileAttachmentDB.created_at.desc(), FileAttachmentDB.id.desc())
        )
        return list(result.all())

    async def delete(self, attachment: FileAttachmentDB) -> None:
        await self.session.delete(attachment)
        await self.session.commit()
