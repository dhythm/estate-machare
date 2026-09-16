import { parseBody } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { getAgentProfile, upsertAgentProfile } from '@/lib/server/agents'
import { validateAgentProfile } from '@/lib/validation/agent'

export async function GET() {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const profile = await getAgentProfile(authorized.user.id)
  return Response.json({ profile: profile ?? null })
}

export async function PUT(request: Request) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const parsed = await parseBody(request, validateAgentProfile)
  if (!parsed.ok) return parsed.response
  return Response.json(await upsertAgentProfile(authorized.user, parsed.value))
}
