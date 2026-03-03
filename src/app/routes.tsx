import { createBrowserRouter, redirect } from "react-router";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { DriversManagement } from "./components/admin/DriversManagement";
import { UsersManagement } from "./components/admin/UsersManagement";
import { TripsManagement } from "./components/admin/TripsManagement";
import { DocumentVerification } from "./components/admin/DocumentVerification";
import { Analytics } from "./components/admin/Analytics";
import { Reviews } from "./components/admin/Reviews";
import { Settings } from "./components/admin/Settings";
import { Welcome } from "./components/Welcome";
import { RoleSelect } from "./components/RoleSelect";
import { Login } from "./components/Login";
import { EmailAuth } from "./components/EmailAuth";
import { DriverRegistrationForm } from "./components/DriverRegistrationForm";
import { SenderRegistrationForm } from "./components/SenderRegistrationForm";
import { MobileLayout } from "./components/MobileLayout";
import { Home } from "./components/ClientDashboard";
import { SearchPage } from "./components/SearchPage";
import { SearchResults } from "./components/SearchResults";
import { TripDetail } from "./components/TripDetail";
import { TripsPage } from "./components/TripsPage";
import { TrackingPage } from "./components/TrackingPage";
import { MessagesPage } from "./components/MessagesPage";
import { ProfilePage } from "./components/ProfilePage";
import { EditProfile } from "./components/EditProfile";
import { NotificationsPage } from "./components/NotificationsPage";
import { PaymentHistory } from "./components/PaymentHistory";
import { ReviewsPage } from "./components/ReviewsPage";
import { DocumentVerificationPage } from "./components/DocumentVerificationPage";

export const router = createBrowserRouter([
  // Welcome & Auth routes
  {
    path: "/",
    Component: Welcome,
  },
  {
    path: "/welcome",
    Component: Welcome,
  },
  {
    path: "/role-select",
    Component: RoleSelect,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/email-auth",
    Component: EmailAuth,
  },
  {
    path: "/driver-registration-form",
    Component: DriverRegistrationForm,
  },
  {
    path: "/sender-registration-form",
    Component: SenderRegistrationForm,
  },
  // Client Mobile App routes
  {
    path: "/",
    Component: MobileLayout,
    children: [
      { path: "dashboard", Component: Home },
      { path: "search", Component: SearchPage },
      { path: "search-results", Component: SearchResults },
      { path: "trip/:id", Component: TripDetail },
      { path: "trips", Component: TripsPage },
      { path: "tracking", Component: TrackingPage },
      { path: "messages", Component: MessagesPage },
      { path: "profile", Component: ProfilePage },
      { path: "profile/edit", Component: EditProfile },
      { path: "notifications", Component: NotificationsPage },
      { path: "payments", Component: PaymentHistory },
      { path: "reviews", Component: ReviewsPage },
      { path: "documents", Component: DocumentVerificationPage },
    ],
  },
  // Admin Panel routes
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "drivers", Component: DriversManagement },
      { path: "users", Component: UsersManagement },
      { path: "trips", Component: TripsManagement },
      { path: "verification", Component: DocumentVerification },
      { path: "analytics", Component: Analytics },
      { path: "reviews", Component: Reviews },
      { path: "settings", Component: Settings },
    ],
  },
  // Catch all other routes
  {
    path: "*",
    loader: () => redirect("/")
  }
]);