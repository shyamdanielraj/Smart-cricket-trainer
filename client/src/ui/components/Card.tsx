export function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="glass glow-border rounded-2xl p-5 transition duration-200 will-change-transform hover:-translate-y-[1px] hover:bg-white/[0.06] hover:shadow-glow">
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">{title}</div>
            {subtitle ? <div className="text-sm text-white/60">{subtitle}</div> : null}
          </div>
          {right}
        </div>
      ) : null}
      {children}
    </div>
  )
}

