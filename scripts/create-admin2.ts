import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creating Second Admin Account')
  console.log('=================================')

  const ADMIN_EMAIL = 'admin2@fims.local'
  const ADMIN_PASSWORD = 'Admin123!'

  console.log(`📧 Email: ${ADMIN_EMAIL}`)
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
  console.log('')

  // Hash password
  console.log('⏳ Hashing password...')
  const passwordHash = await hash(ADMIN_PASSWORD, 10)

  // Create admin user
  console.log('⏳ Creating admin user...')
  const admin = await prisma.user.create({
    data: {
      id: 'clx_admin_second',
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Second Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('')
  console.log('✅ SECOND ADMIN CREATED!')
  console.log('=================================')
  console.log(`📧 Email: ${admin.email}`)
  console.log(`👤 Name: ${admin.name}`)
  console.log(`🔐 Role: ${admin.role}`)
  console.log(`✔️  Active: ${admin.isActive}`)
  console.log('')
  console.log('🔐 LOGIN CREDENTIALS:')
  console.log(`   Email: ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log('=================================')
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
