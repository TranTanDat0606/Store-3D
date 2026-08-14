import { Link } from 'react-router-dom'
import { ArrowUpRight, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Category } from '@/types'
import { cn, resolveImageUrl } from '@/lib'

interface CategoriesSectionProps {
  categories: Category[]
}

const ACCENTS = [
  { glow: 'bg-cyan-500/20', text: 'text-cyan-400', bar: 'from-cyan-400 to-blue-500' },
  { glow: 'bg-blue-500/20', text: 'text-blue-400', bar: 'from-blue-400 to-cyan-400' },
  { glow: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'from-emerald-400 to-teal-400' },
  { glow: 'bg-violet-500/20', text: 'text-violet-400', bar: 'from-violet-400 to-purple-400' },
]

const base =
  'group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 dark:border-white/10'

function CardArt({ category, className }: { category: Category; className?: string }) {
  return (
    <div className={cn('absolute inset-0', className)}>
      <div className="bg-grid absolute inset-0 opacity-30 mix-blend-overlay" />
      {category.image ? (
        <img
          src={resolveImageUrl(category.image)}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground/40">
          <Layers className="size-12" />
        </div>
      )}
    </div>
  )
}

function IndexNum({ n, accent }: { n: string; accent: (typeof ACCENTS)[number] }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute top-1 right-1 text-4xl font-extrabold tracking-tighter opacity-[0.14] transition-opacity duration-300 group-hover:opacity-30',
        accent.text
      )}
    >
      {n}
    </span>
  )
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {categories.map((cat, i) => {
        const accent = ACCENTS[i % ACCENTS.length]
        const type = i % 4

        if (type === 0) {
          // Spotlight — large layered banner
          return (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
              className="col-span-2 lg:col-span-2"
            >
              <Link
                to={`/san-pham?categorySlug=${cat.slug}`}
                className={cn(base, 'flex min-h-48 justify-end p-5 sm:min-h-60')}
              >
                <div className={cn('absolute -top-16 -right-16 size-48 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100', accent.glow, 'opacity-60')} />
                <CardArt category={cat} className="opacity-30 transition-opacity duration-500 group-hover:opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <IndexNum n={String(i + 1).padStart(2, '0')} accent={accent} />
                <div className="relative">
                  <span className={cn('mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase', accent.text)}>
                    Spotlight
                  </span>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">{cat.name}</h3>
                  {cat.description && (
                    <p className="mt-1 line-clamp-2 max-w-md text-sm text-white/70">{cat.description}</p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-white/20">
                    Khám phá
                    <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        }

        if (type === 1) {
          // Portrait — tall image card
          return (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
            >
              <Link
                to={`/san-pham?categorySlug=${cat.slug}`}
                className={cn(base, 'flex aspect-[3/4] flex-col justify-end p-4')}
              >
                <CardArt category={cat} className="opacity-70 transition-all duration-700 group-hover:scale-110 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className={cn('absolute -bottom-10 left-1/2 size-32 -translate-x-1/2 rounded-full blur-3xl', accent.glow)} />
                <IndexNum n={String(i + 1).padStart(2, '0')} accent={accent} />
                <div className="relative">
                  <h3 className="text-sm font-bold text-white sm:text-base">{cat.name}</h3>
                  {cat.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-white/60">{cat.description}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          )
        }

        if (type === 2) {
          // Numbered glass card
          return (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
            >
              <Link
                to={`/san-pham?categorySlug=${cat.slug}`}
                className={cn(base, 'flex aspect-square flex-col justify-between p-4')}
              >
                <div className="absolute -top-8 right-0 flex h-28 w-28 items-center justify-center">
                  <div className={cn('size-20 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125', accent.glow)} />
                  <span className={cn('relative text-2xl font-extrabold', accent.text)}>{String(i + 1).padStart(2, '0')}</span>
                </div>
                {cat.image ? (
                  <div className="relative mt-auto h-20 w-20 self-end overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                    <img src={resolveImageUrl(cat.image)} alt="" loading="lazy" className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="text-muted-foreground/40 mt-auto self-end">
                    <Layers className="size-10" />
                  </div>
                )}
                <div className="relative">
                  <span className={cn('mb-0.5 block h-0.5 w-6 rounded-full bg-gradient-to-r transition-transform duration-300 group-hover:w-10', accent.bar)} />
                  <h3 className="text-sm font-bold sm:text-base">{cat.name}</h3>
                  {cat.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{cat.description}</p>}
                </div>
              </Link>
            </motion.div>
          )
        }

        // Wide horizontal card
        return (
          <motion.div
            key={cat._id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
            className="col-span-2"
          >
            <Link
              to={`/san-pham?categorySlug=${cat.slug}`}
              className={cn(base, 'flex aspect-[2/1] items-center gap-4 p-4')}
            >
              <div className="relative h-full w-1/2 overflow-hidden rounded-xl">
                <CardArt category={cat} className="transition-all duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
              </div>
              <div className="relative min-w-0 flex-1">
                <span className={cn('mb-1 block h-0.5 w-6 rounded-full bg-gradient-to-r transition-transform duration-300 group-hover:w-10', accent.bar)} />
                <h3 className="line-clamp-1 text-lg font-bold sm:text-xl">{cat.name}</h3>
                {cat.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
                )}
                <span className={cn('mt-2 inline-flex items-center gap-1 text-sm font-medium', accent.text)}>
                  Xem mô hình
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}