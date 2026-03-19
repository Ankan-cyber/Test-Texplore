import { type User } from '@/lib/auth';
import { ServiceError } from '@/lib/services/service-error';
import { isAdminLike } from './common-policy';

type GalleryImagePolicyResource = {
  uploadedBy: string;
};

export function assertCanManageGalleryImage(
  user: User,
  image: GalleryImagePolicyResource,
) {
  if (isAdminLike(user)) {
    return;
  }

  if (image.uploadedBy !== user.id) {
    throw new ServiceError('Access denied', 403);
  }
}
