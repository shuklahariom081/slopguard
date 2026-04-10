"""
detectors.py — SlopGuard Core Detection Engine
================================================
Multi-modal AI slop detection across text, code, and images.
Each detector returns a rich result dict with score, verdict,
confidence, and per-feature breakdown for UI display.
"""

from __future__ import annotations

import math
import re
import statistics
from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image
from transformers import pipeline

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> int:
    return int(max(lo, min(hi, value)))


def _confidence_label(score: int) -> str:
    if score >= 80:
        return "Very High"
    if score >= 60:
        return "High"
    if score >= 40:
        return "Moderate"
    if score >= 20:
        return "Low"
    return "Very Low"


# ---------------------------------------------------------------------------
# TEXT DETECTOR
# ---------------------------------------------------------------------------

# Phrases that are disproportionately common in AI-generated text
_AI_BUZZWORDS = re.compile(
    r"\b(delve|delves|delving|tapestry|nuanced?|multifaceted|"
    r"in the realm of|it(?:'s| is) worth noting|"
    r"it(?:'s| is) important to (note|remember|understand)|"
    r"in conclusion|to summarize|as (?:an|a) (language model|ai|assistant)|"
    r"certainly[,!]?|absolutely[,!]?|of course[,!]?|"
    r"i(?:'d| would) be happy to|feel free to|"
    r"leverag(?:e|ing|ed)|robust|seamless|comprehensive|"
    r"revolutioniz(?:e|ing)|game.?chang(?:er|ing)|cutting.?edge|"
    r"synerg(?:y|ies|istic)|paradigm|holistic|actionable|"
    r"at the end of the day|rest assured|hope this helps)\b",
    re.IGNORECASE,
)

# Sentence-starter patterns typical in AI prose
_AI_STARTERS = re.compile(
    r"(?:^|\.\s+)(Certainly|Sure|Of course|Absolutely|Great question|"
    r"I(?:'d| would) be happy|As (?:an|a) (?:language model|AI)|"
    r"In conclusion|To summarize|First(?:ly)?[,:]|Additionally[,:]|"
    r"Moreover[,:]|Furthermore[,:]|In summary)",
    re.IGNORECASE | re.MULTILINE,
)


def _lexical_richness(words: list[str]) -> float:
    """Type-Token Ratio (TTR) on lowercase tokens; 1.0 = maximally varied."""
    if not words:
        return 0.0
    return len({w.lower() for w in words}) / len(words)


def _avg_sentence_length(text: str) -> float:
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 0.0
    lengths = [len(s.split()) for s in sentences]
    return statistics.mean(lengths)


def _sentence_length_variance(text: str) -> float:
    """Low variance → robotic cadence; high variance → human writing."""
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if len(sentences) < 3:
        return 100.0  # not enough data — neutral
    lengths = [len(s.split()) for s in sentences]
    return statistics.stdev(lengths)


def _punctuation_density(text: str) -> float:
    if not text:
        return 0.0
    punct = sum(1 for c in text if c in "!?;:—…")
    return punct / len(text) * 1000  # per 1 000 chars


def detect_text_slop(text: str) -> dict[str, Any]:
    """
    Analyse text for AI-generation signals.

    Features
    --------
    - Lexical richness (TTR)
    - AI buzzword density
    - AI sentence-starter count
    - Sentence-length variance (human writers vary more)
    - Average sentence length (AI tends to be uniform)
    - Punctuation expressiveness
    """
    if not text or not text.strip():
        return {
            "slop_score": 95,
            "verdict": "🚨 Empty / Whitespace",
            "confidence": "Very High",
            "features": {"note": "No content to analyse."},
        }

    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)

    # --- individual signals ---
    ttr = _lexical_richness(words)
    buzzword_hits = len(_AI_BUZZWORDS.findall(text))
    starter_hits = len(_AI_STARTERS.findall(text))
    sl_variance = _sentence_length_variance(text)
    avg_sl = _avg_sentence_length(text)
    punct_density = _punctuation_density(text)

    # Scale buzzword density relative to word count
    buzz_density = min(buzzword_hits / max(word_count / 100, 1), 5.0)  # 0-5 scale
    starter_density = min(starter_hits / max(word_count / 200, 1), 5.0)

    # --- scoring (0 = human, higher = more slop) ---
    score = 0.0

    # Low vocabulary variety → more AI-like
    score += (1.0 - ttr) * 25          # 0–25 pts

    # Buzzwords are a strong signal
    score += buzz_density * 10         # 0–50 pts

    # AI transition starters
    score += starter_density * 8       # 0–40 pts

    # Very uniform sentence lengths suggest AI
    if word_count >= 30:
        # Variance below 5 words → robotic; above 15 → human
        variance_penalty = max(0, 10 - sl_variance) * 1.5
        score += variance_penalty      # 0–15 pts

    # Very low expressive punctuation
    if punct_density < 1.0 and word_count > 50:
        score += 5

    # Excessively long or very short avg sentence
    if avg_sl > 28 or (avg_sl < 6 and word_count > 30):
        score += 5

    score = _clamp(score)

    verdict = (
        "🚨 High AI Slop" if score >= 65
        else "⚠️ Possibly AI-Generated" if score >= 40
        else "✅ Likely Human-Written"
    )

    features = {
        "Vocabulary Richness (TTR)": f"{ttr:.2f} (higher = more varied)",
        "AI Buzzwords Found": buzzword_hits,
        "AI Sentence Starters": starter_hits,
        "Sentence Length Variance": f"{sl_variance:.1f} words (higher = more human)",
        "Avg Sentence Length": f"{avg_sl:.1f} words",
        "Expressive Punctuation Density": f"{punct_density:.2f} per 1k chars",
    }

    return {
        "slop_score": score,
        "verdict": verdict,
        "confidence": _confidence_label(score),
        "features": features,
    }


# ---------------------------------------------------------------------------
# CODE DETECTOR
# ---------------------------------------------------------------------------

# Phrases that often appear in AI-generated code comments / docstrings
_CODE_AI_PROSE = re.compile(
    r"(?i)(here is (?:the|an?|your)|as (?:an|a) (?:language model|ai|assistant)|"
    r"this (?:function|method|class|code|script) (?:will|takes|returns|provides|handles)|"
    r"the following (?:code|function|example|implementation)|"
    r"simple (?:example|implementation|function|class)|"
    r"(?:above|below) (?:code|function|example)|"
    r"feel free to|hope this helps|let me know)",
)

# Generic, over-descriptive docstring patterns
_GENERIC_DOCSTRING = re.compile(
    r'""".*?(?:initializes|constructs|creates|represents|returns)\s+(?:a|an|the)\s+\w+.*?"""',
    re.DOTALL | re.IGNORECASE,
)

# Patterns suggesting over-engineered boilerplate
_BOILERPLATE = re.compile(
    r"(?i)(TODO:.*?implement|pass\s*#.*?(implement|todo|fill|placeholder)|"
    r"raise NotImplementedError|# example usage|# --- .{3,40} ---)",
)

# Meaningful inline comments (not separators or section headers)
_INLINE_COMMENT = re.compile(r"#\s+\w{3,}")

# Overly long identifiers (AI loves descriptive names to excess)
_LONG_IDENT = re.compile(r"\b[a-z_][a-z_0-9]{29,}\b")

# Magic numbers without constants
_MAGIC_NUMBER = re.compile(r"(?<!\w)(?<!\.)(\d{2,}(?:\.\d+)?)(?!\w)(?!\s*[,\]])")


def _comment_ratio(lines: list[str]) -> float:
    if not lines:
        return 0.0
    comment_lines = sum(
        1 for ln in lines
        if ln.strip().startswith("#")
        or '"""' in ln
        or "'''" in ln
    )
    return comment_lines / len(lines)


def _blank_line_ratio(lines: list[str]) -> float:
    if not lines:
        return 0.0
    return sum(1 for ln in lines if not ln.strip()) / len(lines)


def _avg_line_length(lines: list[str]) -> float:
    code_lines = [ln for ln in lines if ln.strip() and not ln.strip().startswith("#")]
    if not code_lines:
        return 0.0
    return statistics.mean(len(ln) for ln in code_lines)


def detect_code_slop(code: str) -> dict[str, Any]:
    """
    Analyse source code for AI-generation signals.

    Features
    --------
    - Comment / docstring density
    - Blank-line ratio (AI often adds too many)
    - AI prose in comments
    - Generic docstring patterns
    - Boilerplate / placeholder patterns
    - Over-long identifier names
    - Inline-comment density (AI over-explains trivial lines)
    """
    if not code or not code.strip():
        return {
            "slop_score": 95,
            "verdict": "🚨 Empty / No Code",
            "confidence": "Very High",
            "features": {"note": "No code to analyse."},
        }

    lines = code.splitlines()
    total_lines = len(lines)

    comment_ratio = _comment_ratio(lines)
    blank_ratio = _blank_line_ratio(lines)
    ai_prose_hits = len(_CODE_AI_PROSE.findall(code))
    generic_docs = len(_GENERIC_DOCSTRING.findall(code))
    boilerplate_hits = len(_BOILERPLATE.findall(code))
    long_idents = len(_LONG_IDENT.findall(code))
    inline_comments = len(_INLINE_COMMENT.findall(code))
    inline_comment_ratio = inline_comments / max(total_lines, 1)

    score = 0.0

    # Heavy commenting is the strongest AI signal
    if comment_ratio > 0.40:
        score += (comment_ratio - 0.40) * 120   # steep penalty above 40 %
    elif comment_ratio > 0.25:
        score += (comment_ratio - 0.25) * 60

    # Excessive blank lines (over-formatted)
    if blank_ratio > 0.30:
        score += (blank_ratio - 0.30) * 40

    # Inline comment over-saturation (AI explains every line)
    if inline_comment_ratio > 0.35:
        score += (inline_comment_ratio - 0.35) * 50

    # Prose phrases in comments
    score += ai_prose_hits * 18

    # Generic / template docstrings
    score += generic_docs * 15

    # Boilerplate / TODO stubs
    score += boilerplate_hits * 20

    # Over-descriptive names
    score += long_idents * 10

    score = _clamp(score)

    verdict = (
        "🚨 High Code Slop" if score >= 65
        else "⚠️ Possibly AI-Generated" if score >= 40
        else "✅ Likely Human-Written"
    )

    features = {
        "Comment Line Ratio": f"{comment_ratio:.1%}",
        "Blank Line Ratio": f"{blank_ratio:.1%}",
        "Inline Comment Density": f"{inline_comment_ratio:.1%}",
        "AI Prose in Comments": ai_prose_hits,
        "Generic Docstrings": generic_docs,
        "Boilerplate / Stub Patterns": boilerplate_hits,
        "Over-Long Identifiers (≥30 chars)": long_idents,
    }

    return {
        "slop_score": score,
        "verdict": verdict,
        "confidence": _confidence_label(score),
        "features": features,
    }


# ---------------------------------------------------------------------------
# IMAGE DETECTOR
# ---------------------------------------------------------------------------

_IMAGE_MODEL_ID = "dima806/ai_vs_real_image_detection"

# Lazy-loaded pipeline (avoids slow startup if image tab never used)
_image_pipe: Any = None


def _get_image_pipe():
    global _image_pipe
    if _image_pipe is None:
        _image_pipe = pipeline(
            "image-classification",
            model=_IMAGE_MODEL_ID,
            device=-1,  # CPU; set to 0 for CUDA
        )
    return _image_pipe


def _analyse_image_statistics(img: Image.Image) -> dict[str, Any]:
    """
    Lightweight pixel-level heuristics to supplement model score.

    AI images often have:
    - Very smooth colour gradients (low edge noise)
    - Extreme sharpness in some regions, blurry in others
    - Unusual colour saturation
    """
    import numpy as np

    rgb = img.convert("RGB")
    arr = np.array(rgb, dtype=np.float32)

    # Saturation proxy: std-dev of colour channels
    channel_std = arr.std(axis=(0, 1)).mean()

    # Local contrast (Laplacian variance) — blurry images score lower
    gray = np.array(img.convert("L"), dtype=np.float32)
    laplacian = (
        gray[:-2, 1:-1] + gray[2:, 1:-1] + gray[1:-1, :-2] + gray[1:-1, 2:]
        - 4 * gray[1:-1, 1:-1]
    )
    focus_score = float(np.var(laplacian))

    return {
        "channel_std": float(channel_std),
        "focus_score": focus_score,
    }


def detect_image_slop(image_path: str | Path) -> dict[str, Any]:
    """
    Classify an image as AI-generated or real using a fine-tuned ViT model,
    optionally supplemented by pixel-level statistics.
    """
    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as exc:
        return {
            "slop_score": 0,
            "verdict": f"❌ Cannot open image: {exc}",
            "confidence": "N/A",
            "features": {},
        }

    try:
        pipe = _get_image_pipe()
        results = pipe(img)

        # Build label → score map
        label_map = {r["label"].lower(): r["score"] for r in results}

        # Try to find the AI class (label names vary by model checkpoint)
        ai_score = 0.0
        for key in label_map:
            if "ai" in key or "fake" in key or "artificial" in key or "generated" in key:
                ai_score = label_map[key]
                break
        else:
            # Fallback: take the highest score as the "AI" confidence
            ai_score = max(label_map.values())

        model_score = ai_score * 100

        # Pixel heuristics — very soft adjustment (±5 pts max)
        stats = _analyse_image_statistics(img)
        heuristic_adj = 0.0
        # Suspiciously uniform focus (neither very sharp nor very blurry) → +2
        if 200 < stats["focus_score"] < 2000:
            heuristic_adj += 2.0
        # Unusually low channel variation → synthetic-looking palette → +3
        if stats["channel_std"] < 40:
            heuristic_adj += 3.0

        final_score = _clamp(model_score + heuristic_adj)

        verdict = (
            "🚨 AI-Generated Image" if final_score >= 65
            else "⚠️ Possibly AI-Generated" if final_score >= 45
            else "✅ Likely Real / Human-Made"
        )

        # Expose all label probabilities for display
        label_features = {
            k.title(): f"{v*100:.1f}%" for k, v in sorted(label_map.items(), key=lambda x: -x[1])
        }
        label_features["Focus Score"] = f"{stats['focus_score']:.0f}"
        label_features["Colour Variance"] = f"{stats['channel_std']:.1f}"

        return {
            "slop_score": final_score,
            "verdict": verdict,
            "confidence": _confidence_label(final_score),
            "features": label_features,
        }

    except Exception as exc:
        return {
            "slop_score": 0,
            "verdict": f"❌ Detection failed: {exc}",
            "confidence": "N/A",
            "features": {},
        }
