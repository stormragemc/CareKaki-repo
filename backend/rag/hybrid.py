"""Hybrid retriever: dense + sparse, fused with RRF, re-ranked by a cross-encoder.

Pipeline:
    query
      ├─ dense  (multilingual sentence embeddings, cosine top-N)   [needs sentence-transformers]
      └─ sparse (BM25 Okapi, top-N)                                [pure python]
            └─ Reciprocal Rank Fusion  ──►  cross-encoder rerank  ──►  top-K
                                              [needs sentence-transformers]

The dense and rerank stages import sentence-transformers lazily. If it isn't
installed, `search()` transparently degrades to BM25(+RRF over the single ranker),
so the corpus, sparse retrieval, fusion and evaluation all work without a GPU.
"""

from __future__ import annotations

import re
from typing import Sequence

from .corpus import Passage

_TOKEN_RE = re.compile(r"[a-z0-9]+")

DEFAULT_DENSE_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
DEFAULT_CROSS_ENCODER = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def reciprocal_rank_fusion(rankings: Sequence[Sequence[str]], k: int = 60) -> list[tuple[str, float]]:
    """Fuse ranked id-lists via RRF: score(d) = Σ 1/(k + rank_i(d)). Rank is 1-based.

    Robust to scale differences between dense cosine and BM25 scores because it
    only uses ranks. Returns ids sorted by fused score, descending.
    """
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)


class HybridRetriever:
    def __init__(
        self,
        passages: list[Passage],
        dense_model: str = DEFAULT_DENSE_MODEL,
        cross_encoder: str = DEFAULT_CROSS_ENCODER,
    ):
        self.passages = passages
        self.by_id = {p.id: p for p in passages}
        self.texts = [p.text for p in passages]
        self.ids = [p.id for p in passages]

        # Sparse index (always available).
        from rank_bm25 import BM25Okapi
        self.bm25 = BM25Okapi([_tokenize(t) for t in self.texts])

        # Dense + rerank are lazy.
        self._dense_model_name = dense_model
        self._cross_encoder_name = cross_encoder
        self._embedder = None
        self._doc_emb = None
        self._reranker = None

    # ── Dense ────────────────────────────────────────────────────────────────
    def _ensure_dense(self) -> bool:
        if self._embedder is not None:
            return True
        try:
            from sentence_transformers import SentenceTransformer
        except Exception:
            return False
        self._embedder = SentenceTransformer(self._dense_model_name)
        self._doc_emb = self._embedder.encode(
            self.texts, normalize_embeddings=True, show_progress_bar=False,
            convert_to_numpy=True, batch_size=64,
        )
        return True

    def dense_search(self, query: str, top_n: int = 50) -> list[str]:
        if not self._ensure_dense():
            return []
        import numpy as np
        q = self._embedder.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
        sims = self._doc_emb @ q  # cosine (both normalized)
        idx = np.argsort(-sims)[:top_n]
        return [self.ids[i] for i in idx]

    # ── Sparse ───────────────────────────────────────────────────────────────
    def sparse_search(self, query: str, top_n: int = 50) -> list[str]:
        scores = self.bm25.get_scores(_tokenize(query))
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        return [self.ids[i] for i in ranked[:top_n]]

    # ── Rerank ───────────────────────────────────────────────────────────────
    def _ensure_reranker(self) -> bool:
        if self._reranker is not None:
            return True
        try:
            from sentence_transformers import CrossEncoder
        except Exception:
            return False
        self._reranker = CrossEncoder(self._cross_encoder_name)
        return True

    def rerank(self, query: str, candidate_ids: list[str]) -> list[str]:
        if not candidate_ids or not self._ensure_reranker():
            return candidate_ids
        pairs = [[query, self.by_id[cid].text] for cid in candidate_ids]
        scores = self._reranker.predict(pairs)
        order = sorted(range(len(candidate_ids)), key=lambda i: scores[i], reverse=True)
        return [candidate_ids[i] for i in order]

    # ── Full pipeline ────────────────────────────────────────────────────────
    def search(
        self, query: str, k: int = 5, top_n: int = 50,
        use_dense: bool = True, use_rerank: bool = True, rrf_k: int = 60,
    ) -> list[Passage]:
        rankings: list[list[str]] = [self.sparse_search(query, top_n)]
        if use_dense:
            dense = self.dense_search(query, top_n)
            if dense:
                rankings.append(dense)

        fused = [doc_id for doc_id, _ in reciprocal_rank_fusion(rankings, k=rrf_k)]
        candidates = fused[: max(k, min(len(fused), top_n))]

        if use_rerank:
            candidates = self.rerank(query, candidates[:top_n])

        return [self.by_id[cid] for cid in candidates[:k]]
