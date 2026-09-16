import { PageShell } from '@/components/page-shell'
import { Hero } from '@/components/hero'
import { RoleChannels } from '@/components/role-channels'
import { HowItWorks } from '@/components/how-it-works'
import { Marketplace } from '@/components/marketplace'
import { HomeStatus } from '@/components/home/home-status'
import { featuredListingCount } from '@/lib/data'
import { getAccountOverview } from '@/lib/server/account'
import { getCurrentUser } from '@/lib/server/auth/session'
import { paginateListings } from '@/lib/server/listings'
import { countUnread } from '@/lib/server/notifications'

export const dynamic = 'force-dynamic'

async function homeStatus(userId: string) {
  const [overview, unreadNotifications] = await Promise.all([
    getAccountOverview(userId),
    countUnread(userId),
  ])
  return {
    ...overview.summary,
    unreadNotifications,
  }
}

export default async function Page() {
  const featured = await paginateListings(
    { category: 'すべて', deal: 'all' },
    { page: 1, pageSize: featuredListingCount },
  )
  const user = await getCurrentUser()
  const status = user ? await homeStatus(user.id) : undefined
  return (
    <PageShell>
      <Hero />
      {user && status && <HomeStatus name={user.name} status={status} />}
      <Marketplace initialPage={featured} />
      <HowItWorks />
      <RoleChannels />
    </PageShell>
  )
}
