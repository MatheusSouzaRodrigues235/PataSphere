const demoRoleKey = 'patasphere:demo-role';

export function readDemoRole() {
  const role = sessionStorage.getItem(demoRoleKey);
  return role === 'tutor' || role === 'ong' ? role : null;
}

export function startDemoRole(role) {
  sessionStorage.setItem(demoRoleKey, role);
}

export function clearDemoRole() {
  sessionStorage.removeItem(demoRoleKey);
}
