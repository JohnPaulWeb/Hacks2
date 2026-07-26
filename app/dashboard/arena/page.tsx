'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getTodayQuestions, submitQuizAnswer, analyzeUploadedImage } from '@/lib/quiz'
import type { ImageAnalysisReport, ExtendedQuizQuestion } from '@/lib/quiz'
import { checkAndAwardBadges } from '@/lib/badges'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Zap, CheckCircle, Upload, ImageIcon, Sparkles, ShieldCheck,
  Eye, AlertTriangle, RefreshCw, Maximize2, X, Crosshair, FileSearch,
} from 'lucide-react'

const SAMPLE_TEST_IMAGES = [
  {
    id: 'sample-1',
    name: 'AI Portrait (Midjourney style)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    description: 'Hyper-glossy eyes with synthetic skin smoothing',
  },
  {
    id: 'sample-2',
    name: 'Authentic Street Portrait',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    description: 'Natural optical sensor grain and skin texture',
  },
  {
    id: 'sample-3',
    name: 'AI Neon Cityscape',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    description: 'Over-saturated neon with distorted typography',
  },
  {
    id: 'sample-4',
    name: 'Real Tokyo Alley',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    description: 'Authentic weathered bricks and electrical wiring',
  },
]

export default function ArenaPage() {
  const { user, profile, refreshProfile } = useAuth()

  // Arena Mode: 'quiz' or 'import'
  const [arenaMode, setArenaMode] = useState<'quiz' | 'import'>('quiz')

  // Quiz state
  const [questions, setQuestions] = useState<ExtendedQuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: 'human' | 'ai' | null }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [totalXp, setTotalXp] = useState(0)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // Image Inspector state
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null)
  const [importedFileName, setImportedFileName] = useState<string>('')
  const [urlInput, setUrlInput] = useState<string>('')
  const [userGuess, setUserGuess] = useState<'human' | 'ai' | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisReport, setAnalysisReport] = useState<ImageAnalysisReport | null>(null)
  const [showHotspots, setShowHotspots] = useState(true)
  const [earnedImportXp, setEarnedImportXp] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isMounted = true

    const loadQuiz = async () => {
      try {
        const quizQuestions = await getTodayQuestions()
        if (!isMounted) return
        setQuestions(quizQuestions as ExtendedQuizQuestion[])

        // Initialize answers
        const initialAnswers: { [key: string]: null } = {}
        quizQuestions.forEach((q) => {
          initialAnswers[q.id] = null
        })
        setAnswers(initialAnswers)
      } catch (err) {
        console.error('Failed to load quiz:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadQuiz()

    return () => {
      isMounted = false
    }
  }, [user])

  const currentQuestion = questions[currentIndex]

  const handleAnswer = async (answer: 'human' | 'ai') => {
    if (!currentQuestion) return

    setSubmitting(true)

    try {
      const userId = user?.id || 'guest-user'
      const result = await submitQuizAnswer(userId, currentQuestion.id, answer)
      const newAnswers = { ...answers, [currentQuestion.id]: answer }
      setAnswers(newAnswers)
      const newTotalXp = totalXp + (result?.xpEarned || 0)
      setTotalXp(newTotalXp)

      if (currentIndex < questions.length - 1) {
        // Move to next question
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1)
          setSubmitting(false)
        }, 500)
      } else {
        // Quiz complete
        await new Promise((resolve) => setTimeout(resolve, 500))

        let correct = 0
        let total = questions.length
        let xp = newTotalXp

        try {
          if (user?.id) {
            const { data: responses } = await supabase
              .from('user_quiz_responses')
              .select('is_correct, xp_earned, question_id')
              .eq('user_id', user.id)
              .eq('quiz_date', new Date().toISOString().split('T')[0])

            if (responses && responses.length > 0) {
              correct = responses.filter((r) => r.is_correct).length
              total = responses.length
              xp = responses.reduce((sum, r) => sum + r.xp_earned, 0)
            } else {
              correct = questions.filter((q) => {
                const ans = q.id === currentQuestion.id ? answer : newAnswers[q.id]
                return ans === q.correct_answer
              }).length
            }
          } else {
            correct = questions.filter((q) => {
              const ans = q.id === currentQuestion.id ? answer : newAnswers[q.id]
              return ans === q.correct_answer
            }).length
          }
        } catch {
          correct = questions.filter((q) => {
            const ans = q.id === currentQuestion.id ? answer : newAnswers[q.id]
            return ans === q.correct_answer
          }).length
        }

        setResults({
          correct,
          total,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          xp,
        })

        // Update profile
        if (user && profile) {
          try {
            // Calculate streak
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]

            const { data: yesterdayResponses } = await supabase
              .from('user_quiz_responses')
              .select('id')
              .eq('user_id', user.id)
              .eq('quiz_date', yesterdayStr)

            const isConsecutive = (yesterdayResponses?.length || 0) > 0

            const newStreak = isConsecutive ? profile.current_streak + 1 : 1
            const longestStreak = Math.max(newStreak, profile.longest_streak || 0)

            const { error } = await supabase
              .from('users')
              .update({
                total_xp: (profile.total_xp || 0) + xp,
                current_streak: newStreak,
                longest_streak: longestStreak,
                last_played_date: new Date().toISOString(),
              })
              .eq('id', user.id)

            if (!error) {
              await refreshProfile()
              // Check and award badges
              await checkAndAwardBadges(user.id)
            }
          } catch (profileErr) {
            console.warn('Could not update profile stats:', profileErr)
          }
        }

        setSubmitting(false)
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setSubmitting(false)
    }
  }

  // Image inspector helpers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImportedImageUrl(result)
        setImportedFileName(file.name)
        setAnalysisReport(null); setUserGuess(null); setEarnedImportXp(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (urlInput.trim()) {
      setImportedImageUrl(urlInput.trim())
      setImportedFileName('web-image.jpg')
      setAnalysisReport(null); setUserGuess(null); setEarnedImportXp(null)
    }
  }

  const handleSelectSample = (sample: (typeof SAMPLE_TEST_IMAGES)[0]) => {
    setImportedImageUrl(sample.url)
    setImportedFileName(sample.name)
    setAnalysisReport(null); setUserGuess(null); setEarnedImportXp(null)
  }

  const handleRunAnalysis = async () => {
    if (!importedImageUrl) return
    setAnalyzing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const report = analyzeUploadedImage(importedFileName, importedImageUrl)
    setAnalysisReport(report)
    setAnalyzing(false)
    if (userGuess) {
      const actualVerdictType = report.isAI ? 'ai' : 'human'
      if (userGuess === actualVerdictType) {
        const xpBonus = 15
        setEarnedImportXp(xpBonus)
        if (user && profile) {
          try {
            await supabase.from('users').update({ total_xp: (profile.total_xp || 0) + xpBonus }).eq('id', user.id)
            await refreshProfile()
          } catch (err) { console.warn('Could not update XP:', err) }
        }
      } else {
        setEarnedImportXp(0)
      }
    }
  }

  const handleResetImport = () => {
    setImportedImageUrl(null); setImportedFileName(''); setUrlInput('')
    setAnalysisReport(null); setUserGuess(null); setEarnedImportXp(null)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Arena...</div>
          <p className="text-muted-foreground">Preparing quiz and AI image detector</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">

      {/* Header & Mode Switcher */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Spot the Bot Arena</h1>
              <p className="text-xs text-muted-foreground">Challenge your AI detection skills &amp; inspect imported images</p>
            </div>
          </div>
          <div className="flex bg-muted/60 p-1.5 rounded-xl border border-border w-full md:w-auto">
            <button
              onClick={() => setArenaMode('quiz')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                arenaMode === 'quiz' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="w-4 h-4" />
              Daily Quiz Arena
            </button>
            <button
              onClick={() => setArenaMode('import')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                arenaMode === 'import' ? 'bg-accent text-accent-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-4 h-4" />
              Import &amp; Define Image
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button onClick={() => setZoomImage(null)} className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <img src={zoomImage} alt="Zoomed" className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/20" />
          </div>
        </div>
      )}

      {/* === IMPORT & DEFINE IMAGE MODE === */}
      {arenaMode === 'import' && (
        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FileSearch className="w-7 h-7 text-accent" />
              AI vs Human Image Inspector
            </h2>
            <p className="text-muted-foreground text-sm">
              Upload or link any image to define if it is AI-generated or authentic. Guess first to earn +15 XP!
            </p>
          </div>

          {!importedImageUrl ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upload Area */}
              <div className="md:col-span-2 space-y-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/40 hover:border-primary bg-card/50 hover:bg-primary/5 rounded-2xl p-8 md:p-14 text-center cursor-pointer transition-all flex flex-col items-center group shadow-sm"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform border border-primary/20">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Upload an Image to Analyze</h3>
                  <p className="text-sm text-muted-foreground mb-4">Drag &amp; drop here or click to browse (PNG, JPG, WEBP)</p>
                  <Button className="bg-primary text-primary-foreground pointer-events-none">Select File from Device</Button>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Or Paste an Image URL:
                  </p>
                  <form onSubmit={handleUrlSubmit} className="flex gap-3">
                    <input
                      type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <Button type="submit" className="bg-primary text-primary-foreground whitespace-nowrap">Import URL</Button>
                  </form>
                </div>
              </div>

              {/* Sample Library */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-md font-bold text-foreground mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Preset Test Library
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">Try pre-selected AI vs Real test images instantly:</p>
                  <div className="space-y-3">
                    {SAMPLE_TEST_IMAGES.map((sample) => (
                      <div
                        key={sample.id} onClick={() => handleSelectSample(sample)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-accent/10 hover:border-accent/40 cursor-pointer transition-all group"
                      >
                        <img src={sample.url} alt={sample.name} className="w-14 h-14 rounded-lg object-cover border border-border group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{sample.name}</p>
                          <p className="text-[11px] text-muted-foreground">{sample.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-auto p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-xs text-muted-foreground">
                  💡 <span className="font-semibold text-foreground">Tip:</span> AI detectors look for unnatural iris reflections, overly smooth skin, and inconsistent lighting.
                </div>
              </div>
            </div>
          ) : (
            /* Analyzer View */
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-md">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Image Inspector</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{importedFileName || 'Uploaded Image'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetImport} className="gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Import Another
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Image Panel */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="relative w-full rounded-xl overflow-hidden border border-border bg-black/40 shadow-inner group aspect-square max-w-md">
                    <img src={importedImageUrl} alt="Inspecting" className="w-full h-full object-cover" />
                    {analyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-accent text-xs font-bold animate-pulse">Scanning spectrum...</p>
                      </div>
                    )}
                    {analysisReport && showHotspots && !analyzing && (
                      <div className="absolute inset-0 pointer-events-none">
                        {analysisReport.detectedHotspots.map((spot, idx) => (
                          <div
                            key={idx}
                            style={{ top: `${spot.y}%`, left: `${spot.x}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-accent px-2 py-0.5 rounded-full text-[10px] font-semibold text-accent shadow-lg"
                          >
                            <Crosshair className="w-3 h-3" />{spot.label}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setZoomImage(importedImageUrl)}
                      className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  {analysisReport && (
                    <label className="mt-3 text-xs font-semibold text-muted-foreground flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showHotspots} onChange={(e) => setShowHotspots(e.target.checked)} className="rounded" />
                      Show AI Artifact Hotspots
                    </label>
                  )}
                </div>

                {/* Controls & Report */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  {!analysisReport && !analyzing && (
                    <>
                      <div className="p-5 bg-muted/40 border border-border rounded-xl">
                        <h4 className="font-bold text-foreground mb-1 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" />
                          Step 1 — Test Your Instincts!
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">Guess before analysis to earn +15 XP if correct!</p>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setUserGuess('human')}
                            className={`py-5 rounded-xl border-2 font-bold text-sm transition-all ${
                              userGuess === 'human'
                                ? 'border-secondary bg-secondary/20 text-secondary'
                                : 'border-border bg-muted/30 text-muted-foreground hover:border-secondary/50 hover:text-secondary'
                            }`}
                          >
                            🧑 This is Human
                          </button>
                          <button
                            onClick={() => setUserGuess('ai')}
                            className={`py-5 rounded-xl border-2 font-bold text-sm transition-all ${
                              userGuess === 'ai'
                                ? 'border-accent bg-accent/20 text-accent'
                                : 'border-border bg-muted/30 text-muted-foreground hover:border-accent/50 hover:text-accent'
                            }`}
                          >
                            🤖 This is AI
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={handleRunAnalysis}
                        className="w-full py-6 text-base font-bold bg-gradient-to-r from-primary to-accent text-white shadow-lg gap-2 hover:opacity-90"
                      >
                        <ShieldCheck className="w-5 h-5" />
                        Run AI Forensic Inspection
                      </Button>
                    </>
                  )}

                  {analyzing && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                      <p className="font-bold text-lg text-foreground">Analyzing Image...</p>
                      <p className="text-xs text-muted-foreground max-w-xs">Inspecting skin micro-details, shadow vectors, sub-surface scattering, and optical grain density.</p>
                    </div>
                  )}

                  {analysisReport && !analyzing && (
                    <>
                      <div className={`p-5 rounded-xl border flex items-center justify-between gap-4 ${
                        analysisReport.isAI ? 'bg-accent/10 border-accent/40' : 'bg-secondary/10 border-secondary/40'
                      }`}>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forensic Verdict</p>
                          <h3 className={`text-2xl font-bold mt-1 ${analysisReport.isAI ? 'text-accent' : 'text-secondary'}`}>
                            {analysisReport.verdict}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Confidence: <span className="font-bold text-foreground">{analysisReport.confidence}%</span>
                          </p>
                        </div>
                        {earnedImportXp !== null && (
                          <div className="bg-card border border-border p-3 rounded-xl text-center shadow-sm shrink-0">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Your Guess</p>
                            {earnedImportXp > 0 ? (
                              <div className="flex items-center gap-1 font-bold text-accent text-sm mt-0.5">
                                <Zap className="w-4 h-4 fill-accent" />+{earnedImportXp} XP!
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-xs mt-0.5">Incorrect</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Detected Indicators:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysisReport.flawTags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-muted border border-border rounded-full text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-accent" />{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 border border-border rounded-xl text-xs">
                        {[
                          { label: 'Skin Smoothing Index', value: analysisReport.metrics.skinSmoothingIndex, color: 'bg-accent' },
                          { label: 'Lighting Coherence', value: analysisReport.metrics.lightingConsistencyScore, color: 'bg-primary' },
                          { label: 'Anatomical Symmetry', value: analysisReport.metrics.anatomicalSymmetryScore, color: 'bg-accent' },
                          { label: 'Sensor Noise Density', value: analysisReport.metrics.noiseFrequencyDensity, color: 'bg-secondary' },
                        ].map((metric) => (
                          <div key={metric.label}>
                            <p className="text-muted-foreground mb-1">{metric.label}</p>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div className={`${metric.color} h-full transition-all duration-700`} style={{ width: `${metric.value}%` }}></div>
                            </div>
                            <p className="text-right text-[10px] text-muted-foreground mt-0.5">{metric.value}%</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-card border border-border rounded-xl text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground mb-1">Analysis Breakdown:</p>
                        {analysisReport.explanation}
                      </div>

                      <Button onClick={handleResetImport} className="w-full bg-primary text-primary-foreground">Import Another Image</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === DAILY QUIZ ARENA MODE === */}
      {arenaMode === 'quiz' && (
        <div className="flex-1 flex flex-col">
          {!questions.length ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-2">Quiz Not Available</div>
                <p className="text-muted-foreground mb-6">No quiz questions for today</p>
                <Link href="/dashboard"><Button className="bg-primary text-primary-foreground">Back to Dashboard</Button></Link>
              </div>
            </div>
          ) : results ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
              <div className="max-w-2xl w-full">
                <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
                  <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Complete!</h1>
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8 my-8">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">Accuracy</p>
                        <p className="text-4xl font-bold text-primary">{results.accuracy}%</p>
                        <p className="text-muted-foreground text-sm mt-2">{results.correct}/{results.total} correct</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">XP Earned</p>
                        <p className="text-4xl font-bold text-accent flex items-center justify-center gap-2">
                          <Zap className="w-8 h-8" />{results.xp}
                        </p>
                      </div>
                    </div>
                    {results.accuracy >= 80 && (
                      <div className="p-4 bg-secondary/20 border border-secondary rounded-lg text-secondary font-semibold">Outstanding! You&apos;re crushing it!</div>
                    )}
                    {results.accuracy >= 60 && results.accuracy < 80 && (
                      <div className="p-4 bg-accent/20 border border-accent rounded-lg text-accent font-semibold">Good job! Keep practicing!</div>
                    )}
                  </div>
                  <Link href="/dashboard">
                    <Button className="bg-primary text-primary-foreground w-full py-6 text-base font-bold">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : currentQuestion ? (
            <>
              {/* Progress Bar */}
              <div className="border-b border-border bg-card p-4">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Question {currentIndex + 1} of {questions.length}
                      {(currentQuestion as ExtendedQuizQuestion).type === 'image' && (
                        <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs font-bold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Image Challenge
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</p>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-4xl w-full">
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Which content is AI-generated?</h2>
                    {(currentQuestion as ExtendedQuizQuestion).title && (
                      <p className="text-sm text-muted-foreground">{(currentQuestion as ExtendedQuizQuestion).title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option A — Human */}
                    <div className={`group cursor-pointer transition-all ${submitting ? 'pointer-events-none' : ''}`} onClick={() => !submitting && handleAnswer('human')}>
                      <div className={`bg-card border-2 rounded-xl p-6 transition-all h-full flex flex-col ${
                        answers[currentQuestion.id] === 'human' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-semibold">OPTION A</span>
                          {answers[currentQuestion.id] === 'human' && <CheckCircle className="w-6 h-6 text-primary" />}
                        </div>
                        {(currentQuestion as ExtendedQuizQuestion).human_image_url && (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-border mb-4 bg-black/20">
                            <img src={(currentQuestion as ExtendedQuizQuestion).human_image_url} alt="Option A" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); setZoomImage((currentQuestion as ExtendedQuizQuestion).human_image_url || null) }} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-black opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="flex-1 mb-4">
                          <p className="text-foreground text-base leading-relaxed">{currentQuestion.human_content}</p>
                        </div>
                        <Button className="w-full bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/50 font-bold" disabled={submitting}>
                          {submitting && answers[currentQuestion.id] === 'human' ? 'Checking...' : 'This is Human'}
                        </Button>
                      </div>
                    </div>

                    {/* Option B — AI */}
                    <div className={`group cursor-pointer transition-all ${submitting ? 'pointer-events-none' : ''}`} onClick={() => !submitting && handleAnswer('ai')}>
                      <div className={`bg-card border-2 rounded-xl p-6 transition-all h-full flex flex-col ${
                        answers[currentQuestion.id] === 'ai' ? 'border-accent bg-accent/5 shadow-md' : 'border-border hover:border-accent/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold">OPTION B</span>
                          {answers[currentQuestion.id] === 'ai' && <CheckCircle className="w-6 h-6 text-accent" />}
                        </div>
                        {(currentQuestion as ExtendedQuizQuestion).ai_image_url && (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-border mb-4 bg-black/20">
                            <img src={(currentQuestion as ExtendedQuizQuestion).ai_image_url} alt="Option B" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); setZoomImage((currentQuestion as ExtendedQuizQuestion).ai_image_url || null) }} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-black opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="flex-1 mb-4">
                          <p className="text-foreground text-base leading-relaxed">{currentQuestion.ai_content}</p>
                        </div>
                        <Button className="w-full bg-accent/20 text-accent hover:bg-accent/30 border border-accent/50 font-bold" disabled={submitting}>
                          {submitting && answers[currentQuestion.id] === 'ai' ? 'Checking...' : 'This is AI'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {currentQuestion.visual_flaws && currentQuestion.visual_flaws.length > 0 && (
                    <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">AI Detection Clue:</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.visual_flaws[0]}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
