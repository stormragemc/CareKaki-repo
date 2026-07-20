"""Process-wide cached retriever for the app's evidence-grounding endpoint.

The corpus (~2.8k passages) and BM25 index are built once on first use and reused.
Dense embeddings/reranker load lazily inside HybridRetriever when
sentence-transformers is available; otherwise the retriever serves BM25 results, so
this endpoint works even in the light backend environment.
"""

from __future__ import annotations

from .corpus import build_corpus
from .hybrid import HybridRetriever

_retriever: HybridRetriever | None = None


def get_retriever() -> HybridRetriever:
    global _retriever
    if _retriever is None:
        _retriever = HybridRetriever(build_corpus())
    return _retriever


def search_evidence(query: str, k: int = 5, use_rerank: bool = True) -> dict:
    r = get_retriever()
    hits = r.search(query, k=k, use_dense=True, use_rerank=use_rerank)
    return {
        "query": query,
        "dense_enabled": r._embedder is not None,
        "results": [
            {"id": h.id, "source": h.source, "title": h.title, "text": h.text}
            for h in hits
        ],
    }
