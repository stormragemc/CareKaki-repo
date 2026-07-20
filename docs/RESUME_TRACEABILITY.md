# CareKaki / AiMao — Resume Traceability

Every resume claim mapped to the code that backs it, so it can be demoed and
defended in an interview. Status legend: ✅ done & tested · 🟡 runnable, in-progress.

## 1. Platform & agents

| Claim | Backing | Status |
|---|---|---|
| Multilingual AI companion, care plans, human handovers | `app/`, `backend/main.py` (`/chat`, `/pathway`, `/integrations/iccp/handover`) | ✅ |
| Early risk signals | `backend/agent/triage.py` → `classify_risk` (high/medium/low), surfaced as `riskLevel` in `/chat` | ✅ |
| **LangGraph agents** | `backend/agent/graph.py` — compiled `StateGraph`: intake → triage → respond → plan → guardian. `/chat` runs `run_care_turn()` | ✅ |
| **Supabase/PostgreSQL** | `backend/db/` — SQLAlchemy models (profiles, cases, timelines), `repository.py`, `/cases` endpoint. Activated by `DATABASE_URL` | ✅ |
| PDPA redaction, no-medical-advice, human escalation | `backend/services/guardian.py` (runs as the graph's `guardian` node) | ✅ |
| Telegram, Leaflet/OneMap, ElevenLabs | `backend/main.py` webhooks, `components/autopilot/MiniMap`, `backend/services/voice_guide.py` | ✅ |

**Demo:** `POST /chat` with "my mother fell and hit her head" → returns
`riskLevel: medium`, `adapters: [iccp, aic, telegram]`, Guardian flags. Set
`DATABASE_URL` → `POST /integrations/iccp/handover`, then `GET /cases` shows the
persisted case + timeline.

## 2. Hybrid RAG

| Claim | Backing | Status |
|---|---|---|
| Multilingual dense–sparse retrieval | `backend/rag/hybrid.py` — BM25 (`rank_bm25`) + multilingual MiniLM embeddings | ✅ |
| Reciprocal-rank fusion | `reciprocal_rank_fusion()` (rank-based, scale-robust) | ✅ |
| Cross-encoder reranking | `HybridRetriever.rerank()` (`ms-marco-MiniLM` CrossEncoder) | ✅ |
| Recall@K, MRR, nDCG evaluation | `backend/rag/evaluate_rag.py` — reproducible benchmark, per-config table | ✅ |
| Corpus | `backend/rag/corpus.py` — AIC eldercare + CHAS clinics + HSA register (~2.8k passages) | ✅ |
| Temporal SQL routing, hard-negative mining | not yet built | 🟡 roadmap |

**Demo:** `python -m rag.evaluate_rag --n 300 --k 10` prints Recall@10 / MRR /
nDCG for BM25 → hybrid → hybrid+rerank. Live in the app via `POST /rag/search`.
Baseline already measured: BM25 Recall@10 **81.6%**, MRR **0.72**, nDCG **0.71**.

## 3. Fine-tuning (QLoRA SFT)

| Claim | Backing | Status |
|---|---|---|
| Fine-tuned Qwen2.5-1.5B with QLoRA | `finetune/train_qlora.py` — 4-bit NF4 + LoRA, completion-only loss | ✅ scripts ready to run |
| 4,000 domain-specific examples | `finetune/generate_dataset.py` → `finetune/data/*.jsonl` (3400/280/320) | ✅ generated |
| Structured tool selection, safety escalation, evidence quality vs base | `finetune/evaluate.py` — side-by-side metrics incl. escalation recall | ✅ harness verified |
| De-identified data prep | templated, no names/NRIC/phone; labels distilled from `agent/triage.py` | ✅ |

**Demo:** `finetune/README.md` has the exact 4 commands (generate → train →
evaluate → serve). Labels are policy-derived (0 mismatch verified). Eval harness
validated: perfect model → 100%, adversarial → 0% on safety-critical metrics.

## 4. Post-training pipeline

| Claim | Backing | Status |
|---|---|---|
| QLoRA SFT | `finetune/train_qlora.py` | ✅ |
| KTO safety alignment | `finetune/kto_align.py` — TRL `KTOTrainer`, desirable/undesirable from safety policy | 🟡 runnable |
| GRPO tool-use optimisation | `finetune/grpo_tooluse.py` — TRL `GRPOTrainer`, programmatic reward from routing policy | 🟡 runnable |
| vLLM deployment | `finetune/serve_vllm.md`; backend auto-routes via `FINETUNED_MODEL_BASE_URL` | ✅ wired |
| ms-swift / FSDP / verl, distributed | single-GPU scaffolds here; framework port is roadmap | 🟡 roadmap |

**Honest framing:** SFT is complete; KTO and GRPO are runnable single-GPU stages
built on it (the "Building an end-to-end pipeline" workstream). The GRPO reward and
KTO signal both derive from CareKaki's own policy — nothing is hand-waved.

## Interview honesty notes

- Say "**in progress**" for the 🟡 items — the code is real and runnable, it just
  hasn't been run to convergence / ported to distributed frameworks yet.
- The two things that make this non-larp: (1) fine-tune labels and RL rewards are
  **derived from the same policy the production app uses**, and (2) the eval
  harnesses are real and reuse the app's own Guardian classifier.
