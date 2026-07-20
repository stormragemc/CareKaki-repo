# Serving the fine-tuned model with vLLM

The backend talks to any OpenAI-compatible endpoint. vLLM exposes exactly that, so
the fine-tuned Qwen2.5-1.5B drops in with **no backend code change** — only env vars.

## 1. Merge the adapter (if not done during training)

`train_qlora.py --merge` already writes `…-merged/`. Otherwise:

```bash
python merge_adapter.py \
    --base Qwen/Qwen2.5-1.5B-Instruct \
    --adapter out/carekaki-qwen2.5-1.5b-qlora \
    --out out/carekaki-qwen2.5-1.5b-merged
```

## 2. Launch vLLM

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
    --model out/carekaki-qwen2.5-1.5b-merged \
    --served-model-name carekaki-qwen2.5-1.5b \
    --port 8001
```

vLLM can also serve the LoRA adapter without merging via `--enable-lora
--lora-modules carekaki=out/carekaki-qwen2.5-1.5b-qlora`.

## 3. Point the backend at it

```bash
# backend/.env
FINETUNED_MODEL_BASE_URL=http://localhost:8001/v1
FINETUNED_MODEL_NAME=carekaki-qwen2.5-1.5b
```

`backend/agent/llm.py` reads these on startup and constructs the OpenAI client
against vLLM. The LangGraph nodes (intake / respond) then run on the fine-tuned
model. Unset them to fall back to the hosted model.

## 4. Verify

```bash
curl http://localhost:8001/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "carekaki-qwen2.5-1.5b",
  "messages": [
    {"role":"system","content":"You are CareKaki..."},
    {"role":"user","content":"Decide how CareKaki should route this: My mother fell and hit her head. Return JSON."}
  ]
}'
```

Then hit the backend `/chat` and confirm the structured routing/escalation matches
the fine-tuned model's behaviour.
