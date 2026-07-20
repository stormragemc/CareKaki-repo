"""QLoRA supervised fine-tuning of Qwen2.5-1.5B-Instruct on the CareKaki dataset.

4-bit NF4 base weights + LoRA adapters, completion-only loss (the prompt tokens are
masked so the model is only trained to produce the assistant turn). Runs on a single
consumer GPU — a 1.5B model in 4-bit fits comfortably in ~6-8 GB.

    python train_qlora.py \
        --data data --model Qwen/Qwen2.5-1.5B-Instruct \
        --out out/carekaki-qwen2.5-1.5b-qlora --epochs 3

Merge the adapter for vLLM serving afterwards with --merge (or run merge_adapter.py).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    Trainer,
    TrainingArguments,
    DataCollatorForSeq2Seq,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

IGNORE_INDEX = -100


def load_jsonl(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def build_tokenize_fn(tokenizer, max_len: int):
    """Tokenize a chat example, masking every prompt token so loss is computed
    only over the assistant completion."""
    def _tok(example: dict) -> dict:
        messages = example["messages"]
        # Full conversation ids.
        full_ids = tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=False,
        )
        # Prompt = everything up to and including the assistant header, no completion.
        prompt_ids = tokenizer.apply_chat_template(
            messages[:-1], tokenize=True, add_generation_prompt=True,
        )
        full_ids = full_ids[:max_len]
        labels = list(full_ids)
        prompt_len = min(len(prompt_ids), len(full_ids))
        for i in range(prompt_len):
            labels[i] = IGNORE_INDEX
        return {"input_ids": full_ids, "labels": labels,
                "attention_mask": [1] * len(full_ids)}
    return _tok


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data")
    ap.add_argument("--model", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--out", default="out/carekaki-qwen2.5-1.5b-qlora")
    ap.add_argument("--epochs", type=float, default=3.0)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--grad_accum", type=int, default=2)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--max_len", type=int, default=1024)
    ap.add_argument("--lora_r", type=int, default=16)
    ap.add_argument("--lora_alpha", type=int, default=32)
    ap.add_argument("--merge", action="store_true", help="also save a merged fp16 model")
    args = ap.parse_args()

    data_dir = Path(args.data)
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 4-bit NF4 quantization (the "Q" in QLoRA).
    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
    )
    model = AutoModelForCausalLM.from_pretrained(
        args.model, quantization_config=bnb, device_map="auto",
        trust_remote_code=True, torch_dtype=torch.bfloat16,
    )
    model = prepare_model_for_kbit_training(model)
    model.config.use_cache = False

    lora = LoraConfig(
        r=args.lora_r, lora_alpha=args.lora_alpha, lora_dropout=0.05, bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    tok_fn = build_tokenize_fn(tokenizer, args.max_len)
    train_ds = Dataset.from_list(load_jsonl(data_dir / "train.jsonl")).map(
        tok_fn, remove_columns=["messages", "task"])
    val_ds = Dataset.from_list(load_jsonl(data_dir / "val.jsonl")).map(
        tok_fn, remove_columns=["messages", "task"])

    collator = DataCollatorForSeq2Seq(
        tokenizer, label_pad_token_id=IGNORE_INDEX, padding=True)

    targs = TrainingArguments(
        output_dir=args.out,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        logging_steps=20,
        eval_strategy="epoch",
        save_strategy="epoch",
        bf16=True,
        optim="paged_adamw_8bit",
        gradient_checkpointing=True,
        report_to="none",
        save_total_limit=2,
    )
    trainer = Trainer(
        model=model, args=targs, train_dataset=train_ds,
        eval_dataset=val_ds, data_collator=collator,
    )
    trainer.train()

    Path(args.out).mkdir(parents=True, exist_ok=True)
    trainer.save_model(args.out)
    tokenizer.save_pretrained(args.out)
    print(f"[done] adapter saved to {args.out}")

    if args.merge:
        merged_dir = args.out + "-merged"
        merged = model.merge_and_unload()
        merged.save_pretrained(merged_dir)
        tokenizer.save_pretrained(merged_dir)
        print(f"[done] merged fp16 model saved to {merged_dir} (ready for vLLM)")


if __name__ == "__main__":
    main()
