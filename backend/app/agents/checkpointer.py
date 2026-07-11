import json
import contextlib
from datetime import datetime
from typing import AsyncIterator, Optional, Sequence, Any

from motor.motor_asyncio import AsyncIOMotorClient
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    CheckpointTuple,
    Checkpoint,
    CheckpointMetadata,
    ChannelVersions,
)
from langchain_core.runnables import RunnableConfig
from dotenv import load_dotenv

load_dotenv()


class MongoCheckpointSaver(BaseCheckpointSaver):
    def __init__(self, client: AsyncIOMotorClient, database: str):
        super().__init__()

        self.client = client
        self.db = client[database]

        self.checkpoints = self.db.checkpoints
        self.pending_writes = self.db.pending_writes

    async def setup(self):
        await self.checkpoints.create_index(
            [("thread_id", 1), ("checkpoint_ns", 1), ("checkpoint_id", -1)]
        )

        await self.pending_writes.create_index(
            [("thread_id", 1), ("checkpoint_ns", 1)]
        )

    #######################################################
    # REQUIRED METHODS
    #######################################################

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]
        
        # We store the parent checkpoint ID if any
        parent_checkpoint_id = config["configurable"].get("checkpoint_id")

        # Serialize using the built-in serde
        type_, data = self.serde.dumps_typed(checkpoint)
        meta_type, meta_data = self.serde.dumps_typed(metadata)

        await self.checkpoints.replace_one(
            {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            },
            {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
                "parent_checkpoint_id": parent_checkpoint_id,
                "checkpoint_type": type_,
                "checkpoint_data": data,
                "metadata_type": meta_type,
                "metadata_data": meta_data,
                "created_at": datetime.utcnow(),
            },
            upsert=True,
        )

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        }

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
    ):
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"]["checkpoint_id"]

        # Serialize writes
        serialized_writes = []
        for channel, value in writes:
            w_type, w_data = self.serde.dumps_typed(value)
            serialized_writes.append({"channel": channel, "type": w_type, "data": w_data})

        await self.pending_writes.insert_one(
            {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
                "task_id": task_id,
                "writes": serialized_writes,
            }
        )

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")

        if checkpoint_id:
            doc = await self.checkpoints.find_one(
                {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            )
        else:
            doc = await self.checkpoints.find_one(
                {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                },
                sort=[("created_at", -1)],
            )

        if not doc:
            return None
            
        # Reconstruct pending writes for this checkpoint
        writes_cursor = self.pending_writes.find(
            {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": doc["checkpoint_id"],
            }
        )
        pending_writes = []
        async for w in writes_cursor:
            for write in w["writes"]:
                pending_writes.append(
                    (
                        w["task_id"],
                        write["channel"],
                        self.serde.loads_typed((write["type"], write["data"])),
                    )
                )

        config_out = {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": doc["checkpoint_id"],
            }
        }
        
        parent_config = None
        if doc.get("parent_checkpoint_id"):
            parent_config = {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": doc["parent_checkpoint_id"],
                }
            }

        # Handle backward compatibility if the user had un-serialized checkpoints saved previously
        if "checkpoint" in doc:
            checkpoint = doc["checkpoint"]
            metadata = doc.get("metadata", {})
        else:
            checkpoint = self.serde.loads_typed((doc["checkpoint_type"], doc["checkpoint_data"]))
            metadata = self.serde.loads_typed((doc["metadata_type"], doc["metadata_data"]))

        return CheckpointTuple(
            config=config_out,
            checkpoint=checkpoint,
            metadata=metadata,
            pending_writes=pending_writes,
            parent_config=parent_config,
        )

    async def alist(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")

        query = {
            "thread_id": thread_id,
            "checkpoint_ns": checkpoint_ns,
        }
        
        if before and "checkpoint_id" in before["configurable"]:
            query["checkpoint_id"] = {"$lt": before["configurable"]["checkpoint_id"]}

        cursor = self.checkpoints.find(query).sort("created_at", -1)

        if limit:
            cursor = cursor.limit(limit)

        async for doc in cursor:
            config_out = {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": doc["checkpoint_id"],
                }
            }
            parent_config = None
            if doc.get("parent_checkpoint_id"):
                parent_config = {
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "checkpoint_id": doc["parent_checkpoint_id"],
                    }
                }
                
            if "checkpoint" in doc:
                checkpoint = doc["checkpoint"]
                metadata = doc.get("metadata", {})
            else:
                checkpoint = self.serde.loads_typed((doc["checkpoint_type"], doc["checkpoint_data"]))
                metadata = self.serde.loads_typed((doc["metadata_type"], doc["metadata_data"]))

            yield CheckpointTuple(
                config=config_out,
                checkpoint=checkpoint,
                metadata=metadata,
                pending_writes=[],
                parent_config=parent_config,
            )

    async def adelete_thread(self, thread_id: str):
        await self.checkpoints.delete_many(
            {"thread_id": thread_id}
        )

        await self.pending_writes.delete_many(
            {"thread_id": thread_id}
        )

    #######################################################
    # SYNC METHODS
    #######################################################
    def put(self, *args, **kwargs):
        raise NotImplementedError("Use async methods.")
        
    def put_writes(self, *args, **kwargs):
        raise NotImplementedError("Use async methods.")
        
    def get_tuple(self, *args, **kwargs):
        raise NotImplementedError("Use async methods.")
        
    def list(self, *args, **kwargs):
        raise NotImplementedError("Use async methods.")

    #######################################################
    # OPTIONAL
    #######################################################

    async def aprune(self, thread_id: str):
        pass

    async def acopy_thread(self, source: str, target: str):
        pass

    async def adelete_for_runs(self, run_ids: list[str]):
        pass


##############################################################
# Context manager for LangGraph Server
##############################################################

@contextlib.asynccontextmanager
async def generate_checkpointer():
    client = AsyncIOMotorClient()

    saver = MongoCheckpointSaver(
        client, "planify"
    )

    await saver.setup()

    try:
        yield saver
    finally:
        client.close()
