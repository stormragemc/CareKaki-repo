"""Evaluate the base vs QLoRA-fine-tuned Qwen2.5-1.5B on the held-out CareKaki test set.

Metrics (per the resume: "structured tool selection, safety escalation and
evidence-grounded response quality against the base model"):

  tool_selection    exact_match, risk_accuracy, adapter micro-F1
  safety_escalation risk_accuracy, high-risk escalation RECALL (the safety-critical one)
  evidence_response citation_rate, no_medical_advice_rate (via CareKaki Guardian)

    python evaluate.py --model Qwen/Qwen2.5-1.5B-Instruct \
        --adapter out/carekaki-qwen2.5-1.5b-qlora --data data

Passing --adapter runs BOTH the base model and the adapter and prints a side-by-side
comparison with deltas. Omit it to score just the base model.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# torch / transformers are imported lazily inside load_model()/generate() so the
# metric logic here can be imported and tested on a machine without a GPU stack.

# Reuse CareKaki's own no-medical-advice classifier for the safety metric.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from services.guardian import check_medical_advice  # noqa: E402

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)
_CITE_RE = re.compile(r"\[E\d+\]")


def load_jsonl(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def parse_json(text: str) -> dict:
    m = _JSON_RE.search(text or "")
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


def generate(model, tokenizer, messages: list[dict], max_new_tokens: int = 220) -> str:
    import torch
    prompt_ids = tokenizer.apply_chat_template(
        messages[:-1], add_generation_prompt=True, return_tensors="pt"
    ).to(model.device)
    with torch.no_grad():
        out = model.generate(
            prompt_ids, max_new_tokens=max_new_tokens, do_sample=False,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        )
    return tokenizer.decode(out[0, prompt_ids.shape[1]:], skip_special_tokens=True).strip()


def evaluate(model, tokenizer, rows: list[dict]) -> dict:
    tool = {"n": 0, "exact": 0, "risk_ok": 0}
    # adapter micro-F1 accumulators
    tp = fp = fn = 0
    safety = {"n": 0, "risk_ok": 0, "esc_gold": 0, "esc_recall_hit": 0}
    evid = {"n": 0, "cited": 0, "no_med_advice": 0}

    for r in rows:
        task = r["task"]
        gold = r["messages"][-1]["content"]
        pred_text = generate(model, tokenizer, r["messages"])

        if task == "tool_selection":
            g, p = parse_json(gold), parse_json(pred_text)
            tool["n"] += 1
            g_adapters, p_adapters = set(g.get("adapters", [])), set(p.get("adapters", []))
            risk_ok = g.get("risk_level") == p.get("risk_level")
            tool["risk_ok"] += int(risk_ok)
            tool["exact"] += int(risk_ok and g_adapters == p_adapters)
            tp += len(g_adapters & p_adapters)
            fp += len(p_adapters - g_adapters)
            fn += len(g_adapters - p_adapters)

        elif task == "safety_escalation":
            g, p = parse_json(gold), parse_json(pred_text)
            safety["n"] += 1
            safety["risk_ok"] += int(g.get("risk_level") == p.get("risk_level"))
            if g.get("escalate_to_human"):
                safety["esc_gold"] += 1
                safety["esc_recall_hit"] += int(bool(p.get("escalate_to_human")))

        elif task == "evidence_response":
            evid["n"] += 1
            gold_cites = set(_CITE_RE.findall(gold))
            pred_cites = set(_CITE_RE.findall(pred_text))
            evid["cited"] += int(bool(pred_cites & gold_cites))
            evid["no_med_advice"] += int(not check_medical_advice(pred_text)["needs_disclaimer"])

    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return {
        "tool_exact_match": _pct(tool["exact"], tool["n"]),
        "tool_risk_accuracy": _pct(tool["risk_ok"], tool["n"]),
        "tool_adapter_microF1": round(f1, 4),
        "safety_risk_accuracy": _pct(safety["risk_ok"], safety["n"]),
        "safety_escalation_recall": _pct(safety["esc_recall_hit"], safety["esc_gold"]),
        "evidence_citation_rate": _pct(evid["cited"], evid["n"]),
        "evidence_no_medical_advice_rate": _pct(evid["no_med_advice"], evid["n"]),
    }


def _pct(a: int, b: int) -> float:
    return round(100.0 * a / b, 2) if b else 0.0


def load_model(model_id: str, adapter: str | None):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        model_id, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True
    )
    if adapter:
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, adapter)
    model.eval()
    return model, tokenizer


def print_table(base: dict, tuned: dict | None) -> None:
    keys = list(base.keys())
    if tuned is None:
        print(f"\n{'metric':<34}{'base':>10}")
        for k in keys:
            print(f"{k:<34}{base[k]:>10}")
        return
    print(f"\n{'metric':<34}{'base':>10}{'fine-tuned':>14}{'delta':>10}")
    for k in keys:
        d = round(tuned[k] - base[k], 2)
        print(f"{k:<34}{base[k]:>10}{tuned[k]:>14}{('+' if d >= 0 else '') + str(d):>10}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--adapter", default=None, help="LoRA adapter dir; if set, compares vs base")
    ap.add_argument("--data", default="data")
    ap.add_argument("--limit", type=int, default=0, help="cap test rows (0 = all)")
    ap.add_argument("--out", default="eval_results.json")
    args = ap.parse_args()

    rows = load_jsonl(Path(args.data) / "test.jsonl")
    if args.limit:
        rows = rows[: args.limit]

    print(f"[eval] {len(rows)} test rows | base = {args.model}")
    base_model, tok = load_model(args.model, adapter=None)
    base_metrics = evaluate(base_model, tok, rows)
    results = {"base": base_metrics}

    tuned_metrics = None
    if args.adapter:
        import torch
        del base_model
        torch.cuda.empty_cache()
        print(f"[eval] loading fine-tuned adapter = {args.adapter}")
        tuned_model, tok = load_model(args.model, adapter=args.adapter)
        tuned_metrics = evaluate(tuned_model, tok, rows)
        results["fine_tuned"] = tuned_metrics

    print_table(base_metrics, tuned_metrics)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n[eval] metrics written to {args.out}")


if __name__ == "__main__":
    main()
