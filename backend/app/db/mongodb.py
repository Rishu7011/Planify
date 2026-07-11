import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "planify"

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Open async MongoDB connection on app startup."""
    global _client, _db
    _client = AsyncIOMotorClient(MONGODB_URI)
    _db = _client[DB_NAME]
    # Ping to verify connection
    await _client.admin.command("ping")
    print(f"✅ Connected to MongoDB — database: '{DB_NAME}'")


async def close_mongo_connection() -> None:
    """Close MongoDB connection on app shutdown."""
    global _client
    if _client:
        _client.close()
        print("🔌 MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database instance. Call after connect_to_mongo()."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return _db
