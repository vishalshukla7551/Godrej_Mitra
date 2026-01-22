export const VALID_ROLES = ['CANVASSER', 'ZOPPER_ADMINISTRATOR'];

export function getHomePathForRole(role: string): string {
  switch (role) {
    case 'CANVASSER':
      return '/canvasser/home';
    case 'ZOPPER_ADMINISTRATOR':
      return '/Zopper-Administrator';
    default:
      return '/login/canvasser';
  }
}
