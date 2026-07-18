---
inclusion: manual
---

# Gemini Omni Prompt Guide — Video, Image & Audio Generation

When Raj asks for a Gemini Omni prompt, use this guide to structure it correctly. Gemini Omni (powered by Veo) is Google's "any-to-any world model" that accepts text, images, audio, and video as inputs and produces video/image output.

Sources: [Google DeepMind Prompt Guide](https://deepmind.google/models/gemini-omni/prompt-guide/), [Google Cloud Video Gen Prompt Guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)

---

## Core Principle

Unlike older video models, Gemini Omni doesn't need hyper-prescriptive frame-by-frame instructions. Tell it **what you want to create** — the model's reasoning and world knowledge fill in the details. Be specific about intent, not about every pixel.

You can combine text + reference image + audio file + existing video clip in a single prompt.

---

## Prompt Structure (6 Key Elements)

### 1. Subject (Who/What)

The focal point of the video. Be specific to avoid generic output.

| Type | Examples |
|------|----------|
| People | "a seasoned detective", "a joyful baker", "a futuristic astronaut" |
| Animals | "a playful Golden Retriever puppy", "a majestic bald eagle" |
| Objects | "a vintage typewriter", "a steaming cup of coffee" |
| Fantastical | "a miniature dragon with iridescent scales", "a wise ancient talking tree" |
| Combined | "A group of friends laughing around a campfire while a curious fox watches from the shadows" |

### 2. Action (What's Happening)

Verbs bring the subject to life — movements, interactions, expressions, transformations.

| Category | Examples |
|----------|----------|
| Basic movement | walking, running, flying, swimming, dancing, spinning |
| Interactions | talking, laughing, arguing, cooking, building, observing |
| Emotions | smiling, frowning, concentrating deeply, showing excitement |
| Subtle | breeze ruffling hair, leaves rustling, fingers tapping impatiently |
| Transformations | flower blooming in fast-motion, ice melting, city developing over time |

**Tip:** Sequence actions and emotional changes for storytelling — e.g., "eyes widen in alarm as a floorboard creaks off-screen"

### 3. Scene/Context (Where & When)

The environment that grounds the subject and establishes mood.

| Element | Examples |
|---------|----------|
| Interior | cozy living room with fireplace, sterile futuristic lab, cluttered artist studio |
| Exterior | sun-drenched tropical beach, misty ancient forest, bustling cityscape at night |
| Time of day | golden hour, midday sun, twilight, deep night, pre-dawn |
| Weather | clear blue sky, heavy thunderstorm, gentle snowfall, swirling fog |
| Period | medieval castle courtyard, 1920s jazz club, cyberpunk alleyway |
| Atmosphere | floating dust motes in a sunbeam, reflections on wet pavement |

### 4. Camera (Angle + Movement)

#### Angles

| Angle | Effect | Example prompt snippet |
|-------|--------|----------------------|
| Eye-level | Neutral, natural | "eye-level shot of a woman sipping tea" |
| Low-angle | Subject appears powerful | "low-angle tracking shot of a superhero landing" |
| High-angle | Subject appears small/vulnerable | "high-angle shot of a child lost in a crowd" |
| Bird's-eye | Map-like perspective | "bird's-eye view of a bustling city intersection" |
| Dutch angle | Unease, disorientation | "dutch angle shot of a character running down a hallway" |
| Close-up | Emotion emphasis | "close-up of a character's determined eyes" |
| Extreme close-up | Tiny detail | "extreme close-up of a drop of water landing on a leaf" |
| Medium shot | Waist up, conversational | "medium shot of two people conversing" |
| Wide/establishing | Full environment | "wide shot of a lone cabin in a snowy landscape" |
| Over-the-shoulder | Dialogue scenes | "over-the-shoulder shot during a tense negotiation" |
| POV | First person | "POV shot as someone rides a rollercoaster" |

#### Movements

| Movement | Description | Example prompt snippet |
|----------|-------------|----------------------|
| Static | No movement | "static shot of a serene landscape" |
| Pan (L/R) | Horizontal rotation from fixed position | "slow pan left across a city skyline at dusk" |
| Tilt (up/down) | Vertical rotation from fixed position | "tilt down from face to letter in hands" |
| Dolly (in/out) | Camera moves closer/further | "dolly out to emphasize isolation" |
| Truck (L/R) | Camera moves horizontally | "truck right, following character along sidewalk" |
| Zoom (in/out) | Lens focal length change | "slow zoom in on a mysterious artifact" |
| Crane | Vertical sweep or arc | "crane shot revealing a vast battlefield" |
| Aerial/drone | High altitude smooth movement | "sweeping aerial drone shot over a tropical island" |
| Handheld | Shaky, immediate feel | "handheld camera during a chaotic chase" |
| Whip pan | Ultra-fast pan (blur transition) | "whip pan from one character to another" |
| Arc | Circular path around subject | "arc shot around a couple embracing in rain" |

### 5. Lens & Optical Effects

| Effect | Use case | Example |
|--------|----------|---------|
| Wide-angle lens | Grand scale, exaggerated perspective | "wide-angle lens of a grand cathedral interior" |
| Telephoto lens | Subject isolation, compressed depth | "telephoto lens capturing a distant eagle" |
| Shallow depth of field | Blurred background (bokeh) | "portrait with shallow DOF, soft bokeh background" |
| Deep depth of field | Everything sharp | "landscape with deep DOF, sharp from foreground to mountains" |
| Lens flare | Dramatic cinematic feel | "cinematic lens flare as sun dips below horizon" |
| Rack focus | Shift focus between subjects | "rack focus from face in foreground to photo on wall behind" |
| Fisheye | Extreme distortion | "fisheye lens view from inside a car" |
| Vertigo effect (dolly zoom) | Disorientation | "vertigo effect on character at cliff edge" |

### 6. Visual Style & Aesthetics

#### Lighting

- Natural: "soft morning sunlight streaming through window", "moonlight"
- Artificial: "warm fireplace glow", "harsh fluorescent", "pulsating neon signs"
- Cinematic: "Rembrandt lighting", "film noir deep shadows", "high-key bright", "low-key mysterious"
- Effects: "volumetric light rays", "backlighting silhouette", "golden hour glow"

#### Tone/Mood

Happy, sad, suspenseful, peaceful, epic, futuristic, vintage, romantic, horror — state the feeling you want.

#### Artistic Style

- Photorealistic: "ultra-realistic rendering", "shot on 8K camera"
- Cinematic: "cinematic film look", "shot on 35mm film", "anamorphic widescreen"
- Animation: "Japanese anime", "Pixar-like 3D", "claymation", "stop-motion", "cel-shaded"
- Art movements: "Van Gogh style", "surrealist", "Art Deco", "Bauhaus"
- Specific looks: "gritty graphic novel", "watercolor coming to life", "charcoal sketch"

#### Color & Ambiance

- Palettes: "monochromatic B&W", "vibrant tropical", "muted earthy tones", "cool blue futuristic"
- Atmospheric: "thick fog", "swirling desert sands", "gentle snow", "heat haze", "glowing particles"
- Texture: "rough-hewn stone", "polished chrome", "velvety fabric", "dewdrops on spiderweb"

---

## Audio Direction (Veo 3+)

Use separate sentences to describe audio. Three categories:

| Type | Examples |
|------|----------|
| Sound effects | "the sound of a phone ringing", "water splashing", "ticking clock" |
| Ambient noise | "city traffic and distant sirens", "waves crashing", "quiet office hum" |
| Dialogue | "the man says: Where is the rabbit?", "voiceover with British accent" |

---

## Temporal Elements

| Effect | Example |
|--------|---------|
| Slow-motion | "slow-motion capture of water splash" |
| Time-lapse | "time-lapse of city skyline, day to night" |
| Evolution | "flower bud slowly unfurling" |
| Rhythm | "pulsating light in sync with beat" |

---

## Text Rendering

Gemini Omni can render text in video. Specify:
- The exact words
- Placement
- Animation style
- Timing/pacing

Example: "word by word, one word on screen at a time: did, you, know. Each word appears with a different animated style, perfect pacing to a rhythm"

---

## Negative Prompts

Don't use "no" or "don't" — instead describe what to exclude as a comma-separated list:

- **Wrong:** "don't show walls"
- **Right:** Add negative prompt: "wall, frame, urban background, dark stormy atmosphere"

---

## Multimodal Inputs

You can reference attachments in your prompt:

- `<image>` — reference an uploaded image
- `<video>` — reference an uploaded video clip
- `<audio>` — reference an uploaded audio file

Example: "The birds from <video> loosely form the shape of a bird based on <image>. They move to the music from <audio> and dissipate as they fly"

---

## Prompt Formula Template

```
[Camera angle] + [Camera movement] of [Subject] [Action] in [Scene/Context].
[Lens/optical effect]. [Lighting]. [Style/mood]. [Audio if needed].
```

### Example Prompts

**Cinematic portrait:**
"A hyper-realistic, cinematic portrait of a wise shaman. Their weathered skin has bioluminescent circuit-like tattoos pulsing with soft cyan light. Draped in robes woven from dark moss and metallic fiber-optic threads. In one hand, a gnarled staff topped with a floating crystalline artifact. On their shoulder, a small mechanical owl with holographic wings. Serene expression, deep knowing eyes."

**Action sequence:**
"A gloved hand carefully slices open an ancient leather-bound book with a scalpel. The hand delicately extracts a tiny metallic data chip hidden within the binding. The character's eyes widen in alarm as a floorboard creaks off-screen. They quickly palm the chip, head snapping up to scan the dimly lit room."

**Environment/mood:**
"A rain-slicked, crumbling street in a forgotten city, shrouded in perpetual twilight. Giant bioluminescent mushrooms sprouted from cracked asphalt, casting pulsating green and purple glow. Gentle constant rain creates shimmering reflections in puddles. Only sounds are soft patter of rain and a low otherworldly hum."

**Edit existing video:**
"Edit this keeping everything the same. Add animated motion effects coming out of the skateboard."

**With reference assets:**
"Show me in this story. Follow the story exactly in order starting top left. Entire story in 10 seconds. Cinematic."

---

## Key Tips

1. **Be intentional, not prescriptive** — describe what you want, let the model handle details
2. **Combine elements** — mix camera + style + lighting for unique results
3. **Use cinematic language** — the model understands film terminology natively
4. **Iterate conversationally** — you can edit output across multiple turns without starting over
5. **Specify audio separately** — use distinct sentences for sound direction
6. **Complex actions work** — reference "kickflip" or "ballet pirouette" and the model understands the full motion
7. **Text rendering** — specify exact words, timing, and animation style for on-screen text

---

## When Raj Asks for a Prompt

1. Ask what the video/image should show (subject + action)
2. Ask about mood/style preference (cinematic, anime, vintage, etc.)
3. Construct the prompt using the formula above
4. Include camera, lighting, and style elements appropriate to the request
5. Add audio direction if video with sound is needed
6. Format as a single cohesive paragraph (Omni works best with flowing descriptions)

## Agent Attribution

Created by **kiro**, July 15, 2026. Based on Google DeepMind and Google Cloud official documentation.
