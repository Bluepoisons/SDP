"""
LoRA fine-tuning script for RTX 4070 (12GB VRAM).
Preferred: Unsloth (fast + low VRAM). Fallback: Transformers + PEFT + bitsandbytes.

Usage (from backend/):
  python train_model.py

Expected dataset:
  data/lora_train.jsonl
Output adapter:
  models/galgame_adapter_v1
"""

import os
import json
from typing import List, Dict

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "lora_train.jsonl")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "models", "galgame_adapter_v1")
BASE_MODEL = os.getenv("BASE_MODEL", "unsloth/Qwen2.5-7B-Instruct")


def load_jsonl(path: str) -> List[Dict]:
  samples = []
  if not os.path.exists(path):
    raise FileNotFoundError(f"Dataset not found: {path}")
  with open(path, "r", encoding="utf-8") as f:
    for line in f:
      line = line.strip()
      if not line:
        continue
      samples.append(json.loads(line))
  return samples


def format_prompt(sample: Dict) -> str:
  instruction = sample.get("instruction", "")
  input_text = sample.get("input", "")
  output_text = sample.get("output", "")
  return f"<|user|>\n{instruction}\n{input_text}\n<|assistant|>\n{output_text}"


def train_with_unsloth(samples: List[Dict]):
  from unsloth import FastLanguageModel
  from datasets import Dataset

  model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=BASE_MODEL,
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=True,
  )

  model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing=True,
  )

  dataset = Dataset.from_list([{"text": format_prompt(s)} for s in samples])

  from transformers import TrainingArguments
  from unsloth import SFTTrainer

  trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    args=TrainingArguments(
      output_dir=OUTPUT_DIR,
      per_device_train_batch_size=2,
      gradient_accumulation_steps=4,
      num_train_epochs=3,
      learning_rate=2e-4,
      logging_steps=10,
      save_steps=100,
      bf16=False,
      fp16=True,
      optim="adamw_8bit",
      report_to=[],
    ),
  )

  trainer.train()
  model.save_pretrained(OUTPUT_DIR)
  tokenizer.save_pretrained(OUTPUT_DIR)


def train_with_transformers(samples: List[Dict]):
  from datasets import Dataset
  from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
  from peft import LoraConfig, get_peft_model
  import bitsandbytes as bnb

  tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
  model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    load_in_4bit=True,
    device_map="auto",
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype="float16",
  )

  peft_config = LoraConfig(
    r=16,
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
  )

  model = get_peft_model(model, peft_config)

  dataset = Dataset.from_list([{"text": format_prompt(s)} for s in samples])

  def tokenize(batch):
    return tokenizer(batch["text"], truncation=True, max_length=2048)

  tokenized = dataset.map(tokenize, batched=True, remove_columns=["text"])

  args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    num_train_epochs=3,
    learning_rate=2e-4,
    logging_steps=10,
    save_steps=100,
    fp16=True,
    report_to=[],
  )

  trainer = Trainer(model=model, args=args, train_dataset=tokenized)
  trainer.train()
  model.save_pretrained(OUTPUT_DIR)
  tokenizer.save_pretrained(OUTPUT_DIR)


def merge_and_reload_hint():
  print("\n[Hint] To use the adapter in backend:")
  print("1) Load base model + adapter weights in your local inference server.")
  print("2) Point backend to the updated local model on next start.")
  print("3) Optionally merge adapter into base using PEFT/transformers before serving.")


def main():
  samples = load_jsonl(DATA_PATH)
  try:
    train_with_unsloth(samples)
  except Exception as e:
    print(f"Unsloth failed, fallback to transformers. Reason: {e}")
    train_with_transformers(samples)

  merge_and_reload_hint()


if __name__ == "__main__":
  os.makedirs(OUTPUT_DIR, exist_ok=True)
  main()
