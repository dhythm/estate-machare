import type { Metadata } from 'next'
import { PageIntro, PageShell } from '@/components/page-shell'
import { ContactForm } from '@/components/forms/contact-form'

export const metadata: Metadata = { title: 'お問い合わせ | Estate Machare' }

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageIntro
          title="お問い合わせ"
          description="物件探し・掲載・売買・賃貸に関するご質問や不具合の報告を受け付けています。"
        />
        <div className="page-form mt-8">
          <ContactForm />
        </div>
      </div>
    </PageShell>
  )
}
