# CareKaki post-training pipeline

End-to-end QLoRA fine-tuning of **Qwen2.5-1.5B-Instruct** on de-identified,
domain-specific CareKaki data, evaluated against the base model on three axes:
**structured tool selection**, **safety escalation**, and **evidence-grounded
response quality**.

```
finetune/
├── generate_dataset.py   # build ~4,000 chat examples (labels distilled from the app's triage policy)
├── train_qlora.py        # 4-bit NF4 + LoRA SFT, completion-only loss
├── evaluate.py           # base vs fine-tuned, side-by-side metrics
├── serve_vllm.md         # serve the merged model for the backend
├── kto_align.py          # KTO safety-alignment scaffold  (post-training bullet)
├── grpo_tooluse.py       # GRPO tool-use RL scaffold       (post-training bullet)
└── data/                 # train/val/test .jsonl (generated)
```

## 0. Environment (do this once)

> **Use Python 3.10 or 3.11 for this environment.** `bitsandbytes` wheels lag new
> Python releases, so the backend's 3.13 won't work for training. Keep them separate.

```bash
conda create -n carekaki-ft python=3.11 -y
conda activate carekaki-ft
# Install a CUDA torch matching your driver (check `nvidia-smi`):
pip install torch --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
```

## 1. Generate the dataset (no GPU needed)

```bash
python generate_dataset.py --n 4000 --out data
# optional: add linguistic diversity via paraphrase (needs OPENAI_API_KEY)
python generate_dataset.py --n 4000 --out data --paraphrase 0.25
```

Produces `data/{train,val,test}.jsonl` (~3400/280/320). Tool-selection and
safety-escalation labels are derived from the backend's own `agent/triage.py`
policy, so the model is trained to reproduce CareKaki's production routing — not
arbitrary labels. Messages are templated with no names / NRIC / phone numbers, so
the corpus is PDPA-safe by construction.

## 2. Train (single GPU, ~15–40 min for 1.5B)

```bash
python train_qlora.py --data data \
    --model Qwen/Qwen2.5-1.5B-Instruct \
    --out out/carekaki-qwen2.5-1.5b-qlora \
    --epochs 3 --batch 8 --merge
```

- 4-bit NF4 base + double quant, bf16 compute (the **Q** in QLoRA)
- LoRA `r=16, α=32` on all attention + MLP projections
- **Completion-only loss**: prompt tokens are masked (`-100`) so the model is
  trained only to produce the assistant turn
- `--merge` also writes an fp16 merged model for vLLM

## 3. Evaluate against the base model

```bash
python evaluate.py --model Qwen/Qwen2.5-1.5B-Instruct \
    --adapter out/carekaki-qwen2.5-1.5b-qlora --data data
```

Prints a side-by-side table with deltas and writes `eval_results.json`:

| metric | what it measures |
|---|---|
| `tool_exact_match` | risk level **and** adapter set both correct |
| `tool_adapter_microF1` | per-adapter precision/recall of the routing decision |
| `safety_escalation_recall` | **of cases that should escalate, how many did** (the safety-critical metric) |
| `evidence_citation_rate` | grounded answers that cite the provided `[Ex]` evidence |
| `evidence_no_medical_advice_rate` | answers that pass CareKaki's Guardian no-medical-advice check |

The `no_medical_advice_rate` metric reuses the backend's own
`services/guardian.py` classifier, so the eval and the production safety layer
agree by construction.

## 4. Serve for the app

See [serve_vllm.md](serve_vllm.md). In short: run vLLM on the merged model, then
point the backend at it:

```bash
# backend/.env
FINETUNED_MODEL_BASE_URL=http://localhost:8001/v1
FINETUNED_MODEL_NAME=carekaki-qwen2.5-1.5b
```

The agent's `llm.py` already routes through this when set — no code change needed.

## Post-training roadmap (in progress)

`kto_align.py` (KTO safety alignment) and `grpo_tooluse.py` (GRPO tool-use
optimisation) are runnable TRL-based scaffolds wired to the same dataset. They are
the "Building an end-to-end PyTorch post-training pipeline" workstream — SFT above
is complete; KTO/GRPO are the next stages.
