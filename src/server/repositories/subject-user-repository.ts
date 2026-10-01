import { GlideRecordSecure } from '@servicenow/glide';

export interface SubjectUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function findSubjectUser(userId: string): SubjectUser | null {
  if (!userId) {
    return null;
  }

  const user = new GlideRecordSecure('sys_user');
  if (!user.get(userId)) {
    return null;
  }

  return {
    userId: user.getUniqueValue(),
    firstName: user.getValue('first_name') || '',
    lastName: user.getValue('last_name') || '',
    email: user.getValue('email') || '',
  };
}
