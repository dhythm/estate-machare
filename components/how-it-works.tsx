import Link from 'next/link'
import { ArrowRight, Check, CalendarDays, Tractor, Repeat2 } from 'lucide-react'

const steps = [
  {
    icon: CalendarDays,
    title: '必要な期間、借りる',
    desc: '使う日を選んで、賃貸を申し込む。',
  },
  {
    icon: Tractor,
    title: '実際に住んで、確かめる',
    desc: '操作感も、作業効率も。実際に使って判断。',
  },
  {
    icon: Check,
    title: '気に入ったら、その一台を',
    desc: '出品条件に応じて賃料を購入価格に充当。',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-auto max-w-[1280px] scroll-mt-32 px-5 py-12 sm:px-8 sm:py-16"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#eaf0df] p-7 sm:p-10 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:p-14">
        <div>
          <p className="eyebrow text-primary/70">A NEW WAY TO OWN</p>
          <h2 className="mt-5 font-display text-3xl font-bold leading-relaxed tracking-tight text-primary sm:text-4xl">
            大きな買い物に、
            <br />
            小さなお試しを。
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-primary/75">
            暮らしに合うかは、住んでみてから。
            <br />
            賃貸から購入へ、納得できる選び方。
          </p>
          <Link
            href="/listings?deal=purchaseOption"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/85"
          >
            買取オプション付きの物件
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/guide#purchase-option"
            className="mt-4 flex w-fit items-center gap-2 text-xs text-primary underline underline-offset-4"
          >
            しくみと充当条件を見る
            <Repeat2 className="size-3" />
          </Link>
        </div>
        <ol className="mt-10 divide-y divide-primary/15 lg:mt-0">
          {steps.map(({ icon: Icon, title, desc }, index) => (
            <li key={title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-primary/60">
                  STEP 0{index + 1}
                </p>
                <h3 className="mt-1.5 text-base font-bold text-primary">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-primary/75">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
