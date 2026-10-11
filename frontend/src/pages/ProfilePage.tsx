import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, User } from 'lucide-react'
import { userService } from '../services/userService'
import type { ProfileCreate, KnowledgeLevel, ProjectType } from '../types'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { TagInput } from '../components/common/TagInput'
import { Spinner } from '../components/common/Spinner'

const KNOWLEDGE_LEVELS: { value: KnowledgeLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'ai', label: 'AI / ML' },
  { value: 'iot', label: 'IoT' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'other', label: 'Other' },
]

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    retry: false,
  })

  const isNew = !profile

  const mutation = useMutation({
    mutationFn: (data: ProfileCreate) =>
      isNew ? userService.createProfile(data) : userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      if (isOnboarding) navigate('/recommendations')
    },
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileCreate>({
    defaultValues: {
      skills: [],
      interests: [],
      technologies: [],
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        degree: profile.degree ?? '',
        university: profile.university ?? '',
        year_of_study: profile.year_of_study ?? undefined,
        skills: profile.skills,
        interests: profile.interests,
        technologies: profile.technologies,
        knowledge_level: profile.knowledge_level ?? undefined,
        preferred_project_type: profile.preferred_project_type ?? undefined,
        preferred_team_size: profile.preferred_team_size ?? undefined,
        bio: profile.bio ?? '',
      })
    }
  }, [profile, reset])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {isOnboarding && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
          <h2 className="font-semibold text-brand-800">Complete your profile</h2>
          <p className="mt-1 text-sm text-brand-600">
            Tell us about your skills and interests so we can recommend the best FYP projects for you.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <User size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Your profile helps us personalise your recommendations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Academic */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Academic Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Degree</label>
              <input
                className="input"
                placeholder="e.g. BSc Computer Science"
                {...register('degree')}
              />
            </div>
            <div>
              <label className="label">University</label>
              <input
                className="input"
                placeholder="e.g. University of Kabul"
                {...register('university')}
              />
            </div>
            <div>
              <label className="label">Year of Study</label>
              <input
                className="input"
                type="number"
                min={1}
                max={6}
                placeholder="e.g. 4"
                {...register('year_of_study', { valueAsNumber: true })}
              />
              {errors.year_of_study && (
                <p className="mt-1 text-xs text-red-600">{errors.year_of_study.message}</p>
              )}
            </div>
            <div>
              <label className="label">Knowledge Level</label>
              <select className="input" {...register('knowledge_level')}>
                <option value="">Select level</option>
                {KNOWLEDGE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Skills & Interests */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Skills & Interests
          </h3>
          <div className="space-y-4">
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <TagInput
                  label="Skills"
                  tags={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g. python, machine-learning"
                />
              )}
            />
            <Controller
              name="interests"
              control={control}
              render={({ field }) => (
                <TagInput
                  label="Interests"
                  tags={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g. healthcare, fintech"
                />
              )}
            />
            <Controller
              name="technologies"
              control={control}
              render={({ field }) => (
                <TagInput
                  label="Technologies"
                  tags={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g. react, django, pytorch"
                />
              )}
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Project Preferences
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Preferred Project Type</label>
              <select className="input" {...register('preferred_project_type')}>
                <option value="">Select type</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Preferred Team Size</label>
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                placeholder="e.g. 3"
                {...register('preferred_team_size', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Bio</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Tell us a bit about yourself and your goals..."
              {...register('bio')}
            />
          </div>
        </Card>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting || mutation.isPending} size="lg">
            {isOnboarding ? 'Save & Continue' : 'Save Profile'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle size={16} />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
