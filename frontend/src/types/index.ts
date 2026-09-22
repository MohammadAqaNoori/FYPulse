// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface User {
  id: number
  full_name: string
  email: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface UserRegisterPayload {
  full_name: string
  email: string
  password: string
}

export interface UserLoginPayload {
  email: string
  password: string
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced'
export type ProjectType =
  | 'web'
  | 'mobile'
  | 'ai'
  | 'iot'
  | 'desktop'
  | 'data_science'
  | 'cybersecurity'
  | 'other'

export interface Profile {
  id: number
  user_id: number
  degree: string | null
  university: string | null
  year_of_study: number | null
  skills: string[]
  interests: string[]
  technologies: string[]
  knowledge_level: KnowledgeLevel | null
  preferred_project_type: ProjectType | null
  preferred_team_size: number | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface ProfilePayload {
  degree?: string
  university?: string
  year_of_study?: number
  skills?: string[]
  interests?: string[]
  technologies?: string[]
  knowledge_level?: KnowledgeLevel
  preferred_project_type?: ProjectType
  preferred_team_size?: number
  bio?: string
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface Project {
  id: number
  title: string
  description: string | null
  source_url: string | null
  source_type: string | null
  technologies: string[]
  domains: string[]
  difficulty_level: DifficultyLevel | null
  popularity_score: number
  similarity_count: number
  created_at: string
}

export interface ProjectSearchParams {
  query?: string
  technologies?: string[]
  domains?: string[]
  difficulty_level?: DifficultyLevel
  page?: number
  page_size?: number
}

export interface PaginatedProjects {
  total: number
  page: number
  page_size: number
  projects: Project[]
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export interface MatchBreakdown {
  skills_match: number
  interest_match: number
  technology_match: number
  difficulty_match: number
  [key: string]: number
}

export interface Recommendation {
  id: number
  match_score: number
  match_breakdown: MatchBreakdown | null
  project: Project
  created_at: string
}

export interface RecommendationListResponse {
  total: number
  recommendations: Recommendation[]
}

export interface SimilarityCheckPayload {
  title: string
  description?: string
}

export interface SimilarityResult {
  is_overused: boolean
  similarity_count: number
  similar_projects: Project[]
  suggestion: string
}

// ─── Idea Generator ───────────────────────────────────────────────────────────

export interface GeneratedIdea {
  title: string
  description: string
  suggested_tech_stack: string[]
  domains: string[]
  novelty_score: number
  rationale: string
}

export interface GenerateIdeasPayload {
  count: number
  extra_skills?: string[]
  extra_interests?: string[]
}

export interface GenerateIdeasResponse {
  user_id: number
  count: number
  ideas: GeneratedIdea[]
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
}
