"""KTO safety-alignment stage (post-SFT).

Kahneman-Tversky Optimisation nudges the model toward *safe* behaviour using binary
desirable/undesirable signals (no paired preferences needed). We mint the signal
directly from CareKaki's safety policy:

  desirable   = the correct completion (escalates when the policy says escalate;
                cites evidence; no medical advice)
  undesirable = a safety-violating variant (drops the escalation / injects dosage advice)

This is the KTO workstream of the post-training pipeline. It is runnable against the
SFT checkpoint once `trl` + a GPU are available:

    python kto_align.py --sft out/carekaki-qwen2.5-1.5b-qlora --data data --out out/kto

NOTE: this is the in-progress alignment stage — SFT (train_qlora.py) is the
completed baseline it builds on.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


def load_jsonl(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def _prompt_text(tokenizer, messages: list[dict]) -> str:
    return tokenizer.apply_chat_template(
        messages[:-1], tokenize=False, add_generation_prompt=True)


def _unsafe_variant(task: str, completion: str) -> str | None:
    """Turn a correct completion into a safety-violating one (the 'undesirable')."""
    if task == "safety_escalation":
        obj = _JSON_RE.search(completion)
        if not obj:
            return None
        try:
            d = json.loads(obj.group(0))
        except Exception:
            return None
        if not d.get("escalate_to_human"):
            return None  # only flip cases that SHOULD escalate
        d["escalate_to_human"] = False
        d["risk_level"] = "low"
        return json.dumps(d)
    if task == "evidence_response":
        # Inject the exact pattern Guardian flags as medical advice.
        return "You clearly have a stroke — take 5mg of aspirin now and stop your other medication."
    return None


def build_kto_rows(tokenizer, rows: list[dict]) -> list[dict]:
    kto: list[dict] = []
    for r in rows:
        prompt = _prompt_text(tokenizer, r["messages"])
        good = r["messages"][-1]["content"]
        kto.append({"prompt": prompt, "completion": good, "label": True})
        bad = _unsafe_variant(r["task"], good)
        if bad is not None:
            kto.append({"prompt": prompt, "completion": bad, "label": False})
    return kto


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sft", required=True, help="SFT checkpoint / adapter dir")
    ap.add_argument("--base", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--data", default="data")
    ap.add_argument("--out", default="out/kto")
    ap.add_argument("--epochs", type=float, default=1.0)
    args = ap.parse_args()

    import torch
    from datasets import Dataset
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    from trl import KTOConfig, KTOTrainer

    tokenizer = AutoTokenizer.from_pretrained(args.base, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    rows = load_jsonl(Path(args.data) / "train.jsonl")
    kto_rows = build_kto_rows(tokenizer, rows)
    n_pos = sum(r["label"] for r in kto_rows)
    print(f"[kto] {len(kto_rows)} rows  ({n_pos} desirable / {len(kto_rows) - n_pos} undesirable)")
    ds = Dataset.from_list(kto_rows)

    base = AutoModelForCausalLM.from_pretrained(
        args.base, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True)
    model = PeftModel.from_pretrained(base, args.sft, is_trainable=True)

    cfg = KTOConfig(
        output_dir=args.out, num_train_epochs=args.epochs,
        per_device_train_batch_size=4, gradient_accumulation_steps=4,
        learning_rate=5e-6, bf16=True, logging_steps=20, report_to="none",
    )
    trainer = KTOTrainer(model=model, args=cfg, train_dataset=ds, processing_class=tokenizer)
    trainer.train()
    trainer.save_model(args.out)
    print(f"[kto] aligned checkpoint saved to {args.out}")


if __name__ == "__main__":
    main()
