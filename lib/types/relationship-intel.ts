// Relationship Intel Data Types

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  keywords: string[];
  tags: string[];
  contactCount: number;
}

export interface Contact {
  email: string;
  name: string;
  company?: string;
  title?: string;
  tags: string[];
  keywords: string[];
  notes: string;
  lastContact: Date;
  firstContact: Date;
  interactionCount: number;
}

export interface Interaction {
  id: string;
  type: "email" | "event" | "note";
  date: Date;
  subject: string;
  summary: string;
  content?: string;
}

export interface ProjectMetadata {
  name: string;
  createdAt: Date;
  updatedAt: Date;
  keywords: string[];
  tags: string[];
}

export type SortBy = "name" | "lastContact" | "interactionCount";
export type SortOrder = "asc" | "desc";
