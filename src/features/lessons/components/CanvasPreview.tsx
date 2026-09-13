import { useId } from 'react'
import type { Step } from '@/features/lessons/schema'
import { CANVAS_H, CANVAS_W, layersThrough, pointsAttr } from '@/features/lessons/utils/layers'
import { cn } from '@/lib/utils'

interface Props {
  steps: Step[]
  throughStep: number
  highlightStep?: number | null
  className?: string
}

// Renders the painting as it stands after `throughStep`. Layers from
// `highlightStep` get a brief emphasis so the painter sees what this step adds.
export function CanvasPreview({ steps, throughStep, highlightStep = null, className }: Props) {
  const id = useId()
  const blurId = `blur-${id}`
  const layers = layersThrough(steps, throughStep)

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-[#f3efe4] shadow-inner', className)}>
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Painting preview"
      >
        <defs>
          <filter id={blurId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={`${blurId}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
          <clipPath id={`${blurId}-clip`}>
            <rect width={CANVAS_W} height={CANVAS_H} />
          </clipPath>
        </defs>
        <rect width={CANVAS_W} height={CANVAS_H} fill="#f3efe4" />
        <g clipPath={`url(#${blurId}-clip)`}>
        {layers.map((layer) => {
          const isNew = highlightStep !== null && layer.stepIndex === highlightStep
          return (
            <polygon
              key={layer.key}
              points={pointsAttr(layer)}
              fill={layer.fill}
              fillOpacity={layer.opacity}
              filter={layer.soft ? `url(#${blurId})` : `url(#${blurId}-soft)`}
              className={cn(isNew && 'animate-[pulse_1.6s_ease-in-out_1]')}
            >
              <title>{layer.label}</title>
            </polygon>
          )
        })}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10" />
    </div>
  )
}
