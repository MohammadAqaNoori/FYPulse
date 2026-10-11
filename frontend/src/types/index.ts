// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserResponse {
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
  user: UserResponse
}

// ── Profile ───────────────────────────────────────────────────────────────────

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

export interface ProfileResponse {
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

export interface ProfileCreate {
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

// ── Project ───────────────────────────────────────────────────────────────────

export interface ProjectResponse {
  id: number
  title: string
  description: string | null
  source_url: string | null
  source_type: string | null
  technologies: string[]
  domains: string[]
  difficulty_level: string | null
  popularity_score: number
  similarity_count: number
  created_at: string
}

export interface ProjectListResponse {
  total: number
  page: number
  page_size: number
  projects: ProjectResponse[]
}

// ── Recommendations ───────────────────────────────────────────────────────────

export interface MatchBreakdown {
  skills?: number
  interests?: number
  technologies?: number
  knowledge_level?: number
  [key: string]: number | undefined
}

export interface RecommendationItem {
  project: ProjectResponse
  match_score: number
  match_percentage: number
  match_reasons: string[]
  breakdown: MatchBreakdown
}

export interface RecommendationsResponse {
  total: number
  top_k: number
  recommendations: RecommendationItem[]
}

export interface SimilarityResult {
  is_overused: boolean
  similar_count: number
  similar_projects: ProjectResponse[]
  suggestion: string
}

// ── Idea Generator ────────────────────────────────────────────────────────────

export interface GeneratedIdea {
  title: string
  description: string
  tech_stack: string[]
  novelty_score: number
  rationale: string
}

export interface GenerateIdeasResponse {
  user_id: number
  count: number
  ideas: GeneratedIdea[]
}
