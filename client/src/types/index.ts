export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
}

export type Subject = '数学' | '物理' | '化学' | '生物' | '地理' | '英语' | '政治' | '历史';

export const SUBJECTS: Subject[] = ['数学', '物理', '化学', '生物', '地理', '英语', '政治', '历史'];

export interface AnalysisResult {
  subject: Subject;
  originalText: string;
  knowledgePoints: string[];
  examPoints: string[];
  answer: string;
  solution: string;
  hasGraph: boolean;
}

export interface GeneratedQuestion {
  type: 'similar' | 'variant' | 'comprehensive';
  typeLabel: string;
  stem: string;
  options?: string[];
  figure?: string; // SVG string or data URL
  answerArea: number; // number of answer lines
}

export interface HomeworkData {
  subject: Subject;
  originalQuestion: string;
  similar: GeneratedQuestion[];
  variant: GeneratedQuestion[];
  comprehensive: GeneratedQuestion[];
  generatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type LoadingState = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'rendering';
