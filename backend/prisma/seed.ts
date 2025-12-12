import { PrismaClient, ObjectCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Object Types - Furniture
  const furnitureTypes = [
    { name: 'bed', nameKo: '침대', nameEn: 'Bed', nameJa: 'ベッド', nameZh: '床', icon: '🛏️' },
    { name: 'sofa', nameKo: '소파', nameEn: 'Sofa', nameJa: 'ソファ', nameZh: '沙发', icon: '🛋️' },
    { name: 'chair', nameKo: '의자', nameEn: 'Chair', nameJa: '椅子', nameZh: '椅子', icon: '🪑' },
    { name: 'desk', nameKo: '책상', nameEn: 'Desk', nameJa: '机', nameZh: '书桌', icon: '🪵' },
    {
      name: 'wardrobe',
      nameKo: '옷장',
      nameEn: 'Wardrobe',
      nameJa: 'ワードローブ',
      nameZh: '衣柜',
      icon: '🚪',
    },
    {
      name: 'table',
      nameKo: '테이블',
      nameEn: 'Table',
      nameJa: 'テーブル',
      nameZh: '桌子',
      icon: '🪑',
    },
    {
      name: 'bookshelf',
      nameKo: '책장',
      nameEn: 'Bookshelf',
      nameJa: '本棚',
      nameZh: '书架',
      icon: '📚',
    },
  ];

  // Object Types - Appliance
  const applianceTypes = [
    {
      name: 'washer',
      nameKo: '세탁기',
      nameEn: 'Washing Machine',
      nameJa: '洗濯機',
      nameZh: '洗衣机',
      icon: '🧺',
    },
    {
      name: 'refrigerator',
      nameKo: '냉장고',
      nameEn: 'Refrigerator',
      nameJa: '冷蔵庫',
      nameZh: '冰箱',
      icon: '🧊',
    },
    {
      name: 'aircon',
      nameKo: '에어컨',
      nameEn: 'Air Conditioner',
      nameJa: 'エアコン',
      nameZh: '空调',
      icon: '❄️',
    },
    { name: 'tv', nameKo: 'TV', nameEn: 'TV', nameJa: 'テレビ', nameZh: '电视', icon: '📺' },
    {
      name: 'microwave',
      nameKo: '전자레인지',
      nameEn: 'Microwave',
      nameJa: '電子レンジ',
      nameZh: '微波炉',
      icon: '📻',
    },
    {
      name: 'dryer',
      nameKo: '건조기',
      nameEn: 'Dryer',
      nameJa: '乾燥機',
      nameZh: '烘干机',
      icon: '💨',
    },
  ];

  // Object Types - Facility
  const facilityTypes = [
    {
      name: 'bathroom',
      nameKo: '욕실',
      nameEn: 'Bathroom',
      nameJa: 'バスルーム',
      nameZh: '浴室',
      icon: '🛁',
    },
    {
      name: 'shower',
      nameKo: '샤워기',
      nameEn: 'Shower',
      nameJa: 'シャワー',
      nameZh: '淋浴',
      icon: '🚿',
    },
    { name: 'sink', nameKo: '세면대', nameEn: 'Sink', nameJa: '洗面台', nameZh: '洗手台', icon: '🚰' },
    {
      name: 'toilet',
      nameKo: '화장실',
      nameEn: 'Toilet',
      nameJa: 'トイレ',
      nameZh: '厕所',
      icon: '🚽',
    },
    {
      name: 'kitchen',
      nameKo: '주방',
      nameEn: 'Kitchen',
      nameJa: 'キッチン',
      nameZh: '厨房',
      icon: '🍳',
    },
    { name: 'window', nameKo: '창문', nameEn: 'Window', nameJa: '窓', nameZh: '窗户', icon: '🪟' },
    { name: 'door', nameKo: '문', nameEn: 'Door', nameJa: 'ドア', nameZh: '门', icon: '🚪' },
  ];

  // Object Types - Other
  const otherTypes = [
    { name: 'plant', nameKo: '화분', nameEn: 'Plant', nameJa: '植物', nameZh: '植物', icon: '🪴' },
    { name: 'lamp', nameKo: '조명', nameEn: 'Lamp', nameJa: 'ランプ', nameZh: '灯', icon: '💡' },
    { name: 'mirror', nameKo: '거울', nameEn: 'Mirror', nameJa: '鏡', nameZh: '镜子', icon: '🪞' },
  ];

  const createObjectTypes = async (
    types: Array<{
      name: string;
      nameKo: string;
      nameEn: string;
      nameJa: string;
      nameZh: string;
      icon: string;
    }>,
    category: ObjectCategory
  ) => {
    for (const type of types) {
      await prisma.objectType.upsert({
        where: { name: type.name },
        update: {},
        create: {
          name: type.name,
          nameKo: type.nameKo,
          nameEn: type.nameEn,
          nameJa: type.nameJa,
          nameZh: type.nameZh,
          category,
          icon: type.icon,
          isSystem: true,
        },
      });
    }
  };

  await createObjectTypes(furnitureTypes, ObjectCategory.furniture);
  await createObjectTypes(applianceTypes, ObjectCategory.appliance);
  await createObjectTypes(facilityTypes, ObjectCategory.facility);
  await createObjectTypes(otherTypes, ObjectCategory.other);

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
