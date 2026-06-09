export default function SectionHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <header className="section-header">
      <div className="section-copy">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      {right ? <div className="section-actions">{right}</div> : null}
    </header>
  )
}
