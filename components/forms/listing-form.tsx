'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { resizeDataUrl, resizeImage } from '@/lib/images'
import { Button } from '@/components/ui/button'
import {
  listingCategories,
  maxListingImages,
  listingConditions,
  sellerKinds,
  validateListingSubmission,
} from '@/lib/validation/listing-submission'
import { useSubmissionForm } from './use-submission-form'
import {
  CheckboxField,
  FormAlert,
  SelectField,
  TextField,
  TextareaField,
} from './fields'
import { ReceiptPanel } from './receipt'
import type { FormContact } from './contact'
import { SubmitButton } from './submit-button'

type Deal = 'sale' | 'rent'

type Picture = { full: string; thumb?: string }

type ListingFormValues = {
  areaSqm?: string
  builtYear?: string
  floorPlan?: string
  access?: string
  monthlyRent?: string
  name: string
  category: string
  maker: string
  year: string
  hours: string
  condition: string
  prefecture: string
  city: string
  deals: Deal[]
  salePrice: string
  rentPerDay: string
  rentToOwn: boolean
  rentToOwnCreditRate: string
  rentToOwnCreditCap: string
  summary: string
  sellerName: string
  sellerKind: string
  contactEmail: string
}

export type ListingEdit = {
  listingId: string
  values: ListingFormValues
  images: string[]
  thumbnail?: string
}

const fullSide = 1200
const thumbSide = 400

export function ListingForm({
  contact,
  edit,
}: {
  contact?: FormContact
  /** Present when editing: prefilled values and the listing's pictures. */
  edit?: ListingEdit
}) {
  const form = useSubmissionForm({
    url: edit ? `/api/listings/${edit.listingId}` : '/api/listings',
    method: edit ? 'PUT' : 'POST',
    validate: validateListingSubmission,
    initialValues: {
      ...(edit?.values ?? {
        name: '',
        category: '',
        maker: '',
        year: '',
        hours: '',
        condition: '',
        prefecture: '',
        city: '',
        deals: ['sale', 'rent'] as Deal[],
        salePrice: '',
        rentPerDay: '',
        rentToOwn: false,
        rentToOwnCreditRate: '',
        rentToOwnCreditCap: '',
        summary: '',
        sellerName: contact?.name ?? '',
        sellerKind: '',
        contactEmail: contact?.email ?? '',
      }),
      areaSqm: edit?.values.areaSqm ?? '',
      builtYear: edit?.values.builtYear ?? '',
      floorPlan: edit?.values.floorPlan ?? '',
      access: edit?.values.access ?? '',
      monthlyRent: edit?.values.monthlyRent ?? '',
      images: edit?.images ?? ([] as string[]),
      thumbnail: edit?.thumbnail ?? '',
    },
  })
  const [pictures, setPictures] = useState<Picture[]>(() =>
    (edit?.images ?? []).map((full, index) => ({
      full,
      thumb: index === 0 ? edit?.thumbnail : undefined,
    })),
  )
  const [pictureError, setPictureError] = useState<string>()
  const [isReading, setIsReading] = useState(false)

  const applyPictures = (next: Picture[]) => {
    setPictures(next)
    form.setValue(
      'images',
      next.map((picture) => picture.full),
    )
    form.setValue('thumbnail', next[0]?.thumb ?? '')
  }

  const addPictures = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPictureError(undefined)
    const room = maxListingImages - pictures.length
    if (room <= 0) {
      setPictureError(`写真は${maxListingImages}枚までです。`)
      return
    }
    setIsReading(true)
    try {
      const added = await Promise.all(
        Array.from(files)
          .slice(0, room)
          .map(async (file) => ({
            full: await resizeImage(file, fullSide),
            thumb: await resizeImage(file, thumbSide),
          })),
      )
      applyPictures([...pictures, ...added])
    } catch {
      setPictureError('写真を読み込めませんでした。')
    } finally {
      setIsReading(false)
    }
  }

  const removePicture = (index: number) =>
    applyPictures(pictures.filter((_, i) => i !== index))

  /** Existing pictures carry no thumbnail until one of them moves to the front. */
  const submit = async (event: React.FormEvent) => {
    const first = pictures[0]
    if (first && !first.thumb) {
      event.preventDefault()
      try {
        const thumb = await resizeDataUrl(first.full, thumbSide)
        setPictures((current) =>
          current.map((picture, index) =>
            index === 0 ? { ...picture, thumb } : picture,
          ),
        )
        await form.submit(event, { thumbnail: thumb })
      } catch {
        setPictureError('写真を読み込めませんでした。')
      }
      return
    }
    await form.submit(event)
  }

  const canSell = form.values.deals.includes('sale')
  const canRent = form.values.deals.includes('rent')

  const toggleDeal = (deal: Deal) => {
    const deals = canDeal(deal)
      ? form.values.deals.filter((value) => value !== deal)
      : [...form.values.deals, deal]
    form.setValue('deals', deals)
    if (!(deals.includes('sale') && deals.includes('rent')))
      form.setValue('rentToOwn', false)
  }
  const canDeal = (deal: Deal) => form.values.deals.includes(deal)

  if (form.receipt) {
    return (
      <ReceiptPanel
        receipt={form.receipt}
        title={edit ? '掲載の更新' : '掲載の申し込み'}
        description={edit ? '更新しました。' : '審査後に掲載します。'}
        links={
          edit
            ? [
                {
                  href: `/listings/${edit.listingId}`,
                  label: '物件の詳細を見る',
                },
                { href: '/account', label: 'マイページにもどる' },
              ]
            : [{ href: '/listings', label: '掲載中の物件を見る' }]
        }
      />
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert error={form.failed ? '送信できませんでした。' : undefined} />

      <section className="page-form space-y-5" aria-labelledby="listing-basics">
        <h2
          id="listing-basics"
          className="mb-6 flex items-center gap-3 text-lg font-bold"
        >
          <span className="text-xs text-muted-foreground">01</span>
          物件の基本情報
        </h2>
        <TextField
          id="name"
          label="物件名"
          placeholder="例: 南向きの角部屋 2LDK"
          value={form.values.name}
          onChange={(e) => form.setValue('name', e.target.value)}
          error={form.errors.name}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="category"
            label="カテゴリ"
            options={listingCategories}
            value={form.values.category}
            onChange={(e) => form.setValue('category', e.target.value)}
            error={form.errors.category}
          />
          <TextField
            id="floorPlan"
            label="間取り・区画"
            value={form.values.floorPlan}
            onChange={(e) => form.setValue('floorPlan', e.target.value)}
            error={form.errors.floorPlan}
          />
          {form.values.category !== '土地' && (
            <TextField
              id="builtYear"
              label="築年（西暦）"
              inputMode="numeric"
              placeholder="例: 2019"
              value={form.values.builtYear}
              onChange={(e) => form.setValue('builtYear', e.target.value)}
              error={form.errors.builtYear}
            />
          )}
          <TextField
            id="areaSqm"
            label="専有・土地面積（㎡）"
            inputMode="numeric"
            placeholder="例: 68.5"
            value={form.values.areaSqm}
            onChange={(e) => form.setValue('areaSqm', e.target.value)}
            error={form.errors.areaSqm}
          />
          <SelectField
            id="condition"
            label="状態"
            options={listingConditions}
            value={form.values.condition}
            onChange={(e) => form.setValue('condition', e.target.value)}
            error={form.errors.condition}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="prefecture"
              label="都道府県"
              value={form.values.prefecture}
              onChange={(e) => form.setValue('prefecture', e.target.value)}
              error={form.errors.prefecture}
            />
            <TextField
              id="city"
              label="市区町村"
              value={form.values.city}
              onChange={(e) => form.setValue('city', e.target.value)}
              error={form.errors.city}
            />
          </div>
        </div>
        <TextField
          id="access"
          label="交通アクセス"
          placeholder="例: 自由が丘駅 徒歩8分"
          value={form.values.access}
          onChange={(event) => form.setValue('access', event.target.value)}
          error={form.errors.access}
        />
      </section>
      <fieldset className="page-form">
        <legend className="rounded-md bg-card px-3 text-base font-bold text-foreground">
          02 取引方法・価格
        </legend>
        <div className="flex flex-wrap gap-6">
          <CheckboxField
            id="deal-sale"
            label="売買"
            checked={canSell}
            onChange={() => toggleDeal('sale')}
          />
          <CheckboxField
            id="deal-rent"
            label="賃貸"
            checked={canRent}
            onChange={() => toggleDeal('rent')}
          />
        </div>
        {form.errors.deals && (
          <p className="mt-2 text-xs text-destructive">{form.errors.deals}</p>
        )}
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {canSell && (
            <TextField
              id="salePrice"
              label="売買価格"
              inputMode="numeric"
              placeholder="円"
              value={form.values.salePrice}
              onChange={(e) => form.setValue('salePrice', e.target.value)}
              error={form.errors.salePrice}
            />
          )}
          {canRent && (
            <TextField
              id="monthlyRent"
              label="月額賃料（円）"
              inputMode="numeric"
              placeholder="円"
              value={form.values.monthlyRent}
              onChange={(e) => form.setValue('monthlyRent', e.target.value)}
              error={form.errors.monthlyRent}
            />
          )}
        </div>
      </fieldset>

      <section className="page-form space-y-6" aria-labelledby="listing-photos">
        <h2
          id="listing-photos"
          className="flex items-center gap-3 text-lg font-bold"
        >
          <span className="text-xs text-muted-foreground">03</span>
          写真・物件の特徴
        </h2>
        <fieldset>
          <label
            htmlFor="pictures"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            写真（{maxListingImages}枚まで）
          </label>
          <input
            id="pictures"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isReading || pictures.length >= maxListingImages}
            onChange={(event) => {
              void addPictures(event.target.files)
              event.target.value = ''
            }}
            className="block w-full rounded-xl border border-dashed border-primary/30 bg-secondary/40 p-5 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
          />
          {(pictureError || form.errors.images) && (
            <p className="mt-1 text-xs text-destructive">
              {pictureError ?? form.errors.images}
            </p>
          )}
          {pictures.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {pictures.map((picture, index) => (
                <li
                  key={`${index}-${picture.full.length}`}
                  className="relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={picture.thumb ?? picture.full}
                    alt={`写真 ${index + 1}`}
                    className="size-24 rounded-xl border border-border object-cover"
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="削除"
                    className="absolute -right-2 -top-2 rounded-full"
                    onClick={() => removePicture(index)}
                  >
                    <X className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <TextareaField
          id="summary"
          label="説明"
          placeholder="設備、リフォーム履歴、入居時期、契約条件など"
          value={form.values.summary}
          onChange={(e) => form.setValue('summary', e.target.value)}
          error={form.errors.summary}
        />
      </section>
      <section className="page-form space-y-5" aria-labelledby="listing-owner">
        <h2
          id="listing-owner"
          className="mb-6 flex items-center gap-3 text-lg font-bold"
        >
          <span className="text-xs text-muted-foreground">04</span>掲載者情報
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="sellerName"
            label="掲載者名"
            placeholder="例: まちの不動産"
            value={form.values.sellerName}
            onChange={(e) => form.setValue('sellerName', e.target.value)}
            error={form.errors.sellerName}
          />
          <SelectField
            id="sellerKind"
            label="掲載者の区分"
            options={sellerKinds}
            value={form.values.sellerKind}
            onChange={(e) => form.setValue('sellerKind', e.target.value)}
            error={form.errors.sellerKind}
          />
        </div>
        <TextField
          id="contactEmail"
          label="メールアドレス"
          type="email"
          value={form.values.contactEmail}
          onChange={(e) => form.setValue('contactEmail', e.target.value)}
          error={form.errors.contactEmail}
        />
      </section>
      <div className="flex justify-end rounded-xl border border-border bg-card p-5">
        <SubmitButton
          label={edit ? '更新する' : '掲載を申し込む'}
          isSubmitting={form.isSubmitting}
        />
      </div>
    </form>
  )
}
