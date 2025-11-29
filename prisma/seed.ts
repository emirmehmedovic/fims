import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash password: Admin123!
  const passwordHash = await hash('Admin123!', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fims.local' },
    update: {},
    create: {
      id: 'clx_admin_default',
      email: 'admin@fims.local',
      passwordHash,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create sample warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: {},
    create: {
      code: 'WH-001',
      name: 'Glavni rezervoar',
      location: 'Hotonj bb, 71320 Vogošća',
      capacity: 50000,
      description: 'Glavni rezervoar za skladištenje goriva',
      isActive: true,
    },
  })

  console.log('✅ Warehouse created:', warehouse.name)

  // Assign admin to warehouse
  await prisma.userWarehouse.upsert({
    where: {
      userId_warehouseId: {
        userId: admin.id,
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      warehouseId: warehouse.id,
    },
  })

  console.log('✅ Admin assigned to warehouse')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
