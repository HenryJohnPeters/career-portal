/**
 * The signed-in app shell (sidebar, user menu, plan usage) is its own chunk,
 * so landing-page visitors don't download it. ProtectedRoute starts loading
 * it while the account loads, so /app pages don't wait for it afterwards.
 */
export const loadDashboardLayout = () => import("./DashboardLayout");
