# CareKaki — Session Handoff

Portable context for continuing this work in a **new session, new Claude account, or
new machine**. Read this file first; it plus the repo is everything you need.

Last updated: 2026-07-20 · Branch: `Testing-RAG`

---

## 1. The goal

The owner's résumé describes CareKaki/AiMao (Dell InnovateDash finalist, senior-care
AI companion) with claims that were **not backed by code**. The work is to make those
claims genuinely true before a job interview — explicitly *"not larping"*.

**Decisions already made (don't re-litigate):**
- Timeline: **1–2 days** to interview
- Compute: **owner has their own NVIDIA GPU**
- Strategy: **make the claims real** (not soften the résumé wording)

## 2. Gap analysis that drove the work

Already real before this work: Next.js/FastAPI app, multilingual chat (en/zh/ms),
LLM care pathways, Telegram handovers (caregiver + ICCP bots), Leaflet map,
ElevenLabs voice, and a genuine Guardian safety layer (PDPA regex redaction,
no-medical-advice patterns, human-gate).

Claimed but **missing** → this is what got built:
1. LangGraph agents (was plain sequential OpenAI calls)
2. Supabase/PostgreSQL (was in-memory dicts)
3. Qwen2.5-1.5B QLoRA fine-tune on 4,000 examples (did not exist)
4. Hybrid RAG w/ RRF + cross-encoder + Recall@K/MRR/nDCG (did not exist)
5. KTO / GRPO post-training (did not exist)

## 3. What was built — status & verification

| # | Workstream | Location | Verified |
|---|---|---|---|
| 1 | **LangGraph agents** | `backend/agent/graph.py` (`StateGraph`: intake→triage→respond→plan→guardian), `llm.py`, `triage.py` | ✅ graph executes; **212 backend tests pass** |
| 2 | **Supabase/PostgreSQL** | `backend/db/` (models, session, repository) + `/cases` endpoint | ✅ profile accretion, case lifecycle, timeline verified; 4 new tests |
| 3 | **4,000-example dataset** | `finetune/generate_dataset.py` → `finetune/data/*.jsonl` (3400/280/320) | ✅ **0 label mismatches** vs `agent/triage.py` |
| 4 | **QLoRA SFT + eval** | `finetune/train_qlora.py`, `evaluate.py` | ✅ eval math verified (perfect→100%, adversarial→0%). **Training NOT yet run** |
| 5 | **Hybrid RAG** | `backend/rag/` (corpus, hybrid, evaluate_rag, service) + `/rag/search` | ✅ BM25 baseline **Recall@10 81.6%, MRR 0.72, nDCG 0.71** on 2,826 passages. Dense/rerank not yet measured |
| 6 | **vLLM serving** | `backend/agent/llm.py` auto-routes on `FINETUNED_MODEL_BASE_URL`; `finetune/serve_vllm.md` | ✅ wired, not yet exercised |
| 7 | **KTO / GRPO** | `finetune/kto_align.py`, `grpo_tooluse.py` | ✅ reward + signal logic verified. **Not run** (honest WIP) |

Résumé-claim → code mapping lives in **`docs/RESUME_TRACEABILITY.md`** (the interview cheat sheet).

## 4. The design principle that makes this defensible

Fine-tune **labels**, the GRPO **reward**, and the safety **eval metric** are all
derived from the *same policy the production app uses* (`backend/agent/triage.py`
and `backend/services/guardian.py`). Nothing is fabricated or hand-waved. If asked
"how do you know the labels are right?" → they're distilled from the deployed
routing policy, and verified with 0 mismatches.

## 5. Pending owner actions (the critical path)

**A. Run the fine-tune** — the highest-value missing artifact. Needs a **separate
Python 3.10/3.11 env** (bitsandbytes has no 3.13 wheels; backend stays on 3.13):
```bash
conda create -n carekaki-ft python=3.11 -y && conda activate carekaki-ft
pip install torch --index-url https://download.pytorch.org/whl/cu121
cd finetune && pip install -r requirements.txt
python train_qlora.py --data data --epochs 3 --merge
python evaluate.py --adapter out/carekaki-qwen2.5-1.5b-qlora --data data
```
→ capture the base-vs-tuned table into `docs/RESUME_TRACEABILITY.md`.

**B. Postgres decision** — owner must choose Supabase (provide connection string for
`DATABASE_URL`) *or* local Docker Postgres. Until then the DB layer no-ops.

**C. Dense RAG numbers** — `pip install -r backend/rag/requirements-rag.txt`, then
`cd backend && python -m rag.evaluate_rag --n 300 --k 10` to add hybrid + rerank rows
above the 81.6% BM25 baseline.

**D. Frontend** — nothing built yet. Surfacing `riskLevel`, persisted `/cases`, and
RAG citations would strengthen a live demo.

## 6. Gotchas / non-obvious decisions

- **Python 3.13 backend vs 3.11 training env.** Keep them separate; bitsandbytes lags.
- **DB layer is opt-in by design.** No `DATABASE_URL` → every repository call no-ops
  and the app falls back to in-memory state. This keeps the demo unbreakable. Don't
  "fix" this by making the DB mandatory.
- **Lazy heavy imports are deliberate.** `finetune/evaluate.py` and `backend/rag/*`
  import torch/sentence-transformers *inside functions* so metric logic and BM25 run
  on machines with no GPU stack. Don't hoist them to module level.
- **`AGENTS.md` warns this Next.js has breaking API changes** — read
  `node_modules/next/dist/docs/` before writing any frontend code.
- `backend/agent/triage.py` is the single source of truth for risk + routing.
  `main.py` imports from it; duplicating that logic will cause drift.
- Dataset dedup: an earlier bug made the generator starve at 24 examples. `_fill()`
  in `generate_dataset.py` exists to prevent one exhausted template pool from
  blocking the whole run. Keep it.

## 7. Re-orienting a fresh session

Point a new session at this file, then:
```bash
cd backend && python -m pytest -q          # expect 212 passed
python -m rag.evaluate_rag --n 300 --k 10  # expect Recall@10 ≈ 81.6 (BM25)
```
If both match, the tree is in the state this document describes.
