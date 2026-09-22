import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProfile, createProfile, updateProfile } from '@/store/slices/profileSlice'
import { useAuth } from '@/hooks/useAuth'
import TagInput from '@/components/profile/TagInput'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Loader from '@/components/common/Loader'
import type { ProfilePayload, KnowledgeLevel, ProjectType } from '@/types'

const knowledgeLevels: KnowledgeLevel[] = ['beginner', 'intermediate', 'advanced']
const projectTypes: ProjectType[]       = ['web', 'mobile', 'ai', 'iot', 'desktop', 'data_science', 'cybersecurity', 'other']

export default function ProfilePage() {
  const dispatch                          = useAppDispatch()
  const { user }                          = useAuth()
  const { profile, isLoading, error }     = useAppSelector((s) => s.profile)
  const [saved, setSaved]                 = useState(false)

  // Form state
  const [degree,       setDegree]       = useState('')
  const [university,   setUniversity]   = useState('')
  const [year,         setYear]         = useState('')
  const [skills,       setSkills]       = useState<string[]>([])
  const [interests,    setInterests]    = useState<string[]>([])
  const [technologies, setTechnologies] = useState<string[]>([])
  const [level,        setLevel]        = useState<KnowledgeLevel | ''>('')
  const [projType,     setProjType]     = useState<ProjectType | ''>('')
  const [teamSize,     setTeamSize]     = useState('')
  const [bio,          setBio]          = useState('')

  useEffect(() => {
    dispatch(fetchProfile())
  }, [dispatch])

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setDegree(profile.degree ?? '')
      setUniversity(profile.university ?? '')
      setYear(profile.year_of_study ? String(profile.year_of_study) : '')
      setSkills(profile.skills)
      setInterests(profile.interests)
      setTechnologies(profile.technologies)
      setLevel(profile.knowledge_level ?? '')
      setProjType(profile.preferred_project_type ?? '')
      setTeamSize(profile.preferred_team_size ? String(profile.preferred_team_size) : '')
      setBio(profile.bio ?? '')
    }
  }, [profile])

  const handleSave = async () => {
    setSaved(false)
    const payload: ProfilePayload = {
      degree:                 degree || undefined,
      university:             university || undefined,
      year_of_study:          year ? Number(year) : undefined,
      skills,
      interests,
      technologies,
      knowledge_level:        level || undefined,
      preferred_project_type: projType || undefined,
      preferred_team_size:    teamSize ? Number(teamSize) : undefined,
      bio:                    bio || undefined,
    }
    const action = profile ? updateProfile(payload) : createProfile(payload)
    const result = await dispatch(action)
    if (!result.type.endsWith('/rejected')) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (isLoading && !profile) return <Loader center label="Loading profile…" />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
        </div>
        <Button onClick={handleSave} isLoading={isLoading} size="sm">
          {profile ? 'Save changes' : 'Create profile'}
        </Button>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/50 px-4 py-3 text-sm text-emerald-300">
          ✅ Profile saved successfully!
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Academic info */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Academic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="degree" className="label">Degree</label>
            <input
              id="degree"
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="BSc Computer Science"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="university" className="label">University</label>
            <input
              id="university"
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="University of…"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="year" className="label">Year of Study</label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="input-base"
            >
              <option value="">Select year</option>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bio" className="label">Bio</label>
            <input
              id="bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short intro about yourself"
              className="input-base"
            />
          </div>
        </div>
      </Card>

      {/* Skills & interests */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Skills & Interests</h2>
        <div className="space-y-4">
          <TagInput
            label="Skills"
            id="skills"
            tags={skills}
            onChange={setSkills}
            placeholder="e.g. Python, React, SQL…"
          />
          <TagInput
            label="Interests"
            id="interests"
            tags={interests}
            onChange={setInterests}
            placeholder="e.g. Machine Learning, IoT…"
          />
          <TagInput
            label="Technologies"
            id="technologies"
            tags={technologies}
            onChange={setTechnologies}
            placeholder="e.g. TensorFlow, Docker…"
          />
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Project Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="level" className="label">Knowledge level</label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as KnowledgeLevel | '')}
              className="input-base"
            >
              <option value="">Select level</option>
              {knowledgeLevels.map((l) => (
                <option key={l} value={l} className="capitalize">{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="teamSize" className="label">Preferred team size</label>
            <input
              id="teamSize"
              type="number"
              min={1}
              max={10}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="1–10"
              className="input-base"
            />
          </div>
        </div>

        {/* Project type */}
        <div className="mt-4">
          <p className="label">Preferred project type</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {projectTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setProjType(projType === t ? '' : t)}
                className="transition-all"
              >
                <Badge
                  variant={projType === t ? 'primary' : 'default'}
                  className={`cursor-pointer capitalize ${projType === t ? 'ring-1 ring-primary-500' : ''}`}
                >
                  {t.replace('_', ' ')}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Save button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isLoading}>
          {profile ? 'Save changes' : 'Create profile'}
        </Button>
      </div>
    </div>
  )
}
