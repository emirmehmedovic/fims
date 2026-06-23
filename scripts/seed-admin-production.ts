import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Production Admin Seed Script')
  console.log('=================================')

  // PRODUCTION ADMIN CREDENTIALS
  const ADMIN_EMAIL = 'admin@fims.local'
  const ADMIN_PASSWORD = 'Admin123!'  // ⚠️ Change this after first login!

  console.log(`📧 Email: ${ADMIN_EMAIL}`)
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
  console.log('')

  // Hash password
  console.log('⏳ Hashing password...')
  const passwordHash = await hash(ADMIN_PASSWORD, 10)

  // Create or update admin user (idempotent)
  console.log('⏳ Creating/updating admin user...')
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,  // Update password even if user exists
      isActive: true, // Ensure active
      role: 'SUPER_ADMIN', // Ensure SUPER_ADMIN
    },
    create: {
      id: 'clx_admin_default',
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('')
  console.log('✅ ADMIN USER READY!')
  console.log('=================================')
  console.log(`📧 Email: ${admin.email}`)
  console.log(`👤 Name: ${admin.name}`)
  console.log(`🔐 Role: ${admin.role}`)
  console.log(`✔️  Active: ${admin.isActive}`)
  console.log('')
  console.log('🔐 LOGIN CREDENTIALS:')
  console.log(`   Email: ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log('')
  console.log('⚠️  IMPORTANT: Change password after first login!')
  console.log('=================================')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
