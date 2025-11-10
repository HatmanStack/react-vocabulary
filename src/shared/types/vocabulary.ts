// Vocabulary Types

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  fillInBlank: string;
  examples?: string[];
  synonyms?: string[];
}

export interface VocabularyLevel {
  id: 'basic' | 'intermediate' | 'advanced' | 'expert' | 'professional';
  name: string;
  words: VocabularyWord[];
}

export interface VocabularyList {
  id: string; // 'list-a', 'list-b', etc.
  name: string;
  description?: string;
  levels: VocabularyLevel[];
}
