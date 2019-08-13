

export async function doesUserHavePermission(userId: string, permission: string): Promise<boolean> {
   
  if (!userId) {
    return false;
  }

  // TODO: Use the redis npm package to ask a redis instance for user permissions.
  return true;

}