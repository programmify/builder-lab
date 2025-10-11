export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: 'free' | 'paid' | 'freemium';
  popularity?: number;
  link: string;
  tutorial?: string;
  exampleProjectLink?: string;
  logo?: string;
}

export type Category = 
  | 'All'
  | 'AI & LLM APIs'
  | 'Analytics & Tracking'
  | 'Articles & Research'
  | 'Automation'
  | 'Backend & Databases'
  | 'Communication & Email'
  | 'Design, Video & Demo Creation'
  | 'Developer Tools'
  | 'Frontend Frameworks'
  | 'Frontend Tools'
  | 'Hosting'
  | 'Launch & Community Platforms'
  | 'Learning Resources'
  | 'Mobile App Builders'
  | 'Payments & Monetization'
  | 'Project Management & Productivity'
  | 'Security & Privacy'
  | 'Vibe Coding Tools'
  | 'Other Utilities';
