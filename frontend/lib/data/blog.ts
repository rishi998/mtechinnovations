/** Editorial content for /blog — static placeholder data (replace with CMS/API later). */

export type BlogPostMeta = {
  slug: string
  title: string
  excerpt: string
  image: string
  date: string
}

export const blogArticles: BlogPostMeta[] = [
  {
    slug: 'simplifly-sf10-rc-transmitter-overview',
    title: 'SimpliFly SF10 2.4GHz 10-Channel RC Transmitter & Receiver — setup tips',
    excerpt: 'Pairing, failsafe, and range checks before your first flight.',
    image: 'https://images.unsplash.com/photo-1473968512647-3ae447db8176?w=800&q=80',
    date: 'Jan 12, 2026',
  },
  {
    slug: 'arduino-day-2026-announcement',
    title: 'Arduino Day 2026 — Celebrate innovation with offers & workshops',
    excerpt: 'Save the date for builds, demos, and community meetups.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    date: 'Jan 8, 2026',
  },
  {
    slug: 'arduino-ventuno-q-edge-ai',
    title: 'Arduino VENTUNO Q: edge AI for robotics and vision projects',
    excerpt: 'Specs, power budgets, and when to choose it over classic boards.',
    image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&q=80',
    date: 'Dec 20, 2025',
  },
  {
    slug: 'dd-robocon-2026-team-offer',
    title: 'Special kit bundles for competition teams — motors, drivers & sensors',
    excerpt: 'How to qualify and ship timelines for roster-approved orders.',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    date: 'Dec 5, 2025',
  },
]

export const blogTutorials: BlogPostMeta[] = [
  {
    slug: 'pid-tuning-self-balancing-robot',
    title: 'PID tuning for a self-balancing robot — practical steps',
    excerpt: 'Stable gains without oscillation using IMU feedback.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    date: 'Jan 15, 2026',
  },
  {
    slug: 'can-protocol-motor-controllers',
    title: 'How to set up & use CAN protocol with motor controllers',
    excerpt: 'Termination, bitrate, and framing on a crowded bus.',
    image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&q=80',
    date: 'Jan 4, 2026',
  },
  {
    slug: 'arduino-uno-q-ultrasonic-radar',
    title: 'Arduino UNO Q radar project — real-time ultrasonic mapping',
    excerpt: 'Sweep sampling, filtering noise, and plotting distance rings.',
    image: 'https://images.unsplash.com/photo-1580584126903-c17d41830450?w=800&q=80',
    date: 'Dec 28, 2025',
  },
  {
    slug: 'diy-arduino-uno-from-kit',
    title: 'DIY Arduino UNO from kit — soldering & smoke checks',
    excerpt: 'Bootloader flash, USB-serial, and first blink verification.',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&q=80',
    date: 'Dec 12, 2025',
  },
]

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  const all = [...blogArticles, ...blogTutorials]
  return all.find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return [...blogArticles, ...blogTutorials].map((p) => p.slug)
}
