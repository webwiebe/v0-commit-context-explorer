"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Settings, Plus, Trash2, GitCompare, GitCommit, Rocket } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

type SearchMode = "single" | "changelog" | "deployment"

interface CommitInputProps {
  onSearch: (sha: string, repo: string) => void
  onChangelog: (from: string, to: string, repo: string) => void
  onDeployment: (sha: string, repo: string) => void
  isLoading: boolean
}

const DEFAULT_REPO = "frasers-group/ec-fx-components"
const STORAGE_KEY = "commit-explorer-repos"

export function CommitInput({ onSearch, onChangelog, onDeployment, isLoading }: CommitInputProps) {
  const [mode, setMode] = useState<SearchMode>("changelog")
  const [sha, setSha] = useState("")
  const [fromSha, setFromSha] = useState("")
  const [toSha, setToSha] = useState("")
  const [deploymentSha, setDeploymentSha] = useState("")
  const [repo, setRepo] = useState(DEFAULT_REPO)
  const [repos, setRepos] = useState<string[]>([DEFAULT_REPO])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRepo, setNewRepo] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  // Load repos from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      // Ensure default repo is always included
      if (!parsed.includes(DEFAULT_REPO)) {
        parsed.unshift(DEFAULT_REPO)
      }
      setRepos(parsed)
    }
  }, [])

  // Save repos to localStorage
  const saveRepos = (newRepos: string[]) => {
    // Ensure default repo is always first
    if (!newRepos.includes(DEFAULT_REPO)) {
      newRepos = [DEFAULT_REPO, ...newRepos]
    }
    setRepos(newRepos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRepos))
  }

  const handleAddRepo = () => {
    if (newRepo.trim() && !repos.includes(newRepo.trim())) {
      saveRepos([...repos, newRepo.trim()])
      setNewRepo("")
    }
  }

  const handleDeleteRepo = (index: number) => {
    if (repos[index] === DEFAULT_REPO) return
    const newRepos = repos.filter((_, i) => i !== index)
    saveRepos(newRepos)
    if (repo === repos[index]) {
      setRepo(DEFAULT_REPO)
    }
  }

  const handleStartEdit = (index: number) => {
    if (repos[index] === DEFAULT_REPO) return
    setEditingIndex(index)
    setEditValue(repos[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newRepos = [...repos]
      const oldValue = newRepos[editingIndex]
      newRepos[editingIndex] = editValue.trim()
      saveRepos(newRepos)
      if (repo === oldValue) {
        setRepo(editValue.trim())
      }
      setEditingIndex(null)
      setEditValue("")
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "single" && sha.trim() && repo.trim()) {
      onSearch(sha.trim(), repo.trim())
    } else if (mode === "changelog" && fromSha.trim() && toSha.trim() && repo.trim()) {
      onChangelog(fromSha.trim(), toSha.trim(), repo.trim())
    } else if (mode === "deployment" && deploymentSha.trim() && repo.trim()) {
      onDeployment(deploymentSha.trim(), repo.trim())
    }
  }

  const isValid =
    mode === "single"
      ? sha.trim() && repo.trim()
      : mode === "changelog"
        ? fromSha.trim() && toSha.trim() && repo.trim()
        : deploymentSha.trim() && repo.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={mode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("single")}
          className={
            mode === "single"
              ? "bg-primary text-primary-foreground"
              : "border-border hover:bg-secondary hover:border-cyan bg-transparent"
          }
        >
          <GitCommit className="h-4 w-4 mr-2" />
          Single Commit
        </Button>
        <Button
          type="button"
          variant={mode === "changelog" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("changelog")}
          className={
            mode === "changelog"
              ? "bg-primary text-primary-foreground"
              : "border-border hover:bg-secondary hover:border-cyan bg-transparent"
          }
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Changelog
        </Button>
        <Button
          type="button"
          variant={mode === "deployment" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("deployment")}
          className={
            mode === "deployment"
              ? "bg-primary text-primary-foreground"
              : "border-border hover:bg-secondary hover:border-cyan bg-transparent"
          }
        >
          <Rocket className="h-4 w-4 mr-2" />
          Deployment
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Repository selector row */}
        <div className="flex gap-2">
          <Select value={repo} onValueChange={setRepo}>
            <SelectTrigger className="flex-1 bg-secondary border-border font-mono text-sm focus:border-cyan focus:ring-cyan">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent className="bg-secondary border-border">
              {repos.map((r) => (
                <SelectItem key={r} value={r} className="font-mono text-sm">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-border hover:bg-secondary hover:border-cyan bg-transparent"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Manage Repositories</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add, edit, or remove repositories from your list.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="owner/repo"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                    className="flex-1 bg-secondary border-border font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddRepo()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddRepo}
                    disabled={!newRepo.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {repos.map((r, index) => (
                    <div key={r} className="flex items-center gap-2 p-2 rounded-md bg-secondary border border-border">
                      {editingIndex === index ? (
                        <>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-background border-border font-mono text-sm h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit()
                              if (e.key === "Escape") handleCancelEdit()
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8"
                          >
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={handleCancelEdit} className="h-8">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <span
                            className={`flex-1 font-mono text-sm truncate ${
                              r === DEFAULT_REPO ? "text-cyan" : "text-foreground"
                            }`}
                          >
                            {r}
                            {r === DEFAULT_REPO && (
                              <span className="ml-2 text-xs text-muted-foreground">(default)</span>
                            )}
                          </span>
                          {r !== DEFAULT_REPO && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(index)}
                                className="h-8 px-2 hover:bg-background"
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRepo(index)}
                                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {mode === "single" ? (
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Commit SHA..."
              value={sha}
              onChange={(e) => setSha(e.target.value)}
              className="flex-1 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus:border-cyan focus:ring-cyan"
            />
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Search className="h-4 w-4" />
              {isLoading ? "Exploring..." : "Explore"}
            </Button>
          </div>
        ) : mode === "changelog" ? (
          <div className="flex gap-3 items-center">
            <Input
              type="text"
              placeholder="From SHA (older)..."
              value={fromSha}
              onChange={(e) => setFromSha(e.target.value)}
              className="flex-1 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus:border-cyan focus:ring-cyan"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="text"
              placeholder="To SHA (newer)..."
              value={toSha}
              onChange={(e) => setToSha(e.target.value)}
              className="flex-1 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus:border-cyan focus:ring-cyan"
            />
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Mach-config commit SHA..."
              value={deploymentSha}
              onChange={(e) => setDeploymentSha(e.target.value)}
              className="flex-1 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus:border-cyan focus:ring-cyan"
            />
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Rocket className="h-4 w-4" />
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
