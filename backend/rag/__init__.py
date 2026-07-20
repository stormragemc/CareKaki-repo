"""CareKaki Hybrid RAG package.

Dense (multilingual embeddings) + sparse (BM25) retrieval fused with Reciprocal
Rank Fusion and re-ranked by a cross-encoder, over a corpus built from public
Singapore care data (AIC eldercare services, CHAS clinics, HSA product register).

Heavy models (sentence-transformers / torch) are imported lazily inside
HybridRetriever, so the corpus builder, BM25 path, RRF fusion, and the eval
metrics all run without a GPU stack installed.
"""

from .corpus import build_corpus, Passage
from .hybrid import HybridRetriever, reciprocal_rank_fusion

__all__ = ["build_corpus", "Passage", "HybridRetriever", "reciprocal_rank_fusion"]
