'use strict';

const SKILLS = [
  { id: 'comprehension', name: 'Comprehension', blurb: 'Read a passage, then answer literal and inferential questions.' },
  { id: 'vocabulary', name: 'Vocabulary', blurb: 'A grade-level word in a short passage (the word is bolded), with questions.' },
  { id: 'context-clues', name: 'Context Clues', blurb: 'Use the words around an unfamiliar word (a definition, synonym, opposite, example or other hint) to figure out what it means.' },
  { id: 'inferences', name: 'Inferences', blurb: 'Use clues from the text and what you know to figure out what is not stated.' },
  { id: 'main-idea', name: 'Main Idea', blurb: 'Find the main idea and the details that support it.' },
  { id: 'cause-effect', name: 'Cause & Effect', blurb: 'What happened, and why did it happen?' },
  { id: 'problem-solution', name: 'Problem & Solution', blurb: 'Identify the problem and how it was solved.' },
  { id: 'authors-purpose', name: "Author's Purpose", blurb: 'Why did the author write this: to persuade, inform or entertain?' },
];
const byId = (id) => SKILLS.find((s) => s.id === id) || null;

const LENGTHS = {
  short: { max: 75, target: '55 to 75', label: 'Short (up to 75 words)', questions: 4 },
  medium: { max: 150, target: '110 to 150', label: 'Medium (up to 150 words)', questions: 5 },
  long: { max: 250, target: '190 to 250', label: 'Long (up to 250 words)', questions: 6 },
};
const VOCAB_MAX_WORDS = 50;

const GRADE_GUIDE = {
  1: 'Grade 1: very simple sentences of 4 to 8 words; mostly high-frequency and decodable words; one idea per sentence; no figurative language; concrete, familiar topics.',
  2: 'Grade 2: short sentences of 6 to 10 words with a few compound sentences; common vocabulary with one or two new words that context explains; simple sequence or cause and effect.',
  3: 'Grade 3: sentences of 8 to 14 words; grade-appropriate vocabulary with context clues; short paragraphs; some dialogue or text features.',
  4: 'Grade 4: varied sentences of 10 to 18 words; some academic vocabulary; descriptive detail; ideas that need inference.',
  5: 'Grade 5: sentences up to 20 words; richer vocabulary and some figurative language; multiple ideas that can require synthesis.',
};

const VOCAB_WORDS = {
  1: ['brave', 'gentle', 'giant', 'quiet', 'shiny', 'tiny', 'cozy', 'grumpy', 'share', 'proud', 'careful', 'clever', 'noisy', 'hurry', 'whisper', 'huge', 'sleepy', 'helpful'],
  2: ['enormous', 'delighted', 'nervous', 'peaceful', 'gather', 'wander', 'discover', 'polite', 'treasure', 'journey', 'puzzle', 'shelter', 'curious', 'mighty', 'scatter', 'fragile', 'glance', 'tremble'],
  3: ['ancient', 'cautious', 'familiar', 'generous', 'hesitate', 'inspect', 'migrate', 'observe', 'rustle', 'abandon', 'anxious', 'boast', 'glimmer', 'reluctant', 'sturdy', 'swift', 'vast', 'protect'],
  4: ['accomplish', 'adapt', 'barren', 'collaborate', 'conserve', 'determined', 'distribute', 'endure', 'exhausted', 'hazardous', 'incredible', 'indicate', 'bewildered', 'resourceful', 'scarce', 'shrewd', 'urgent', 'vivid'],
  5: ['abundant', 'ambitious', 'analyze', 'benefit', 'contemplate', 'desperate', 'diminish', 'elaborate', 'essential', 'hinder', 'innovative', 'interpret', 'perilous', 'persevere', 'sufficient', 'tolerate', 'unanimous', 'vulnerable'],
};

// What each reading skill asks the writer for.
const SKILL_BRIEF = {
  comprehension: {
    passage: 'Write an engaging passage with clear details a student can find in the text and some ideas that must be figured out.',
    questions: 'Write a mix of about half literal questions (answer is stated in the text) and half inferential questions (answer must be figured out from clues). Label each with type "literal" or "inferential". Order them so literal questions come first.',
  },
  vocabulary: {
    passage: 'Write a short passage that uses the vocabulary word naturally in two or three places, with context clues that help a child work out its meaning. Use the exact word form (you may also use simple endings like -s, -ed, -ing).',
    questions: 'Write questions that include: the meaning of the word in context, a synonym or antonym or word-form question, completing or writing a sentence with the word, and at least one question about the passage itself. Label each "vocabulary" or "comprehension".',
  },
  'context-clues': {
    passage: 'Write a passage that includes 2 or 3 words a student at this grade is likely meeting for the first time (everyday school-appropriate words, not technical terms or names). Each target word must have a clear context clue in the same sentence or the sentence next to it. Do not define every word the same way; vary the clue types. The clue must really be in the passage, so a reader can work out the meaning without a dictionary. List the target words, exactly as they appear in the passage, in "words".',
    questions: 'Name one target word in quotation marks in each question. Include: what the word means as used in the passage; which words or phrase in the passage are the clue; what kind of clue it is (definition or restatement, synonym, antonym or contrast, example, or general sense of the sentence); and, for grades 3 to 5, a question that gives three possible meanings to choose from (a, b, c) or asks the student to use the word in a new sentence. Each answer must quote the clue from the passage. Label each "meaning" or "clue".',
  },
  inferences: {
    passage: 'Write a passage whose key facts (feelings, setting, reasons, what happens next) are NOT stated outright but are strongly hinted by clues.',
    questions: 'Every question must require an inference. Each answer must name the clue from the text plus the conclusion (for example "Clue: ... so ..."). Label each "inferential".',
  },
  'main-idea': {
    passage: 'Write a passage with one clear main idea supported by two or three details. Do not state the main idea in a single obvious sentence for grades 4 and 5.',
    questions: 'Write questions about the main idea, key supporting details, and a best title; for grades 3 to 5 include a question about which detail does not support the main idea. Label each "main idea" or "detail".',
  },
  'cause-effect': {
    passage: 'Write a passage with two or three clear cause-and-effect relationships. Use signal words suited to the grade (because, so, since, as a result, if ... then).',
    questions: 'Write questions asking what happened (effect), why it happened (cause), and, for grades 3 to 5, how one effect became the cause of the next. Label each "cause" or "effect".',
  },
  'problem-solution': {
    passage: 'Write a passage where a character or group has a clear problem and finds a solution, with at least one step or attempt along the way.',
    questions: 'Write questions asking for the problem, the solution, the steps taken, and for grades 3 to 5 another possible solution or what might happen next. Label each "problem" or "solution".',
  },
  'authors-purpose': {
    passage: 'Write a passage whose purpose is clear from its words and structure. Persuasion should use opinion and convincing reasons; informing should use facts; entertaining should tell a story or use humor.',
    questions: 'Write questions asking why the author wrote the passage (persuade, inform or entertain), which words or details show that purpose, and how the passage would change if the purpose were different. Label each "purpose" or "evidence".',
  },
};

const CLUE_TYPES = {
  any: 'any mix of clue types',
  definition: 'definition or restatement clues (the passage tells or explains what the word means, often after a comma, "or", "is" or "which means")',
  synonym: 'synonym clues (a word with nearly the same meaning appears nearby)',
  antonym: 'antonym or contrast clues (an opposite appears nearby, with signals such as "but", "unlike" or "instead")',
  example: 'example clues (examples or a list that show what the word means, with signals such as "such as" or "like")',
  inference: 'general context clues (the whole sentence or the sentences around it show the meaning)',
};
const CLUE_GRADE = {
  1: 'Grade 1 clue writing: only very simple clues in the same sentence, such as a short restatement ("a puppy, a baby dog") or a clear opposite. Target words must still be simple.',
  2: 'Grade 2 clue writing: simple same-sentence clues (restatement, a nearby synonym, or a clear opposite).',
  3: 'Grade 3 clue writing: definition, synonym, antonym and example clues, in the same or the next sentence.',
  4: 'Grade 4 clue writing: all clue types, including clues that are spread across two sentences.',
  5: 'Grade 5 clue writing: all clue types, including general-sense clues and words with more than one meaning used in a less common way.',
};

module.exports = { CLUE_TYPES, CLUE_GRADE, SKILLS, byId, LENGTHS, VOCAB_MAX_WORDS, GRADE_GUIDE, VOCAB_WORDS, SKILL_BRIEF };
