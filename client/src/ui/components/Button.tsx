import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

type Props = Omit<HTMLMotionProps<'button'>, 'className' | 'children'> & {
  variant?: 'primary' | 'ghost'
  loading?: boolean
  className?: string
  children?: React.ReactNode
}

export function Button({ variant = 'primary', loading, className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan/60 disabled:opacity-60 disabled:cursor-not-allowed will-change-transform'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-neon-green/90 to-neon-cyan/90 text-ink-950 shadow-glow hover:from-neon-green hover:to-neon-cyan hover:-translate-y-[1px] active:translate-y-0'
      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:-translate-y-[1px] active:translate-y-0'

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${base} ${styles} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {props.children}
    </motion.button>
  )
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
  )
}

