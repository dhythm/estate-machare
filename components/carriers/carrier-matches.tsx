import { Badge } from '@/components/badge'
import type { CarrierMatch } from '@/lib/server/carriers'

export function CarrierMatches({ matches }: { matches: CarrierMatch[] }) {
  if (matches.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        対応地域が合う引越しパートナーはまだいません
      </p>
    )
  return (
    <ul className="flex flex-col gap-3">
      {matches.map(({ profile, score }) => (
        <li
          key={profile.id}
          className="rounded-2xl border border-border bg-card p-4 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{profile.name}</span>
            <Badge variant="muted">{profile.kind}</Badge>
            <span className="text-xs text-muted-foreground">
              拠点 {profile.prefecture}
            </span>
            {score >= 2 && (
              <Badge variant="accent">出発地と届け先の両方に対応</Badge>
            )}
          </div>
          <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="inline">車両: </dt>
              <dd className="inline text-foreground">
                {profile.vehicles.join('・')}
              </dd>
            </div>
            <div>
              <dt className="inline">対応地域: </dt>
              <dd className="inline text-foreground">
                {profile.serviceAreas.join('・')}
              </dd>
            </div>
          </dl>
          {profile.note && (
            <p className="mt-2 text-muted-foreground">{profile.note}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
