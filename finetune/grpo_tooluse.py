"""GRPO tool-use optimisation stage (post-SFT).

Group Relative Policy Optimisation with a *programmatic* reward: the model samples
several routing decisions per prompt, and each is scored against CareKaki's real
routing policy (backend/agent/triage.py) — adapter-set F1 plus a risk-level bonus.
No learned reward model needed; the environment is the ground truth.

This is the GRPO workstream of the post-training pipeline. Runnable once trl + GPU
are available:

    python grpo_tooluse.py --sft out/carekaki-qwen2.5-1.5b-qlora --data data --out out/grpo

NOTE: in-progress RL stage; SFT is the completed baseline it refines.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Reward uses the production routing policy so RL optimises the real objective.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from agent.triage import classify_risk, plan_adapters  # noqa: E402

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


def load_jsonl(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def _parse(text: str) -> dict:
    m = _JSON_RE.search(text or "")
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


def _f1(pred: set[str], gold: set[str]) -> float:
    if not pred and not gold:
        return 1.0
    tp = len(pred & gold)
    prec = tp / len(pred) if pred else 0.0
    rec = tp / len(gold) if gold else 0.0
    return 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0


def routing_reward(completions: list[str], gold_message: list[str], **kwargs) -> list[float]:
    """Reward each sampled completion against the deterministic routing policy.

    `gold_message` is the original caregiver message, threaded through as a dataset
    column so the reward can recompute the policy target on the fly.
    """
    rewards = []
    for text, msg in zip(completions, gold_message):
        gold_risk = classify_risk(msg)
        gold_adapters = set(plan_adapters(msg)) if gold_risk in ("high", "medium") else set()
        pred = _parse(text)
        pred_adapters = set(pred.get("adapters", [])) if isinstance(pred.get("adapters"), list) else set()
        r = _f1(pred_adapters, gold_adapters)          # 0..1 adapter F1
        r += 0.5 if pred.get("risk_level") == gold_risk else 0.0  # risk bonus
        r += 0.1 if _JSON_RE.search(text or "") else -0.2         # valid-JSON shaping
        rewards.append(r)
    return rewards


def build_grpo_dataset(rows: list[dict]) -> list[dict]:
    out = []
    for r in rows:
        if r["task"] != "tool_selection":
            continue
        user = r["messages"][1]["content"]
        msg = user.split("Message: ")[-1]
        out.append({
            "prompt": [r["messages"][0], r["messages"][1]],  # system + user (chat format)
            "gold_message": msg,
        })
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sft", required=True)
    ap.add_argument("--base", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--data", default="data")
    ap.add_argument("--out", default="out/grpo")
    ap.add_argument("--epochs", type=float, default=1.0)
    args = ap.parse_args()

    import torch
    from datasets import Dataset
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    from trl import GRPOConfig, GRPOTrainer

    tokenizer = AutoTokenizer.from_pretrained(args.base, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    rows = load_jsonl(Path(args.data) / "train.jsonl")
    ds = Dataset.from_list(build_grpo_dataset(rows))
    print(f"[grpo] {len(ds)} tool-selection prompts")

    base = AutoModelForCausalLM.from_pretrained(
        args.base, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True)
    model = PeftModel.from_pretrained(base, args.sft, is_trainable=True)

    cfg = GRPOConfig(
        output_dir=args.out, num_train_epochs=args.epochs,
        per_device_train_batch_size=4, gradient_accumulation_steps=4,
        num_generations=8,          # group size G for GRPO
        max_completion_length=96, learning_rate=1e-6,
        bf16=True, logging_steps=20, report_to="none",
    )
    trainer = GRPOTrainer(
        model=model, args=cfg, train_dataset=ds,
        reward_funcs=routing_reward, processing_class=tokenizer,
    )
    trainer.train()
    trainer.save_model(args.out)
    print(f"[grpo] tool-use-optimised checkpoint saved to {args.out}")


if __name__ == "__main__":
    main()
