from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime
import uuid

router = APIRouter()

# Absolute path to feedback.json in uploads directory
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_UPLOADS_DIR = os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "uploads"))
FEEDBACK_FILE = os.path.join(_UPLOADS_DIR, "feedback.json")

class FeedbackCreate(BaseModel):
    text: str
    parent_id: Optional[str] = None
    username: Optional[str] = None

class VotePayload(BaseModel):
    up_delta: int
    down_delta: int

class FeedbackResponse(BaseModel):
    id: str
    parent_id: Optional[str] = None
    username: str
    text: str
    timestamp: str
    upvotes: int = 0
    downvotes: int = 0
    replies: List["FeedbackResponse"] = []

# Resolve recursive references in Pydantic
FeedbackResponse.model_rebuild()

def load_raw_feedback() -> list:
    os.makedirs(_UPLOADS_DIR, exist_ok=True)
    if not os.path.exists(FEEDBACK_FILE):
        return []
    try:
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading feedback: {e}")
        return []

def save_raw_feedback(data: list):
    os.makedirs(_UPLOADS_DIR, exist_ok=True)
    try:
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving feedback: {e}")
        raise HTTPException(status_code=500, detail="Could not save feedback")

def build_feedback_tree(items: list) -> list:
    # Build dictionary of node details (with copies to avoid modifying original objects)
    nodes = {}
    for item in items:
        nodes[item["id"]] = {
            "id": item["id"],
            "parent_id": item.get("parent_id"),
            "username": item.get("username", "Anonymous"),
            "text": item.get("text", ""),
            "timestamp": item.get("timestamp", ""),
            "upvotes": item.get("upvotes", 0),
            "downvotes": item.get("downvotes", 0),
            "replies": []
        }
    
    roots = []
    for item in items:
        node = nodes[item["id"]]
        parent_id = item.get("parent_id")
        if parent_id and parent_id in nodes:
            nodes[parent_id]["replies"].append(node)
        else:
            # If parent_id doesn't exist in nodes (or is None), it's a top-level node
            roots.append(node)
            
    # Sort roots and nested replies by timestamp ascending so older comments appear first, newer after
    roots.sort(key=lambda x: x["timestamp"])
    for n in nodes.values():
        n["replies"].sort(key=lambda x: x["timestamp"])
        
    return roots

@router.get("", response_model=List[FeedbackResponse])
async def get_feedback():
    """
    Endpoint to retrieve the structured tree of comments/issues and replies.
    """
    raw_data = load_raw_feedback()
    tree = build_feedback_tree(raw_data)
    return tree

@router.post("", response_model=FeedbackResponse)
async def create_feedback(payload: FeedbackCreate):
    """
    Endpoint to submit a new issue or reply.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")
        
    if len(payload.text) > 700:
        raise HTTPException(status_code=400, detail="Comment content cannot exceed 700 characters")
        
    raw_data = load_raw_feedback()
    
    # If parent_id is specified, ensure it exists in raw data
    if payload.parent_id:
        parent_exists = any(item["id"] == payload.parent_id for item in raw_data)
        if not parent_exists:
            raise HTTPException(status_code=404, detail="Parent comment not found")
            
    new_id = str(uuid.uuid4())
    username = payload.username.strip() if payload.username and payload.username.strip() else "Anonymous"
    new_item = {
        "id": new_id,
        "parent_id": payload.parent_id,
        "username": username,
        "text": payload.text,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "upvotes": 0,
        "downvotes": 0
    }
    
    raw_data.append(new_item)
    save_raw_feedback(raw_data)
    
    # Return feedback item with empty replies initially
    return {
        "id": new_id,
        "parent_id": payload.parent_id,
        "username": username,
        "text": payload.text,
        "timestamp": new_item["timestamp"],
        "upvotes": 0,
        "downvotes": 0,
        "replies": []
    }

@router.post("/{feedback_id}/vote", response_model=FeedbackResponse)
async def vote_feedback(feedback_id: str, payload: VotePayload):
    """
    Endpoint to adjust upvote/downvote counts.
    """
    raw_data = load_raw_feedback()
    
    # Find the comment
    item_to_vote = None
    for item in raw_data:
        if item["id"] == feedback_id:
            item_to_vote = item
            break
            
    if not item_to_vote:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    # Increment or decrement votes
    item_to_vote["upvotes"] = max(0, item_to_vote.get("upvotes", 0) + payload.up_delta)
    item_to_vote["downvotes"] = max(0, item_to_vote.get("downvotes", 0) + payload.down_delta)
    
    save_raw_feedback(raw_data)
    
    return {
        "id": item_to_vote["id"],
        "parent_id": item_to_vote.get("parent_id"),
        "username": item_to_vote.get("username", "Anonymous"),
        "text": item_to_vote.get("text", ""),
        "timestamp": item_to_vote.get("timestamp", ""),
        "upvotes": item_to_vote.get("upvotes", 0),
        "downvotes": item_to_vote.get("downvotes", 0),
        "replies": []
    }

@router.post("/{feedback_id}/upvote", response_model=FeedbackResponse)
async def upvote_feedback(feedback_id: str):
    """
    Deprecated: Endpoint to upvote feedback. Use /vote instead.
    """
    return await vote_feedback(feedback_id, VotePayload(up_delta=1, down_delta=0))

@router.delete("/{feedback_id}")
async def delete_feedback(feedback_id: str):
    """
    Endpoint to delete a comment/reply and all its recursive replies (admin only).
    """
    raw_data = load_raw_feedback()
    
    ids_to_delete = {feedback_id}
    added_new = True
    while added_new:
        added_new = False
        for item in raw_data:
            if item.get("parent_id") in ids_to_delete and item["id"] not in ids_to_delete:
                ids_to_delete.add(item["id"])
                added_new = True
                
    new_data = [item for item in raw_data if item["id"] not in ids_to_delete]
    
    if len(new_data) == len(raw_data):
        raise HTTPException(status_code=404, detail="Comment not found")
        
    save_raw_feedback(new_data)
    return {"status": "success", "message": "Comment and its replies deleted successfully"}
