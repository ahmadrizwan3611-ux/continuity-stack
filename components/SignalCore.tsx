export default function SignalCore({ label = 'CS' }: { label?: string }) {
  return (
    <div className="signal-core" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <span className="node node-a" />
      <span className="node node-b" />
      <span className="node node-c" />
      <div className="core-dot">{label}</div>
    </div>
  )
}
