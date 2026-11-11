import re
import json
from typing import Dict, Any, List, Optional, Tuple
from app.ai.embeddings import generate_embedding, cosine_similarity


class EventAnalyzer:
    @staticmethod
    def extract_delay_days(text: str) -> int:
        """Extracts numerical delay days from natural language."""
        text_lower = text.lower()
        
        # Look for explicit patterns like 'delayed by 3 days', '3-day delay', 'pushed by 2 weeks'
        day_match = re.search(r"(\d+)\s*(?:[- ]?day|days)", text_lower)
        if day_match:
            return int(day_match.group(1))

        week_match = re.search(r"(\d+)\s*(?:[- ]?week|weeks)", text_lower)
        if week_match:
            return int(week_match.group(1)) * 7

        if "tomorrow" in text_lower or "one day" in text_lower or "a day" in text_lower:
            return 1
        if "a week" in text_lower:
            return 7
        if "delayed" in text_lower or "delay" in text_lower or "slip" in text_lower or "slipped" in text_lower:
            return 2  # Default estimated delay when unspecified
        if "blocked" in text_lower or "blocker" in text_lower:
            return 3

        return 0

    @staticmethod
    def classify_sentiment_and_severity(text: str, delay_days: int) -> Tuple[str, str]:
        text_lower = text.lower()
        
        critical_keywords = ["blocker", "blocked", "critical", "incident", "outage", "stopped", "failed", "breach"]
        warning_keywords = ["delay", "delayed", "risk", "concern", "waiting", "slip", "slipped", "behind", "friction"]
        positive_keywords = ["completed", "shipped", "done", "ahead", "resolved", "unblocked", "approved"]

        if any(w in text_lower for w in critical_keywords) or delay_days >= 4:
            return "blocker", "critical"
        elif any(w in text_lower for w in warning_keywords) or delay_days > 0:
            return "negative", "warning"
        elif any(w in text_lower for w in positive_keywords):
            return "positive", "info"

        return "neutral", "info"

    @classmethod
    async def match_task_node(
        cls,
        event_text: str,
        tasks: List[Any]
    ) -> Tuple[Optional[Any], float]:
        """
        Performs hybrid semantic search (dense vector similarity + lexical scoring)
        to identify the most relevant task.
        """
        if not tasks:
            return None, 0.0

        event_embedding = await generate_embedding(event_text)
        event_words = set(re.findall(r"\w+", event_text.lower()))

        best_task = None
        best_score = -1.0

        for task in tasks:
            # Semantic similarity
            task_emb = []
            emb_attr = getattr(task, "embedding", None)
            if emb_attr:
                try:
                    task_emb = json.loads(emb_attr)
                except Exception:
                    pass
            if not task_emb:
                task_emb = await generate_embedding(f"{task.title} {getattr(task, 'description', '') or ''}")

            sem_sim = cosine_similarity(event_embedding, task_emb)

            # Lexical overlap
            task_desc = getattr(task, "description", "") or ""
            task_words = set(re.findall(r"\w+", f"{task.title} {task_desc}".lower()))
            overlap = len(event_words.intersection(task_words))
            lex_sim = min(1.0, overlap / max(1, len(task_words)))

            # Hybrid score (70% semantic, 30% lexical)
            hybrid_score = 0.7 * sem_sim + 0.3 * lex_sim

            if hybrid_score > best_score:
                best_score = hybrid_score
                best_task = task

        # Minimum relevance threshold
        if best_score < 0.15:
            # Fallback to direct title substring
            for task in tasks:
                if task.title.lower() in event_text.lower():
                    return task, 0.95

        return best_task, max(0.0, best_score)
