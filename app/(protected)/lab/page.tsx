import SectionHeader from '@/components/SectionHeader'

export default function LabPage() {
  return (
    <>
      <SectionHeader eyebrow="RESEARCH LOCK" title="EEG LAB" />
      <section className="panel spacious center-panel">
        <div className="big-icon">🔬</div>
        <h2 className="panel-title center orange">NON-INVASIVE EEG PHASE 13</h2>
        <p>Optional non-invasive EEG can be explored later only for safe app navigation, such as blink or focus detection. This feature stays locked until the software MVP is complete.</p>
        <span className="chip orange">No implants. No body control. No medical claims.</span>
      </section>
    </>
  )
}
