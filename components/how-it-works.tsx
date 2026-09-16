import Link from 'next/link'
import { ArrowUpRight, Search, MessagesSquare, KeyRound } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: '理想の条件で、探す',
    desc: 'エリアや物件種別、予算から気になる場所を。',
  },
  {
    icon: MessagesSquare,
    title: '気になることを、相談',
    desc: '内見の希望や入居時期を、掲載者と直接やりとり。',
  },
  {
    icon: KeyRound,
    title: '納得して、次の暮らしへ',
    desc: '条件を確かめて、契約・引き渡しへ進みます。',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16"
    >
      <div className="grid gap-10 border-y border-border py-12 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-relaxed">
            見つける、その先も。
            <br />
            ひとつずつ、安心して。
          </h2>
          <Link
            href="/guide"
            className="mt-6 inline-flex items-center gap-4 border-b border-primary/30 pb-2 text-xs font-medium"
          >
            ご利用の流れ
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <ol className="grid gap-7 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc }, index) => (
            <li key={title} className="border-t border-primary/25 pt-5">
              <span className="flex items-center justify-between text-[11px] tracking-widest text-muted-foreground">
                0{index + 1}
                <Icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-8 text-sm font-bold">{title}</h3>
              <p className="mt-3 text-xs leading-7 text-muted-foreground">
                {desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
