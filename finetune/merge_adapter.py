"""Merge a trained LoRA adapter into the base weights for fp16 vLLM serving."""

import argparse


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--adapter", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    base = AutoModelForCausalLM.from_pretrained(
        args.base, torch_dtype=torch.float16, trust_remote_code=True)
    model = PeftModel.from_pretrained(base, args.adapter)
    model = model.merge_and_unload()
    model.save_pretrained(args.out)
    AutoTokenizer.from_pretrained(args.base, trust_remote_code=True).save_pretrained(args.out)
    print(f"[merge] merged model written to {args.out}")


if __name__ == "__main__":
    main()
