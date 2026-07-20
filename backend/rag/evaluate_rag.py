"""Intrinsic retrieval evaluation: Recall@K, MRR, nDCG@K.

Builds a reproducible benchmark of (query, relevant-passage-ids) pairs directly from
the corpus — for each sampled seed passage, a query is formed from its *content*
tokens (title removed) so the retriever must match on meaning/terms, not echo the
name. Relevance = the seed passage (plus any passage with an identical title).

Compares three configurations to show what each hybrid component buys:
    sparse            BM25 only
    hybrid            BM25 + dense, fused with RRF
    hybrid+rerank     + cross-encoder reranking

    python -m rag.evaluate_rag --n 300 --k 10
    python -m rag.evaluate_rag --n 300 --k 10 --llm     # LLM-written queries (needs OPENAI_API_KEY)
"""

from __future__ import annotations

import argparse
import math
import random
import re
from collections import defaultdict

from .corpus import build_corpus, Passage
from .hybrid import HybridRetriever, _tokenize

_STOP = set("the a an and or of for to in at is are with near located service "
            "senior clinic subsidised care s tel".split())


def _content_query(p: Passage, rng: random.Random, n_tokens: int = 6) -> str:
    title_tokens = set(_tokenize(p.title))
    toks = [t for t in _tokenize(p.text)
            if t not in title_tokens and t not in _STOP and len(t) > 2]
    if not toks:
        toks = [t for t in _tokenize(p.text) if t not in _STOP]
    uniq = list(dict.fromkeys(toks))
    rng.shuffle(uniq)
    return " ".join(uniq[:n_tokens])


def build_benchmark(passages: list[Passage], n: int, seed: int) -> list[tuple[str, set[str]]]:
    title_to_ids: dict[str, set[str]] = defaultdict(set)
    for p in passages:
        title_to_ids[p.title].add(p.id)
    rng = random.Random(seed)
    seeds = rng.sample(passages, min(n, len(passages)))
    bench = []
    for p in seeds:
        q = _content_query(p, rng)
        if q.strip():
            bench.append((q, set(title_to_ids[p.title])))
    return bench


def _dcg(rels: list[int]) -> float:
    return sum(r / math.log2(i + 2) for i, r in enumerate(rels))


def evaluate_config(retriever: HybridRetriever, bench, k: int,
                    use_dense: bool, use_rerank: bool) -> dict:
    recall_sum = mrr_sum = ndcg_sum = 0.0
    for query, gold in bench:
        hits = retriever.search(query, k=k, use_dense=use_dense, use_rerank=use_rerank)
        ids = [h.id for h in hits]
        rels = [1 if i in gold else 0 for i in ids]

        recall_sum += (sum(rels) / len(gold)) if gold else 0.0
        rr = 0.0
        for rank, rel in enumerate(rels, start=1):
            if rel:
                rr = 1.0 / rank
                break
        mrr_sum += rr
        ideal = [1] * min(len(gold), k)
        idcg = _dcg(ideal) or 1.0
        ndcg_sum += _dcg(rels) / idcg

    n = len(bench)
    return {
        f"Recall@{k}": round(100 * recall_sum / n, 2),
        "MRR": round(mrr_sum / n, 4),
        f"nDCG@{k}": round(ndcg_sum / n, 4),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=300, help="benchmark queries")
    ap.add_argument("--k", type=int, default=10)
    ap.add_argument("--seed", type=int, default=13)
    ap.add_argument("--no-hsa", action="store_true", help="exclude HSA (faster)")
    args = ap.parse_args()

    print("[rag] building corpus …")
    passages = build_corpus(include_hsa=not args.no_hsa)
    print(f"[rag] corpus size: {len(passages)} passages")
    bench = build_benchmark(passages, args.n, args.seed)
    print(f"[rag] benchmark: {len(bench)} queries")

    retriever = HybridRetriever(passages)
    dense_ok = retriever._ensure_dense()
    configs = [("sparse (BM25)", False, False)]
    if dense_ok:
        configs += [("hybrid (BM25+dense+RRF)", True, False),
                    ("hybrid + cross-encoder rerank", True, True)]
    else:
        print("[rag] sentence-transformers not installed — scoring BM25 only. "
              "Install it (see finetune/requirements.txt style) for dense + rerank.")

    header = f"{'config':<34}" + "".join(f"{m:>12}" for m in [f'Recall@{args.k}', 'MRR', f'nDCG@{args.k}'])
    print("\n" + header)
    for name, ud, ur in configs:
        m = evaluate_config(retriever, bench, args.k, use_dense=ud, use_rerank=ur)
        vals = "".join(f"{v:>12}" for v in m.values())
        print(f"{name:<34}{vals}")


if __name__ == "__main__":
    main()
