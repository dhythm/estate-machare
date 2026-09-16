import 'server-only'
import type { Listing } from '@/lib/data'

const templates = [
  {
    category: 'マンション',
    image: 'apartment',
    name: '光と風が通う、南向きの住まい',
    floorPlan: '2LDK',
    areaSqm: 68,
    price: 42800000,
    rent: 168000,
    access: '最寄り駅 徒歩8分',
    tags: ['南向き', '角部屋', 'オートロック'],
  },
  {
    category: '戸建て',
    image: 'house',
    name: '庭とともに暮らす、ゆとりの一戸建て',
    floorPlan: '4LDK',
    areaSqm: 112,
    price: 53800000,
    rent: 215000,
    access: '最寄り駅 徒歩12分',
    tags: ['庭付き', '駐車場あり', '収納充実'],
  },
  {
    category: '土地',
    image: 'land',
    name: '家づくりの夢が広がる、整形地',
    floorPlan: '土地',
    areaSqm: 165,
    price: 29800000,
    rent: 95000,
    access: '最寄り駅 徒歩15分',
    tags: ['建築条件なし', '整形地', '南道路'],
  },
  {
    category: 'オフィス',
    image: 'office',
    name: '働く時間が心地よい、明るいオフィス',
    floorPlan: 'ワンフロア',
    areaSqm: 85,
    price: 65000000,
    rent: 285000,
    access: '最寄り駅 徒歩3分',
    tags: ['駅近', '個別空調', 'エレベーター'],
  },
  {
    category: '店舗',
    image: 'shop',
    name: '街とつながる、路面の店舗スペース',
    floorPlan: '1フロア',
    areaSqm: 54,
    price: 34800000,
    rent: 198000,
    access: '最寄り駅 徒歩5分',
    tags: ['路面店', '角地', 'スケルトン'],
  },
]
const locations = [
  ['東京都', '世田谷区'],
  ['神奈川県', '鎌倉市'],
  ['千葉県', '流山市'],
  ['東京都', '目黒区'],
  ['神奈川県', '横浜市青葉区'],
  ['埼玉県', 'さいたま市浦和区'],
]

/** Fictional, deterministic properties for demonstration. No equipment values are reinterpreted. */
export function generateListings(count: number, startId: number): Listing[] {
  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length]
    const [prefecture, city] = locations[index % locations.length]
    const deals: Listing['deals'] =
      index % 3 === 0 ? ['sale', 'rent'] : index % 3 === 1 ? ['rent'] : ['sale']
    return {
      id: `property-${String(startId + index).padStart(3, '0')}`,
      name: template.name,
      category: template.category,
      maker: '',
      year: 2018 + (index % 7),
      hours: 0,
      condition: '目立った傷なし',
      prefecture,
      city,
      image: `/properties/${template.image}.webp`,
      property: {
        areaSqm: template.areaSqm + (index % 4) * 3,
        floorPlan: template.floorPlan,
        builtYear:
          template.category === '土地' ? undefined : 2018 + (index % 7),
        monthlyRent: deals.includes('rent')
          ? template.rent + (index % 4) * 5000
          : undefined,
        access: template.access,
      },
      summary: `${city}の${template.category}。${template.tags.join('・')}の条件を備えた物件です。内見日程や入居時期、契約条件は掲載者へお問い合わせください。`,
      deals,
      salePrice: deals.includes('sale')
        ? template.price + (index % 4) * 1000000
        : undefined,
      rentToOwn: false,
      seller: {
        name: 'まちの不動産',
        kind: '不動産会社',
        rating: 4.8,
        reviews: 12,
      },
      ownerUserId: 'demo-seller',
      tags: template.tags,
    }
  })
}
