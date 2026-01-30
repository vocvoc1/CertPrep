import { NormalizedQuestion, Option, RawQuestion, Vote, Comment } from './types';

// ---------------------------------------------------------------------------
// 3. Parsing & Logic Functions
// ---------------------------------------------------------------------------

/**
 * stripHtml: Removes HTML tags and replaces <br> with newlines.
 * Uses DOMParser for reliable browser-native parsing.
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  // Replace <br> variations with newline placeholders
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  
  // Use DOMParser to strip tags and decode entities
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  text = doc.body.textContent || '';
  
  return text.trim();
};

/**
 * parseOptions: Normalizes HTML options into key/text pairs.
 * Assumes format "A. content" or similar.
 */
export const parseOptions = (options: string[]): Option[] => {
  return options.map((optHtml) => {
    const cleanText = stripHtml(optHtml);
    // Extract leading letter (e.g., "A. ")
    // Regex looks for: Start of line, Optional whitespace, One char (A-Z), Optional dot/paren, Whitespace
    const match = cleanText.match(/^\s*([A-Z])[\.\)\s]\s*(.*)/s);
    
    if (match) {
      return {
        key: match[1],
        text: match[2].trim(),
      };
    }
    
    // Fallback if no letter found (should be rare based on input spec)
    // We try to infer from index if absolute necessary, but spec implies letter is in text.
    // Here we just return the text and assume the index corresponds to A, B, C...
    return {
      key: '?', // Placeholder, logic in normalization will fix this if needed via index
      text: cleanText,
    };
  });
};

/**
 * parseCorrectAnswers: Converts string "AB" into array ["A", "B"]
 */
export const parseCorrectAnswers = (answerStr: string): string[] => {
  if (!answerStr) return [];
  // Split, trim, remove empty, ensure uppercase
  return answerStr.toUpperCase().split('').filter(c => /[A-Z]/.test(c)).sort();
};

/**
 * buildExplanation: Constructs the explanation string based on priority rules.
 */
export const buildExplanation = (
  description: string | undefined, 
  comments: Comment[] | undefined, 
  votes: Vote[] | undefined
): string => {
  let explanation = '';

  // 1. Answer Description
  if (description && stripHtml(description).length > 0) {
    explanation += `**Official Explanation:**\n${stripHtml(description)}\n\n`;
  }

  // 2. Top Comments (if no description or supplementary)
  // Logic: The prompt says "Else, if comments exist". 
  // Often users want both, but strict prompt says "1. If desc... 2. Else...".
  // However, usually "Else" implies exclusivity. I will follow strict priority:
  // If description exists, we stop? Or do we append? 
  // "Explanation priority: 1. If desc not empty -> show it. 2. Else if comments..."
  // This implies mutually exclusive.
  
  const hasDesc = description && stripHtml(description).length > 0;
  
  if (!hasDesc && comments && comments.length > 0) {
    // Sort by voteCount descending
    const sortedComments = [...comments].sort((a, b) => b.voteCount - a.voteCount).slice(0, 3);
    if (sortedComments.length > 0) {
      explanation += `**Community Insights:**\n`;
      sortedComments.forEach(c => {
        explanation += `• "${stripHtml(c.content)}" (${c.voteCount} votes)\n`;
      });
      explanation += `\n`;
    }
  }

  // 3. Most Voted Answer
  if (votes) {
    const mostVoted = votes.find(v => v.isMostVoted);
    if (mostVoted) {
      explanation += `**Most Voted Answer:** ${mostVoted.answer} (${mostVoted.count} votes)`;
    }
  }

  return explanation.trim();
};

/**
 * normalizeQuestions: Main pipeline to process raw JSON into app state.
 */
export const normalizeQuestions = (rawData: RawQuestion[]): NormalizedQuestion[] => {
  return rawData.map((raw, idx) => {
    const options = parseOptions(raw.options || []);
    
    // Fix option keys if regex failed (fallback to A, B, C based on index)
    const fixedOptions = options.map((opt, i) => {
      if (opt.key === '?') {
        return { ...opt, key: String.fromCharCode(65 + i) }; // 65 is 'A'
      }
      return opt;
    });

    const correctAnswers = parseCorrectAnswers(raw.answer);
    
    return {
      id: `q-${Date.now()}-${idx}`,
      topic: raw.topic || 'General',
      index: String(raw.index || idx + 1),
      body: stripHtml(raw.body),
      correctAnswers,
      options: fixedOptions,
      type: correctAnswers.length > 1 ? 'MULTI' : 'SINGLE',
      explanation: buildExplanation(raw.answerDescription, raw.comments, raw.votes),
    };
  });
};

/**
 * isAnswerCorrect: Checks exact match of user selection vs correct answers.
 */
export const isAnswerCorrect = (userSelection: string[], correctAnswers: string[]): boolean => {
  if (userSelection.length !== correctAnswers.length) return false;
  const sortedUser = [...userSelection].sort();
  const sortedCorrect = [...correctAnswers].sort();
  return sortedUser.every((val, index) => val === sortedCorrect[index]);
};
