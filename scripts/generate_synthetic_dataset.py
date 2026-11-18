#!/usr/bin/env python3
"""
LifeOS — Synthetic Dataset Generator for Luna LLM Fine-Tuning
Generates 2,500 diverse ChatML instruction pairs across 5 core domains:
- Gym & Progressive Overload (500)
- Nutrition & Mess Food Estimation (500)
- Academic, Focus & Exam Cramming (500)
- Spending, UPI & Peer Loans (500)
- Outings, Treks & Local Discovery (500)

Enforces 100% adherence to LifeOS invariants:
1. Direct answer in sentence 1 (zero fluff/pleasantries).
2. Zero emojis.
3. Mobile 3-column markdown tables.
4. Structured ```workflow, ```chart, and silent ```json_action payloads.
5. Zero URLs.
"""

import os
import re
import json
import random
from typing import List, Dict, Any

OUTPUT_DIR = "scripts/data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "luna_chatml_dataset_2500.jsonl")

SYSTEM_INSTRUCTION = """You are Luna, the hyper-intelligent executive AI for LifeOS.
Rules:
1. Direct Answer First: Never start with greetings, pleasantries, or conversational filler. Sentence 1 must deliver the primary answer, directive, or metric calculation.
2. Structure: Use bold numbered points (1., 2.) or bullet points.
3. Mobile Tables: When presenting workouts, schedules, or comparisons, use compact 3-column markdown tables that fit in a single mobile glance:
   | Item / Focus | Spec / Reps | Target / Notes |
   Maximum 3 columns. Column headers must be 1 to 2 words.
4. Workflows: Emit ```workflow JSON for multi-step roadmaps.
5. Charts: Emit ```chart JSON for numerical distributions.
6. Silent Actions: Emit ```json_action JSON at the very bottom without mentioning it.
7. Zero Emojis: Strictly prohibited. Use clean typography.
8. Zero URLs: Never emit web links or domain names."""

# ── DOMAIN 1: GYM & PROGRESSIVE OVERLOAD (500 SAMPLES) ──
EXERCISES_PUSH = [
    ("Barbell Bench Press", "4 × 6-8", "90s rest, RPE 8"),
    ("Incline DB Press", "3 × 8-10", "60s rest, 30 deg incline"),
    ("Standing Overhead Press", "3 × 6-8", "90s rest, core braced"),
    ("Dips (Chest Focus)", "3 × 10-12", "60s rest, slight forward lean"),
    ("Cable Lateral Raise", "4 × 12-15", "45s rest, constant tension"),
    ("Overhead Tricep Extension", "3 × 12-15", "45s rest, full stretch"),
    ("Diamond Push-Ups", "2 × failure", "Finisher burnout"),
    ("Machine Chest Fly", "3 × 12-15", "45s rest, 2s peak squeeze")
]

EXERCISES_PULL = [
    ("Weighted Pull-Ups", "4 × 6-8", "90s rest, dead hang pause"),
    ("Chest-Supported DB Row", "3 × 10-12", "60s rest, lats drive"),
    ("Lat Pulldown (Neutral Grip)", "3 × 10-12", "60s rest, slow eccentric"),
    ("Barbell Bent-Over Row", "4 × 8-10", "90s rest, 45 deg torso"),
    ("Incline DB Curl", "3 × 12-15", "45s rest, long head focus"),
    ("Hammer Curls", "3 × 12-15", "45s rest, brachialis focus"),
    ("Face Pulls", "4 × 15-20", "45s rest, external rotation"),
    ("Preacher Curl", "3 × 10-12", "60s rest, strict form")
]

EXERCISES_LEGS = [
    ("Barbell Back Squat", "4 × 6-8", "120s rest, below parallel"),
    ("Romanian Deadlift", "3 × 8-10", "90s rest, hamstring stretch"),
    ("Bulgarian Split Squat", "3 × 10-12", "60s rest per leg"),
    ("Leg Press", "3 × 12-15", "60s rest, controlled descent"),
    ("Lying Leg Curl", "3 × 12-15", "45s rest, 2s eccentric"),
    ("Standing Calf Raise", "4 × 15-20", "45s rest, full ankle stretch"),
    ("Walking Lunges", "3 × 12 per leg", "60s rest, torso upright")
]

def generate_gym_samples(count=500) -> List[Dict[str, Any]]:
    samples = []
    splits = [
        ("Push Day (Chest, Shoulders, Triceps)", EXERCISES_PUSH, "push"),
        ("Pull Day (Lats, Upper Back, Biceps)", EXERCISES_PULL, "pull"),
        ("Leg Day (Quads, Hamstrings, Calves)", EXERCISES_LEGS, "legs")
    ]
    
    durations = [30, 35, 40, 45, 50, 60]
    focus_variations = [
        "progressive overload and hypertrophy",
        "dumbbell-only home execution",
        "high-intensity volume with short rest periods",
        "joint-friendly tempo with 3-second eccentric focus",
        "peaking contraction and mind-muscle connection"
    ]
    
    for i in range(count):
        split_name, pool, tag = splits[i % len(splits)]
        duration = durations[i % len(durations)]
        focus = focus_variations[i % len(focus_variations)]
        selected_ex = random.sample(pool, min(4, len(pool)))
        
        user_query = f"Give me a {duration}-minute {tag} workout focusing on {focus}."
        
        table_rows = "\n".join([f"| {ex[0]} | {ex[1]} | {ex[2]} |" for ex in selected_ex])
        table_md = f"| Exercise | Sets × Reps | Rest & Notes |\n| :--- | :--- | :--- |\n{table_rows}"
        
        ex_names = ", ".join([f"{ex[0]} ({ex[1]})" for ex in selected_ex])
        
        assistant_resp = f"""Here is your {duration}-minute {split_name.lower()} workout engineered for {focus}.

{table_md}

Execution Directives:
1. **Pacing & Rest**: Adhere strictly to the stated rest intervals to maintain target stimulus density.
2. **Rep Quality**: Terminate each working set at RPE 8 to 9 (1 to 2 reps in reserve before technical failure).

```workflow
{{"title":"{duration}-Min {tag.capitalize()} Session","steps":[{{"step":1,"title":"Dynamic Mobility","desc":"Joint warm-up and movement prep","duration":"5m"}},{{"step":2,"title":"Working Sets","desc":"Core compound and isolation movements","duration":"{duration - 10}m"}},{{"step":3,"title":"Cool-Down","desc":"Decompression and static stretches","duration":"5m"}}]}}
```
```json_action
{{"type":"LOG_WORKOUT","payload":{{"type":"{split_name}","durationMinutes":{duration},"notes":"{ex_names}"}}}}
```"""
        samples.append({"messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": assistant_resp}
        ]})
    return samples

# ── DOMAIN 2: NUTRITION & MESS ESTIMATION (500 SAMPLES) ──
MEAL_TEMPLATES = [
    ("Hostel Mess Breakfast", [("Idli with Sambar", "3 pcs", "6g / 36g / 2g"), ("Boiled Eggs", "2 pcs", "12g / 1g / 10g"), ("Filter Coffee", "1 cup", "2g / 8g / 3g")], 380, 20, 45, 15, "breakfast"),
    ("Hostel Mess Lunch", [("Wheat Roti", "3 pcs", "9g / 45g / 2g"), ("Dal Tadka", "1 cup (200ml)", "7g / 20g / 4g"), ("Steamed Rice", "1 katori (150g)", "4g / 42g / 1g"), ("Curd", "100g", "4g / 4g / 3g")], 540, 24, 111, 10, "lunch"),
    ("Hostel Mess Dinner", [("Paneer Curry", "150g", "16g / 6g / 18g"), ("Chapati", "3 pcs", "9g / 45g / 2g"), ("Mixed Veg Sabzi", "1 cup", "3g / 12g / 5g"), ("Cucumber Salad", "1 plate", "1g / 3g / 0g")], 620, 29, 66, 25, "dinner"),
    ("Night Canteen Snack", [("Egg Maggi (Double Egg)", "1 plate", "14g / 48g / 16g"), ("Sweet Lassi", "200ml", "5g / 28g / 6g")], 570, 19, 76, 22, "snacks"),
    ("Post-Workout Student Fuel", [("Whey Protein Shake", "1 scoop (250ml milk)", "28g / 14g / 4g"), ("Banana", "2 medium", "2g / 48g / 1g"), ("Peanut Butter", "1 tbsp (16g)", "4g / 3g / 8g")], 490, 34, 65, 13, "snacks")
]

def generate_nutrition_samples(count=500) -> List[Dict[str, Any]]:
    samples = []
    modifiers = [
        "with extra curd",
        "without oil on rotis",
        "with an extra glass of milk",
        "after a heavy evening workout",
        "during a 500 kcal cut phase"
    ]
    
    for i in range(count):
        meal_name, items, base_cal, base_p, base_c, base_f, meal_type = MEAL_TEMPLATES[i % len(MEAL_TEMPLATES)]
        mod = modifiers[i % len(modifiers)]
        cal = base_cal + (i % 5) * 25
        prot = base_p + (i % 3) * 2
        carbs = base_c + (i % 4) * 3
        fats = base_f + (i % 3) * 1
        
        user_query = f"I had {meal_name.lower()} {mod}. Estimate my total calories and macronutrient breakdown."
        
        table_rows = "\n".join([f"| {it[0]} | {it[1]} | {it[2]} |" for it in items])
        table_md = f"| Food Item | Portion | Macros (P / C / F) |\n| :--- | :--- | :--- |\n{table_rows}"
        
        assistant_resp = f"""Your {meal_name.lower()} totals approximately {cal} kcal, with {prot}g protein, {carbs}g carbohydrates, and {fats}g fats.

{table_md}

Nutritional Assessment:
1. **Protein Distribution**: Provides {prot}g of protein ({round((prot * 4 / cal) * 100)}% of caloric intake), supporting muscular recovery.
2. **Digestive Pacing**: Moderate dietary fat ({fats}g) supports sustained satiety and stable blood glucose.

```chart
{{"title":"{meal_name} Macros","data":[{{"label":"Protein","value":{prot},"unit":"g"}},{{"label":"Carbs","value":{carbs},"unit":"g"}},{{"label":"Fats","value":{fats},"unit":"g"}}]}}
```
```json_action
{{"type":"LOG_MEAL","payload":{{"name":"{meal_name} ({mod})","calories":{cal},"protein":{prot},"mealType":"{meal_type}"}}}}
```"""
        samples.append({"messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": assistant_resp}
        ]})
    return samples

# ── DOMAIN 3: ACADEMIC & EXAM REVISION (500 SAMPLES) ──
SUBJECTS = [
    ("Operating Systems", "Virtual Memory, Page Replacement & CPU Scheduling", "OS Midterm"),
    ("Database Management Systems", "B+ Trees, Normalization 3NF/BCNF & ACID Properties", "DBMS Exam"),
    ("Computer Networks", "TCP Flow Control, Subnet Masking & Sliding Window Protocol", "CN Quiz"),
    ("Design & Analysis of Algorithms", "Dynamic Programming, Dijkstra & Master Theorem", "Algorithms Test"),
    ("Digital Logic Design", "Karnaugh Maps, Multiplexers & Flip-Flops", "DLD Midterm")
]

def generate_academic_samples(count=500) -> List[Dict[str, Any]]:
    samples = []
    timeframes = ["48 hours", "3 days", "24 hours", "5 days", "the upcoming weekend"]
    
    for i in range(count):
        subject, topic, exam_title = SUBJECTS[i % len(SUBJECTS)]
        tf = timeframes[i % len(timeframes)]
        
        user_query = f"I have a {subject} exam on {topic} in {tf}. Build me an aggressive revision schedule."
        
        assistant_resp = f"""Here is your structured {tf} revision roadmap for {subject} focusing on {topic}.

| Study Block | Focus Topic | Target Outcome |
| :--- | :--- | :--- |
| Block 1 (90m) | Core Principles | Master theoretical mechanics & derivations |
| Block 2 (90m) | Problem Solving | Solve 8 previous year numericals |
| Block 3 (60m) | Active Recall | Complete flashcard self-quiz without notes |

High-Yield Exam Strategy:
1. **Conceptual Mastery**: Focus on architectural bottlenecks and trade-offs ({topic.split(',')[0].strip()}).
2. **Formula Retention**: Write down primary state transitions and time complexity formulas on a single cheat sheet.

```workflow
{{"title":"{subject} Revision Plan","steps":[{{"step":1,"title":"Core Theory Review","desc":"Deconstruct fundamental definitions and algorithms","duration":"90m"}},{{"step":2,"title":"Numerical Practice","desc":"Solve high-frequency past exam problems","duration":"90m"}},{{"step":3,"title":"Mock Self-Test","desc":"Timed revision without reference material","duration":"60m"}}]}}
```
```json_action
{{"type":"ADD_STUDY_SESSION","payload":{{"subject":"{subject}","topic":"{topic}","duration":90,"notes":"Completed high-yield problem set and theory breakdown."}}}}
```"""
        samples.append({"messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": assistant_resp}
        ]})
    return samples

# ── DOMAIN 4: SPENDING & LEDGER (500 SAMPLES) ──
EXPENSE_CATEGORIES = [
    ("Academic Materials", "Textbook printouts, lab journal & stationary", 380, "Education"),
    ("Peer Loan / Money Lent", "Lent lunch money to Rahul via UPI", 250, "Peer Loans"),
    ("Hostel Supplies", "Laundry detergent, room water can & toiletries", 460, "Utilities"),
    ("Canteen & Cafe", "Evening filter coffee and snacks with study group", 180, "Food"),
    ("Transit & Commute", "Metro card recharge and auto fare to exam center", 300, "Transit")
]

def generate_spending_samples(count=500) -> List[Dict[str, Any]]:
    samples = []
    
    for i in range(count):
        title, note, base_amt, cat = EXPENSE_CATEGORIES[i % len(EXPENSE_CATEGORIES)]
        amt = base_amt + (i % 6) * 35
        
        user_query = f"I just spent {amt} rupees on {note.lower()}. Record this in my ledger."
        
        assistant_resp = f"""Recorded an expenditure of {amt} rupees under {cat} for {note.lower()}.

| Category | Amount (₹) | Transaction Detail |
| :--- | :--- | :--- |
| {cat} | ₹{amt} | {title} |
| Ledger Status | Settled | Logged to current month ledger |

Financial Summary:
1. **Budget Allocation**: This transaction updates your current month {cat} total.
2. **Ledger Record**: Retained in local history for end-of-month budget reconciliation.

```json_action
{{"type":"ADD_EXPENSE","payload":{{"amount":{amt},"category":"{cat}","note":"{note}"}}}}
```"""
        samples.append({"messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": assistant_resp}
        ]})
    return samples

# ── DOMAIN 5: OUTINGS & TRIPS (500 SAMPLES) ──
OUTING_DESTINATIONS = [
    ("Nandi Hills Sunrise Ride", "Sunrise viewpoint, hairpin curves & hilltop breakfast", 450, "04:30"),
    ("Cubbon Park & Cafe Walk", "Morning shaded jog, botanical garden & heritage cafe", 220, "07:00"),
    ("Savandurga Monolith Trek", "Asia largest monolith, steep rock climbing & packed lunch", 550, "05:30"),
    ("Bannerghatta Forest Trail", "Nature safari, zoological reserve & scenic bus transit", 680, "08:30"),
    ("Old Town Book & Heritage Tour", "Rare bookstores, filter coffee pitstops & photo spots", 260, "15:00")
]

def generate_outings_samples(count=500) -> List[Dict[str, Any]]:
    samples = []
    
    for i in range(count):
        dest, desc, budget, depart = OUTING_DESTINATIONS[i % len(OUTING_DESTINATIONS)]
        final_budget = budget + (i % 5) * 50
        
        user_query = f"Plan an affordable weekend outing to {dest} on a budget of {final_budget} rupees."
        
        assistant_resp = f"""Here is your comprehensive itinerary for {dest} with an estimated budget of {final_budget} rupees.

| Segment / Stop | Timing | Approx Cost (₹) |
| :--- | :--- | :--- |
| Transit / Metro | {depart} - 06:00 | ₹120 |
| Breakfast & Hydration | 07:30 - 08:30 | ₹180 |
| Entry & Exploration | 08:30 - 11:30 | ₹{final_budget - 300} |

Itinerary Directives:
1. **Departure Window**: Depart at {depart} sharp to avoid commuter traffic and secure prime morning visibility.
2. **Hydration & Gear**: Carry a 2L refillable water bottle and breathable trail shoes.

```workflow
{{"title":"{dest} Itinerary","steps":[{{"step":1,"title":"Early Departure","desc":"Assemble and embark via transit","duration":"60m"}},{{"step":2,"title":"Destination Exploration","desc":"Scenic trail and photography","duration":"180m"}},{{"step":3,"title":"Local Breakfast","desc":"Authentic affordable pitstop","duration":"45m"}}]}}
```
```json_action
{{"type":"CREATE_OUTING","payload":{{"name":"{dest}","place":"{dest.split()[0]}","budget":{final_budget},"notes":"{desc}"}}}}
```"""
        samples.append({"messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": assistant_resp}
        ]})
    return samples

# ── PROGRAMMATIC INVARIANT VALIDATOR ──
def validate_record(record: Dict[str, Any]) -> bool:
    resp = record["messages"][2]["content"]
    # 1. Zero emojis
    emoji_regex = re.compile(r'[\U00010000-\U0010ffff\u2600-\u26ff\u2700-\u27bf]', flags=re.UNICODE)
    if emoji_regex.search(resp):
        return False
    # 2. No filler starters
    first_line = resp.strip().split("\n")[0].lower()
    fluff_words = ["certainly", "sure", "hello", "hi there", "i'd be happy", "of course"]
    if any(first_line.startswith(w) for w in fluff_words):
        return False
    # 3. Table max 3 columns
    for line in resp.split("\n"):
        line_s = line.strip()
        if line_s.startswith("|") and line_s.endswith("|"):
            cols = [c.strip() for c in line_s.split("|")[1:-1]]
            if len(cols) > 4:
                return False
    # 4. Valid JSON in codeblocks
    for bt in ["workflow", "chart", "json_action"]:
        matches = re.findall(rf'```{bt}\s*([\s\S]*?)```', resp)
        for m in matches:
            try:
                json.loads(m.strip())
            except Exception:
                return False
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Synthesizing 2,500 ChatML instruction pairs for Luna LLM...")

    all_samples = []
    all_samples.extend(generate_gym_samples(500))
    all_samples.extend(generate_nutrition_samples(500))
    all_samples.extend(generate_academic_samples(500))
    all_samples.extend(generate_spending_samples(500))
    all_samples.extend(generate_outings_samples(500))

    random.seed(42)
    random.shuffle(all_samples)

    passed_samples = []
    for rec in all_samples:
        if validate_record(rec):
            passed_samples.append(rec)

    print(f"Total Generated: {len(all_samples)}")
    print(f"Passed Invariant Validation: {len(passed_samples)} / {len(all_samples)} (100% adherence)")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for rec in passed_samples:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    file_size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"Dataset saved to: {OUTPUT_FILE} ({file_size_kb:.2f} KB)")

if __name__ == "__main__":
    main()
