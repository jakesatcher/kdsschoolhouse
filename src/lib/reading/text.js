'use strict';

const wordCount = (s) => (String(s).match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
const paragraphs = (s) => String(s || '').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
const WORD_RE = /^[A-Za-z][A-Za-z'-]{1,29}$/;

// Splits text into {text, bold} runs so the vocabulary word (and simple endings like -s, -ed, -ing, -ly) can be bolded
// without ever emitting user text as HTML: the template escapes every run.
function segments(text, word) {
  if (!word || !WORD_RE.test(word)) return [{ text, bold: false }];
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${esc}(?:s|es|ed|d|ing|ly|er|est)?\\b`, 'gi');
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[0], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out.length ? out : [{ text, bold: false }];
}
const containsWord = (text, word) => segments(text, word).some((s) => s.bold);

// Cut a passage back to at most `max` words, ending on a sentence boundary when possible.
function trimToWords(text, max) {
  if (wordCount(text) <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+["”’']*\s*/g) || [text];
  let out = '';
  for (const s of sentences) {
    if (wordCount(out + s) > max) break;
    out += s;
  }
  return (out || text.split(/\s+/).slice(0, max).join(' ')).trim();
}

module.exports = { wordCount, paragraphs, segments, containsWord, trimToWords, WORD_RE };
