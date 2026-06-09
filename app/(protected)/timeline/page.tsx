import SectionHeader from '@/components/SectionHeader'
import { createClient } from '@/lib/supabase/server'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: memories } = await supabase
    .from('memories')
    .select('id,title,content,event_date,memory_type')
    .eq('user_id', user!.id)
    .not('event_date', 'is', null)
    .order('event_date', { ascending: false })
    .limit(30)

  return (
    <>
      <SectionHeader eyebrow="CHRONOLOGY LAYER" title="LIFE TIMELINE" />
      <section className="panel">
        {!memories?.length ? <p className="muted">No dated memories yet. Add dates in the Memory Vault to activate the timeline.</p> : (
          <div className="timeline-list">
            {memories.map((memory) => (
              <article key={memory.id} className="timeline-item">
                <time>{memory.event_date}</time>
                <div><span className="chip">{memory.memory_type}</span><h3>{memory.title}</h3><p>{memory.content}</p></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
