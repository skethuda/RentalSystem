import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Wrapper for lazy components
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const Home = lazy(() => import('../pages/home/page'));
const PropertyDetail = lazy(() => import('../pages/property-detail/page'));
const SearchPage = lazy(() => import('../pages/search/page'));
const ProfilePage = lazy(() => import('../pages/profile/page'));
const SupplierApplication = lazy(() => import('../pages/supplier-application/page'));
const ReviewsPage = lazy(() => import('../pages/reviews/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Admin Pages
const AdminLogin = lazy(() => import('../pages/admin/login/page'));
const AdminDashboard = lazy(() => import('../pages/admin/dashboard/page'));
const AdminProperties = lazy(() => import('../pages/admin/properties/page'));
const AdminPropertiesNew = lazy(() => import('../pages/admin/properties/new/page'));
const AdminBookings = lazy(() => import('../pages/admin/bookings/page'));
const AdminBookingCalendar = lazy(() => import('../pages/admin/booking-calendar/page'));
const AdminReviews = lazy(() => import('../pages/admin/reviews/page'));
const AdminSiteReviews = lazy(() => import('../pages/admin/site-reviews/page'));
const AdminAmenities = lazy(() => import('../pages/admin/amenities/page'));
const AdminUsers = lazy(() => import('../pages/admin/users/page'));
const AdminSupplierApplications = lazy(() => import('../pages/admin/supplier-applications/page'));
const AdminExpenses = lazy(() => import('../pages/admin/expenses/page'));
const AdminSettings = lazy(() => import('../pages/admin/settings/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(Home),
  },
  {
    path: '/property/:id',
    element: withSuspense(PropertyDetail),
  },
  {
    path: '/search',
    element: withSuspense(SearchPage),
  },
  {
    path: '/profile',
    element: withSuspense(ProfilePage),
  },
  {
    path: '/supplier-application',
    element: withSuspense(SupplierApplication),
  },
  {
    path: '/reviews',
    element: withSuspense(ReviewsPage),
  },
  // Admin Routes
  {
    path: '/admin/login',
    element: withSuspense(AdminLogin),
  },
  {
    path: '/admin/dashboard',
    element: withSuspense(AdminDashboard),
  },
  {
    path: '/admin/properties',
    element: withSuspense(AdminProperties),
  },
  {
    path: '/admin/properties/new',
    element: withSuspense(AdminPropertiesNew),
  },
  {
    path: '/admin/properties/edit/:id',
    element: withSuspense(AdminPropertiesNew),
  },
  {
    path: '/admin/bookings',
    element: withSuspense(AdminBookings),
  },
  {
    path: '/admin/booking-calendar',
    element: withSuspense(AdminBookingCalendar),
  },
  {
    path: '/admin/reviews',
    element: withSuspense(AdminReviews),
  },
  {
    path: '/admin/site-reviews',
    element: withSuspense(AdminSiteReviews),
  },
  {
    path: '/admin/amenities',
    element: withSuspense(AdminAmenities),
  },
  {
    path: '/admin/users',
    element: withSuspense(AdminUsers),
  },
  {
    path: '/admin/supplier-applications',
    element: withSuspense(AdminSupplierApplications),
  },
  {
    path: '/admin/expenses',
    element: withSuspense(AdminExpenses),
  },
  {
    path: '/admin/settings',
    element: withSuspense(AdminSettings),
  },
  {
    path: '*',
    element: withSuspense(NotFound),
  },
];

export default routes;
