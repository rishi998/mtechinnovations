import Link from 'next/link'
import { SectionWrapper } from '@/components/layout/SectionWrapper'
import { cn } from '@/lib/utils'

const cases = [
  {
    title: 'Learn & education',
    description:
      'Classroom-ready kits and boards for curriculum labs, workshops, and self-paced skill building.',
  },
  {
    title: 'IoT & home automation',
    description:
      'Sensor stacks, wireless modules, and power paths for connected devices you can deploy with confidence.',
  },
  {
    title: 'Robotics & control',
    description:
      'Drivers, motors, and real-time control building blocks for automation rigs and mobile platforms.',
  },
] as const

const cardClass = cn(
  'rounded-xl border border-ds-border bg-ds-primary p-6 transition duration-250 ease-out',
  'hover:scale-[1.02] hover:shadow-[var(--shadow-elevated-md)]',
)

export function UseCaseSection() {
  return (
    <SectionWrapper surface="surface" className="py-20 md:py-24 lg:py-28">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div className="max-w-xl">
            <h2 className="text-section font-semibold tracking-tight text-ds-text-primary">
              From prototypes to production
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-ds-text-secondary">
              Whether you are validating an idea on a breadboard or shipping your hundredth unit, we stock
              the boards, sensors, and power you need—with documentation-friendly SKUs and support that
              respects your timeline.
            </p>
            <Link
              href="/categories/"
              className="mt-8 inline-flex rounded-lg border border-ds-border bg-ds-surface px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ds-text-primary transition duration-250 ease-out hover:border-ds-accent hover:brightness-110"
            >
              Browse the catalog
            </Link>
          </div>

          <div className="grid max-w-xl gap-4 lg:justify-self-end">
            {cases.map((item) => (
              <div key={item.title} className={cardClass}>
                <h3 className="text-base font-semibold text-ds-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ds-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
