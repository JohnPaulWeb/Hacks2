'use client'

import { BookOpen, Brain, ChevronDown, Eye, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { PageContent, PageHeader, SectionTitle } from '@/components/page-header'
import { Button } from '@/components/ui/button'

const guides = [
  {
    icon: Brain,
    title: 'Common AI Patterns',
    description: 'Learn to recognize common tells that reveal AI-generated content',
    points: [
      'Overly perfect grammar and structure',
      'Generic or repetitive phrases',
      'Lack of personal anecdotes or specific details',
      'Numbered lists and bullet points in unnatural places',
      'Consistent tone and style that feels robotic',
    ],
  },
  {
    icon: Eye,
    title: 'Visual Flaws in Images',
    description: 'AI images often have characteristic artifacts and inconsistencies',
    points: [
      'Distorted hands or fingers (common AI weakness)',
      'Unusual eye reflections or light patterns',
      'Inconsistent textures or gradients',
      'Strange object blending or layering',
      'Unnatural hair strands or fabric patterns',
    ],
  },
  {
    icon: Lightbulb,
    title: 'Misinformation Red Flags',
    description: 'Spot misinformation with these helpful techniques',
    points: [
      'Check multiple sources for the same story',
      'Look for author information and credentials',
      'Verify images with reverse image search',
      'Watch for emotionally manipulative language',
      'Question sources that lack citations',
    ],
  },
  {
    icon: BookOpen,
    title: 'How Spot the Bot Works',
    description: 'Master the game mechanics and scoring system',
    points: [
      '5 questions per daily quiz',
      '10 XP per correct answer (base)',
      'Streak bonus: XP multiplied by streak length',
      'Accuracy tracked over time',
      'Badges unlock at different XP thresholds',
    ],
  },
]

const tips = [
  {
    title: 'Read Carefully',
    description:
      'Take your time to analyze both pieces of content. Look for subtle differences in tone, structure, and detail.',
  },
  {
    title: 'Trust Your Gut (Sometimes)',
    description:
      'AI-generated text often feels "off" even if you can\'t pinpoint why. Intuition combined with analysis is powerful.',
  },
  {
    title: 'Look for Context',
    description:
      'AI often lacks real-world experience. Specific details, personal stories, and unique perspectives tend to be human.',
  },
  {
    title: 'Spot Inconsistencies',
    description:
      'AI sometimes contradicts itself or uses conflicting information. Humans are usually more internally consistent.',
  },
  {
    title: 'Use the Explanations',
    description:
      'After each question, read the explanation. This helps you learn patterns and improve for future quizzes.',
  },
  {
    title: 'Build Your Streak',
    description:
      'Play daily to maintain your streak. The more you play, the better your intuition becomes for spotting AI.',
  },
]

const faqs = [
  {
    q: 'How often should I play?',
    a: 'Play daily to maintain your streak and build your AI detection skills. Each quiz takes about 5 minutes, making it perfect for a quick daily challenge.',
  },
  {
    q: 'What happens if I miss a day?',
    a: "Your streak will reset to 0 if you miss a day. Don't worry though—streaks are meant to motivate you, and you can always start a new one!",
  },
  {
    q: 'How is XP calculated?',
    a: 'You earn 10 XP per correct answer. Additionally, your daily streak acts as a multiplier—a 5-day streak means each correct answer is worth 50 XP (10 × 5).',
  },
  {
    q: "Can I retake yesterday's quiz?",
    a: 'Currently, you can only take the daily quiz once per day. Previous quizzes are archived for your reference.',
  },
  {
    q: 'How do I earn badges?',
    a: 'Badges unlock automatically when you reach certain milestones—first quiz, streaks, or XP thresholds. Check your profile to see progress.',
  },
]

export default function GuidePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Media literacy"
        title="Learning guide"
        description="Techniques for spotting AI text, synthetic images, and misleading content."
        icon={BookOpen}
        tone="accent"
      >
        <Link href="/dashboard/arena">
          <Button size="lg" className="h-11">
            Practice in arena
          </Button>
        </Link>
      </PageHeader>

      <PageContent>
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon
            return (
              <article key={guide.title} className="surface-card p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{guide.title}</h2>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{guide.description}</p>
                <ul className="prose-list space-y-3">
                  {guide.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        <SectionTitle title="Pro tips" description="Short habits that compound over daily play." />
        <div className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <div
              key={tip.title}
              className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-6"
            >
              <h3 className="mb-2 font-semibold text-foreground">{tip.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{tip.description}</p>
            </div>
          ))}
        </div>

        <SectionTitle title="FAQ" />
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group surface-card overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold text-foreground transition hover:bg-muted/30">
                <span>{faq.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition group-open:rotate-180" />
              </summary>
              <p className="border-t border-border/60 px-6 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </PageContent>
    </div>
  )
}
