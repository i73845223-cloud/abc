import { currentUser } from '@/lib/auth'
import ProfileClient from '../_components/profile-client'
import { redirect } from 'next/navigation'

const Profile = async () => {
  const user = await currentUser()

  if (!user) {
    redirect('/login')
  }

  const transformedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image?.url || null,
    isImageApproved: user.isImageApproved === 'success',
    role: user.role,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    isBlocked: user.isBlocked,
    isChatBlocked: user.isChatBlocked
  }

  return <ProfileClient user={transformedUser} />
}

export default Profile