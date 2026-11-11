---
description: Explain code or architecture with visual diagrams, mental models, gotchas, and safe modification guides
argument-hint: "[file, function, pattern, module, or concept]"
---

Explain: $ARGUMENTS

## Format

### 1. One-Sentence Summary
State what the code or concept does and why it exists in the architecture. Keep it strictly to one punchy sentence.

### 2. Mental Model & Metaphor
Provide a concrete analogy or mental model that captures the core concept. Relate it to a familiar real-world or software pattern.

### 3. Visual Architecture / Data Flow Diagram
Draw an ASCII flow diagram showing data flow, component interactions, and boundaries:
```
Actor / Request
      ↓
[ Controller / Route ] ──(DTO validation / Auth)──→ [ Service ]
                                                        ↓
                                              [ Repository / Token ]
                                                        ↓
                                              [ Database / Store ]
```

### 4. Key Architectural Decisions & Gotchas
Walk through non-obvious engineering decisions:
- Why was this pattern chosen over alternatives?
- Edge cases, error paths, and failure modes.
- Performance implications (caching, query volume, re-renders).
- Security boundaries (auth, validation, sanitization).

### 5. How to Safely Modify It
What does an engineer need to know before touching this code?
- Where are the hidden landmines?
- What downstream modules or consumers depend on this contract?
- What tests must be run to verify changes?
