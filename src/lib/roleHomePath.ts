export const VALID_ROLES = ['ABM', 'ASE', 'ZSM', 'ZSE', 'CANVASSER', 'SAMSUNG_ADMINISTRATOR', 'ZOPPER_ADMINISTRATOR'];

export function getHomePathForRole(role: string): string {
  switch (role) {
    case 'ABM':
      return '/ABM';
    case 'ASE':
      return '/ASE';
    case 'ZSM':
      return '/ZSM';
    case 'ZSE':
      return '/ZSE';
    case 'CANVASSER':
      return '/canvasser/home';
    case 'SAMSUNG_ADMINISTRATOR':
      return '/Samsung-Administrator';
    case 'ZOPPER_ADMINISTRATOR':
      return '/Zopper-Administrator';
    default:
      return '/login/canvasser';
  }
}
