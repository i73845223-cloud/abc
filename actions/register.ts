"use server"

import { db } from '@/lib/db';
import * as z from 'zod'
import bcrypt from 'bcryptjs'

import { RegisterSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';

export const register = async (
  values: z.infer<typeof RegisterSchema>,
  ref?: string | null
) => {
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' }
  }

  const { email, password, name } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    return { error: 'Email already in use' }
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })

  if (ref) {
    const promoCode = await db.promoCode.findFirst({
      where: {
        code: ref,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ],
      },
    })

    if (promoCode) {
      if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        console.warn("Promo code max uses reached")
      } else {
        await db.userPromoCode.create({
          data: {
            userId: user.id,
            promoCodeId: promoCode.id,
            timesUsed: 1,
            lastUsedAt: new Date(),
          },
        })

        await db.promoCode.update({
          where: { id: promoCode.id },
          data: { currentUses: { increment: 1 } },
        })
      }
    }
  }

  const verificationToken = await generateVerificationToken(email)
  await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
  )

  return { success: 'Confirmation email sent!' }
}