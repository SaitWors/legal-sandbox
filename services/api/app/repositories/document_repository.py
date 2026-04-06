from __future__ import annotations

from sqlmodel import func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.db_models import DocumentDB
from app.models.schemas import DocumentListQuery


class DocumentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _apply_filters(self, statement, query: DocumentListQuery):
        if query.q:
            statement = statement.where(
                or_(
                    DocumentDB.title.ilike(f"%{query.q}%"),
                    DocumentDB.text.ilike(f"%{query.q}%"),
                )
            )
        if query.category:
            statement = statement.where(DocumentDB.category == query.category)
        if query.status:
            statement = statement.where(DocumentDB.status == query.status)
        if query.owner_id is not None:
            statement = statement.where(DocumentDB.owner_id == query.owner_id)
        return statement

    def _order_field(self, sort_by: str):
        return getattr(DocumentDB, sort_by, DocumentDB.updated_at)

    async def list_documents(self, query: DocumentListQuery):
        base = self._apply_filters(select(DocumentDB), query)
        total_stmt = self._apply_filters(select(func.count()).select_from(DocumentDB), query)
        total_result = await self.session.exec(total_stmt)
        total = int(total_result.one())

        order_field = self._order_field(query.sort_by)
        if query.sort_order == "asc":
            base = base.order_by(order_field.asc(), DocumentDB.id.asc())
        else:
            base = base.order_by(order_field.desc(), DocumentDB.id.desc())

        offset = (query.page - 1) * query.page_size
        result = await self.session.exec(base.offset(offset).limit(query.page_size))
        return list(result.all()), total

    async def get_by_id(self, doc_id: int) -> DocumentDB | None:
        return await self.session.get(DocumentDB, doc_id)

    async def create(self, document: DocumentDB) -> DocumentDB:
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document

    async def save(self, document: DocumentDB) -> DocumentDB:
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document

    async def delete(self, document: DocumentDB) -> None:
        await self.session.delete(document)
        await self.session.commit()
