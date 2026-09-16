import 'server-only'

import { isApproved, type PropertyRequest } from '@/lib/data'
import type { AgentProfileInput } from '@/lib/validation/agent'
import type { AuthenticatedUser } from './auth/accounts'
import { getStore, type AgentProfile } from './store'

export async function upsertAgentProfile(
  user: AuthenticatedUser,
  input: AgentProfileInput,
): Promise<AgentProfile> {
  const store = getStore()
  const now = new Date().toISOString()
  const existing = await store.agentProfiles.get(user.id)
  if (existing) {
    return (await store.agentProfiles.update(user.id, {
      ...input,
      updatedAt: now,
    })) as AgentProfile
  }
  return store.agentProfiles.create({
    id: user.id,
    ...input,
    createdAt: now,
    updatedAt: now,
  })
}

export function getAgentProfile(
  userId: string,
): Promise<AgentProfile | undefined> {
  return getStore().agentProfiles.get(userId)
}

export function listAgentProfiles(): Promise<AgentProfile[]> {
  return getStore().agentProfiles.list()
}

export type AgentMatch = { profile: AgentProfile; score: number }

/**
 * Two points for an agent based in the request's prefecture, one for an agent
 * who merely serves it; handling the category is required either way.
 */
function areaScore(profile: AgentProfile, request: PropertyRequest): number {
  if (profile.prefecture === request.prefecture) return 2
  return profile.serviceAreas.includes(request.prefecture) ? 1 : 0
}

function handlesCategory(
  profile: AgentProfile,
  request: PropertyRequest,
): boolean {
  return profile.handledCategories.includes(request.category)
}

/** Agents covering the request's area and category, closest match first. */
export async function matchAgentsForRequest(
  request: PropertyRequest,
): Promise<AgentMatch[]> {
  const profiles = await listAgentProfiles()
  return profiles
    .map((profile) => ({ profile, score: areaScore(profile, request) }))
    .filter((match) => match.score > 0 && handlesCategory(match.profile, request))
    .sort((a, b) => b.score - a.score)
}

/** Open, approved requests inside the agent's areas and categories. */
export async function matchRequestsForAgent(
  profile: AgentProfile,
): Promise<PropertyRequest[]> {
  const requests = await getStore().propertyRequests.list()
  return requests.filter(
    (request) =>
      isApproved(request) &&
      request.status === '募集中' &&
      areaScore(profile, request) > 0 &&
      handlesCategory(profile, request),
  )
}
