import { getCurrentUser } from '@/lib/auth';
import { getAccessibleFeatures } from '@/lib/permissions';
import AdminSidebar from './index';

export default async function SidebarWrapper() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const accessibleFeatures = getAccessibleFeatures(user);

  return <AdminSidebar accessibleFeatures={accessibleFeatures} user={user} />;
}
