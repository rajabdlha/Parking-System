const items = [
  { color: 'var(--color-free-bg)', border: 'var(--color-free)', label: 'Libero (cliccabile)' },
  { color: 'var(--color-occupied-bg)', border: 'var(--color-occupied)', label: 'Occupato' },
  { color: 'var(--color-moto-bg)', border: 'var(--color-moto)', label: 'Auto' },
  { color: 'var(--color-moto-bg)', border: 'var(--color-moto)', label: 'Moto (bordo tratteg.)' },
  { color: 'var(--color-disabled-bg)', border: 'var(--color-disabled-color)', label: 'Disabili (bordo punt.)' },
]

export default function Legend() {
  return (
    <div className="flex flex-col gap-2">
      {items.map(i => (
        <span key={i.label} className="flex items-center gap-3 text-[12px] text-[var(--color-text-muted)]">
          <span
            className="w-4 h-4 rounded-sm shrink-0"
            style={{ background: i.color, border: `2px solid ${i.border}` }}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}