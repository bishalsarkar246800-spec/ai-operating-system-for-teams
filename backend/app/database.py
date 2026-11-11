import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

# Normalize database URL for async drivers
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

# SQLite concurrency configuration
engine_args = {"echo": False}
if "sqlite" in database_url:
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(database_url, **engine_args)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        # If postgres, safely attempt enabling pgvector
        if "postgresql" in database_url:
            try:
                from sqlalchemy import text
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("pgvector extension initialized or already present.")
            except Exception as e:
                logger.warning(f"Could not enable pgvector extension (might not be installed): {e}")

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas initialized.")

