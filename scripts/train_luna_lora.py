#!/usr/bin/env python3
"""
LifeOS — Luna QLoRA Fine-Tuning Execution Script
Framework: Unsloth + HuggingFace TRL (SFTTrainer)
Target Base Models:
  - unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit (Default)
  - unsloth/Meta-Llama-3.3-70B-Instruct-bnb-4bit (High VRAM / A100)
"""

import os
import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 1. Hyperparameter Configuration
MAX_SEQ_LENGTH = 3072
DTYPE = None  # Auto-select float16 or bfloat16 based on GPU
LOAD_IN_4BIT = True
MODEL_NAME = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit"
DATASET_PATH = "scripts/data/luna_chatml_dataset_2500.jsonl"

print(f"Loading Base Model: {MODEL_NAME} with 4-bit NormalFloat quantization...")

# 2. Initialize Model & Fast Tokenizer
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=DTYPE,
    load_in_4bit=LOAD_IN_4BIT,
)

# 3. Attach LoRA Adapter
print("Attaching LoRA Adapter (Rank 16, Alpha 32) across all 7 linear projections...")
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
)

# 4. Load & Format Dataset
print(f"Loading Dataset from {DATASET_PATH}...")
dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

def format_chatml_prompt(batch):
    convos = batch["messages"]
    texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
    return {"text": texts}

formatted_dataset = dataset.map(format_chatml_prompt, batched=True)

# 5. Trainer Initialization
print("Configuring SFTTrainer...")
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=formatted_dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    dataset_num_proc=2,
    packing=True,
    args=TrainingArguments(
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        warmup_ratio=0.05,
        max_steps=300,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=3407,
        output_dir="dist/luna_lora_checkpoints",
        save_strategy="steps",
        save_steps=100,
    ),
)

# 6. Execute Fine-Tuning
print("Starting Luna Fine-Tuning Run...")
trainer.train()

# 7. Multi-Target Export
os.makedirs("dist", exist_ok=True)
print("Saving LoRA Adapter to dist/luna_lora_adapter...")
model.save_pretrained_merged("dist/luna_lora_adapter", tokenizer, save_method="lora")

print("Saving 16-bit Merged Model to dist/luna_merged_16bit...")
model.save_pretrained_merged("dist/luna_merged_16bit", tokenizer, save_method="merged_16bit")

print("Exporting GGUF (q4_k_m) to dist/luna_gguf_q4km...")
try:
    model.save_pretrained_gguf("dist/luna_gguf_q4km", tokenizer, quantization_method="q4_k_m")
except Exception as e:
    print(f"GGUF export notice: {e}")

print("Luna Training Pipeline Complete.")

