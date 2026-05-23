const items = [
  { color: 'var(--color-free-bg)',      border: 'var(--color-free)',          label: 'Libero (cliccabile)' },
  { color: 'var(--color-occupied-bg)',  border: 'var(--color-occupied)',       label: 'Occupato' },
  { color: 'var(--color-moto-bg)',      border: 'var(--color-moto)',           label: 'Auto' },
  { color: 'var(--color-moto-bg)',      border: 'var(--color-moto)',           label: 'Moto (bordo tratteg.)' },
  { color: 'var(--color-disabled-bg)', border: 'var(--color-disabled-color)', label: 'Disabili (bordo punt.)' },
]

export default function Legend() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((i) => (
        <span
          key={i.label}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '12px', color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
              background: i.color, border: `2px solid ${i.border}`,
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}
