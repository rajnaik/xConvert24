---
inclusion: manual
---

# Composite Pipelines — Chained Operations

These are multi-step sequences that run several steering processes in order. Stop immediately if any step fails.

---

## 🔄 "Full Maintenance"

When the user says **"Full Maintenance"** (or "FM"), run ALL of these in order:

1. **CHOP5** — Process 5 blogs from pipeline
2. **HACK5** — Process 5 convertors from pipeline
3. **xPolinate** — Cross-link all new content
4. **Prettify** — Beautify all new blog pages
5. **Metadesc** — Write meta descriptions for new pages

---

## ✨ "Polish"

When the user says **"Polish"**, run these content-quality steps:

1. **Prettify** — Beautify blog content
2. **xPolinate** — Cross-link blogs & converters
3. **Metadesc** — Write meta descriptions

---

## 📚 "Blog Burst"

When the user says **"Blog Burst"** (or "BB"), run the full blog creation pipeline:

1. **CHOP5** — Process 5 blogs from pipeline
2. **xPolinate** — Cross-link the new blogs
3. **Prettify** — Beautify the new blog pages
4. **Metadesc** — Add meta descriptions

---

## ⚙️ "Converter Burst"

When the user says **"Converter Burst"** (or "CB"), run the full converter creation pipeline:

1. **HACK5** — Process 5 convertors from pipeline
2. **xPolinate** — Cross-link new converters with blogs
3. **Metadesc** — Add meta descriptions for new converter pages

---

## 🚢 "Ship It"

When the user says **"Ship It"**, run the full release pipeline:

1. **Fire your engine** — Commit, build, test
2. **Half Throttle** — Deploy to staging + test
3. **Full Throttle** — Deploy to LIVE (only if staging passed)

---

## 🧹 "Spring Clean"

When the user says **"Spring Clean"**, run a comprehensive maintenance pass:

1. **CHOP10** — Process 10 blogs from pipeline
2. **HACK10** — Process 10 convertors from pipeline
3. **xPolinate** — Cross-link everything
4. **Prettify** — Beautify all blogs
5. **Metadesc** — Meta descriptions for all new pages
6. **Fire your engine** — Commit and test

---

## Notes

- The number after HACK/CHOP can be customized — these defaults use 5 or 10
- Each step delegates to its own sub-agent for parallel processing where possible
- If a step fails, report which step failed and stop (don't continue the chain)
- The user can also say "FM but skip Prettify" or "Blog Burst with CHOP10" for variations
