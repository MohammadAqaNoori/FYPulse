import { useState, useCallback } from 'react'
import projectService from '@/services/projectService'
import SearchBar from '@/components/search/SearchBar'
import ProjectCard from '@/components/search/ProjectCard'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'
import type { Project, ProjectSearchParams } from '@/types'

export default function SearchPage() {
  const [results,   setResults]   = useState<Project[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [lastParams, setLastParams] = useState<ProjectSearchParams>({})
  const [searched,   setSearched]   = useState(false)

  const doSearch = useCallback(async (params: ProjectSearchParams, newPage = 1) => {
    setIsLoading(true)
    setError(null)
    setLastParams(params)
    setPage(newPage)
    try {
      const data = await projectService.search({ ...params, page: newPage })
      setResults(data.projects)
      setTotal(data.total)
      setSearched(true)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleLoadMore = () => {
    doSearch(lastParams, page + 1)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Search Projects</h1>
        <p className="text-slate-400 text-sm mt-1">
          Browse {total > 0 ? total.toLocaleString() : ''} indexed FYP projects from GitHub and universities.
        </p>
      </div>

      <SearchBar onSearch={(p) => doSearch(p, 1)} isLoading={isLoading} />

      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading && page === 1 ? (
        <Loader center label="Searching projects…" />
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No projects found.</p>
          <p className="text-sm mt-1">Try different keywords or remove some filters.</p>
        </div>
      ) : (
        <>
          {results.length > 0 && (
            <p className="text-sm text-slate-500">{total} result{total !== 1 ? 's' : ''}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {results.length < total && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" onClick={handleLoadMore} isLoading={isLoading && page > 1}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {!searched && !isLoading && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-5xl mb-4">📚</p>
          <p className="font-medium text-slate-400">Enter a search query to get started</p>
        </div>
      )}
    </div>
  )
}
