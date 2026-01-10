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
    case 'SEC': // Legacy SEC role support
      return '/canvasser/home';
    case 'SAMSUNG_ADMINISTRATOR':
      return '/Samsung-Administrator';
    case 'ZOPPER_ADMINISTRATOR':
      return '/Zopper-Administrator';
    default:
      return '/login/canvasser';
  }
}
