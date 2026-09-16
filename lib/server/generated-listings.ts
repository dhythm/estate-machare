import 'server-only'

import type { Layout, Listing, Zoning } from '@/lib/data'

type Template = {
  prefix: string
  category: Listing['category']
  image: string
  /** Name stems combined with the city, and the layout when there is one. */
  names: string[]
  zonings: Zoning[]
  /** Empty for categories without rooms, such as land. */
  layouts: Layout[]
  floorArea: [number, number]
  salePrice: [number, number]
  rentPerMonth: [number, number]
  tags: string[]
  summaries: string[]
}

const templates: Template[] = [
  {
    prefix: 'apt',
    category: 'マンション',
    image: '/properties/apartment.svg',
    names: [
      'シティタワー',
      'グランコート',
      'パークサイドレジデンス',
      'ルミエール',
      'アーバンビュー',
      'サンライズヒルズ',
    ],
    zonings: [
      '第一種中高層住居専用地域',
      '第一種住居地域',
      '近隣商業地域',
      '商業地域',
    ],
    layouts: ['1K', '1LDK', '2LDK', '3LDK'],
    floorArea: [25, 92],
    salePrice: [18_000_000, 128_000_000],
    rentPerMonth: [78_000, 420_000],
    tags: [
      'オートロック',
      '宅配ボックス',
      '南向き',
      '角部屋',
      'リノベーション済',
      '駐車場あり',
      'ペット可',
    ],
    summaries: [
      '駅から平坦な道で、共用部の管理も行き届いています。まず借りて住み心地を確かめてからの購入にも対応します。',
      '最上階の角住戸で採光良好。管理費・修繕積立金の履歴を開示できます。',
      '室内はフルリノベーション済み。設備の保証書一式をお渡しします。',
    ],
  },
  {
    prefix: 'hse',
    category: '戸建',
    image: '/properties/house.svg',
    names: [
      '南向き中古戸建',
      '新築分譲住宅',
      'ガレージ付戸建',
      '二世帯向け戸建',
      '庭付き一戸建て',
    ],
    zonings: [
      '第一種低層住居専用地域',
      '第二種低層住居専用地域',
      '第一種住居地域',
      '準住居地域',
    ],
    layouts: ['2LDK', '3LDK', '4LDK以上'],
    floorArea: [78, 168],
    salePrice: [24_000_000, 98_000_000],
    rentPerMonth: [110_000, 380_000],
    tags: [
      '駐車場2台',
      '庭あり',
      '耐震基準適合',
      '角地',
      'リフォーム済',
      '南向き',
    ],
    summaries: [
      '前面道路が広く駐車しやすい区画です。定期借家での貸し出しにも対応します。',
      '直近で外壁と屋根を塗装済み。点検記録をそのままお渡しします。',
      '生活動線がまとまった間取りで、庭は家庭菜園にも使えます。',
    ],
  },
  {
    prefix: 'lnd',
    category: '土地',
    image: '/properties/land.svg',
    names: ['売地（整形地）', '建築条件なし売地', '角地の売地', '分譲区画'],
    zonings: [
      '第一種低層住居専用地域',
      '第一種住居地域',
      '準住居地域',
      '準工業地域',
    ],
    layouts: [],
    floorArea: [95, 460],
    salePrice: [8_000_000, 72_000_000],
    rentPerMonth: [60_000, 260_000],
    tags: ['整形地', '上水道引込済', '更地渡し', '角地', '建築条件なし'],
    summaries: [
      '측量済みの整形地で、境界も明示できます。上下水道は前面道路に敷設済みです。',
      '建築条件はありません。プランの相談から一緒に進められます。',
      '駐車場や資材置き場としての一時利用のご相談にも応じます。',
    ],
  },
  {
    prefix: 'cml',
    category: '事業用',
    image: '/properties/commercial.svg',
    names: ['1階路面店舗', '事務所区画', '倉庫付事業用物件', 'ビル1棟'],
    zonings: ['近隣商業地域', '商業地域', '準工業地域', '準住居地域'],
    layouts: ['1R', '1K'],
    floorArea: [42, 380],
    salePrice: [32_000_000, 420_000_000],
    rentPerMonth: [180_000, 1_400_000],
    tags: [
      '居抜き',
      '前面道路広い',
      '荷捌きスペースあり',
      '24時間利用可',
      'エレベーターあり',
    ],
    summaries: [
      '視認性の高い路面区画です。内装は居抜きのままお引き渡しできます。',
      '幹線道路沿いで搬入がしやすく、事務所と倉庫を一体で使えます。',
      '定期借家での契約に対応します。用途のご相談は早めにお願いします。',
    ],
  },
]

type Location = { prefecture: string; city: string; station: string }

const locations: Location[] = [
  {
    prefecture: '北海道',
    city: '札幌市中央区',
    station: '地下鉄南北線 大通駅',
  },
  { prefecture: '宮城県', city: '仙台市青葉区', station: 'JR仙山線 北仙台駅' },
  {
    prefecture: '埼玉県',
    city: 'さいたま市浦和区',
    station: 'JR京浜東北線 浦和駅',
  },
  { prefecture: '千葉県', city: '船橋市', station: 'JR総武線 船橋駅' },
  { prefecture: '東京都', city: '世田谷区', station: '小田急線 経堂駅' },
  { prefecture: '東京都', city: '杉並区', station: 'JR中央線 荻窪駅' },
  {
    prefecture: '東京都',
    city: '江東区',
    station: '東京メトロ東西線 門前仲町駅',
  },
  {
    prefecture: '神奈川県',
    city: '横浜市港北区',
    station: '東急東横線 綱島駅',
  },
  {
    prefecture: '神奈川県',
    city: '川崎市中原区',
    station: 'JR南武線 武蔵中原駅',
  },
  {
    prefecture: '愛知県',
    city: '名古屋市千種区',
    station: '地下鉄東山線 今池駅',
  },
  { prefecture: '京都府', city: '京都市中京区', station: '阪急京都線 烏丸駅' },
  { prefecture: '大阪府', city: '大阪市北区', station: 'JR大阪環状線 天満駅' },
  { prefecture: '大阪府', city: '豊中市', station: '阪急宝塚線 曽根駅' },
  { prefecture: '兵庫県', city: '神戸市東灘区', station: 'JR神戸線 住吉駅' },
  { prefecture: '広島県', city: '広島市中区', station: '広電本線 八丁堀駅' },
  {
    prefecture: '福岡県',
    city: '福岡市中央区',
    station: '地下鉄空港線 赤坂駅',
  },
  { prefecture: '静岡県', city: '静岡市葵区', station: 'JR東海道線 静岡駅' },
  { prefecture: '長野県', city: '長野市', station: 'JR信越線 長野駅' },
]

type SeededSeller = { seller: Listing['seller']; ownerUserId: string }

const sellers: SeededSeller[] = [
  ['nakamura-estate', '中村不動産', '宅建業者', 4.8, 34],
  ['sato-jutaku', '佐藤住宅', '宅建業者', 4.6, 58],
  ['tamura', '田村さん', '個人', 4.9, 21],
  ['kobayashi-kanri', '小林管理', '管理会社', 4.7, 12],
  ['sky-realty', 'スカイリアルティ', '法人', 4.5, 27],
  ['minato-chintai', 'みなと賃貸', '宅建業者', 4.4, 41],
  ['takahashi', '高橋さん', '個人', 4.3, 9],
  ['yamada-jisho', '山田地所', '法人', 4.7, 63],
  ['midori-kanri', 'みどり管理', '管理会社', 4.5, 88],
  ['watanabe', '渡辺さん', '個人', 5.0, 4],
].map(([ownerUserId, name, kind, rating, reviews]) => ({
  ownerUserId: ownerUserId as string,
  seller: {
    name: name as string,
    kind: kind as Listing['seller']['kind'],
    rating: rating as number,
    reviews: reviews as number,
  },
}))

/** Deterministic pseudo-random sequence so the sample data is stable. */
function createSequence(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

function roundTo(value: number, unit: number): number {
  return Math.round(value / unit) * unit
}

/** Generated purchase-option listings credit half the rent, capped at 30% of the price. */
function purchaseOptionTerms(
  purchaseOption: boolean,
  salePrice: number | undefined,
): Pick<
  Listing,
  'purchaseOption' | 'purchaseOptionCreditRate' | 'purchaseOptionCreditCap'
> {
  if (!purchaseOption || salePrice === undefined) return { purchaseOption }
  return {
    purchaseOption,
    purchaseOptionCreditRate: 50,
    purchaseOptionCreditCap: roundTo(salePrice * 0.3, 10_000),
  }
}

export function generateListings(count: number, startId: number): Listing[] {
  const next = createSequence(20_260_913)
  const pick = <T>(values: T[]): T => values[Math.floor(next() * values.length)]
  const between = (range: [number, number]) =>
    range[0] + next() * (range[1] - range[0])

  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length]
    const number = startId + index
    const location = pick(locations)
    const layout =
      template.layouts.length > 0 ? pick(template.layouts) : undefined
    const stem = pick(template.names)
    const deals: Listing['deals'] =
      next() < 0.15 ? ['sale'] : next() < 0.2 ? ['rent'] : ['sale', 'rent']
    const canRent = deals.includes('rent')
    const rentPerMonth = canRent
      ? roundTo(between(template.rentPerMonth), 1_000)
      : undefined
    const salePrice = deals.includes('sale')
      ? roundTo(between(template.salePrice), 100_000)
      : undefined
    const tags = [...new Set([pick(template.tags), pick(template.tags)])]

    return {
      id: `${template.prefix}-${String(number).padStart(3, '0')}`,
      name: layout
        ? `${stem} ${location.city} ${layout}`
        : `${stem} ${location.city}`,
      category: template.category,
      zoning: pick(template.zonings),
      layout,
      floorArea: roundTo(between(template.floorArea), 0.05),
      builtYear:
        layout === undefined ? undefined : 1998 + Math.floor(next() * 27),
      nearestStation: location.station,
      walkMinutes: 1 + Math.floor(next() * 18),
      prefecture: location.prefecture,
      city: location.city,
      image: template.image,
      summary: pick(template.summaries),
      deals,
      salePrice,
      rentPerMonth,
      depositMonths: canRent ? Math.floor(next() * 3) : undefined,
      keyMoneyMonths: canRent ? Math.floor(next() * 2) : undefined,
      leaseType: canRent
        ? next() < 0.25
          ? ('定期借家' as const)
          : ('普通借家' as const)
        : undefined,
      ...purchaseOptionTerms(deals.length === 2 && next() < 0.6, salePrice),
      ...pick(sellers),
      tags,
    }
  })
}
