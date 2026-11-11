import json
import math
import re
from typing import List
import numpy as np
from app.config import settings


def text_to_dense_vector(text: str, dim: int = 128) -> List[float]:
    """
    Deterministic semantic n-gram feature hashing vectorizer.
    Produces consistent 128-dim normalized embedding vectors without external API requirements.
    """
    clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower()).strip()
    words = clean_text.split()
    
    vec = np.zeros(dim, dtype=np.float32)
    if not words:
        return vec.tolist()

    # Generate unigrams and bigrams
    tokens = list(words)
    for i in range(len(words) - 1):
        tokens.append(f"{words[i]}_{words[i+1]}")

    for token in tokens:
        # FNV-1a hash variation
        h = 2166136261
        for char in token:
            h = (h ^ ord(char)) * 16777619
            h &= 0xFFFFFFFF
        idx = h % dim
        vec[idx] += 1.0

    # L2 normalize
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    return vec.tolist()


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


async def generate_embedding(text: str) -> List[float]:
    """
    Async embedding generator. Attempts remote provider if configured,
    falling back reliably to deterministic vectorizer.
    """
    # If OpenAI API Key is configured and accessible
    if settings.OPENAI_API_KEY:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"input": text, "model": "text-embedding-3-small"}
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["data"][0]["embedding"][:128]
        except Exception:
            pass

    return text_to_dense_vector(text)
