export const CHURCH_INFO = {
  name: "Assemblies of God Church, Wuse Zone 5",
  shortName: "AG Wuse",
  aka: "Assemblies of God International Gospel Centre, Wuse-Abuja",
  tagline: "Center of Love and Worship",
  address: "53, Accra Street, Wuse Zone 5, Abuja, Nigeria",
  phones: ["0803 591 0333", "0807 226 9401", "0803 787 1278"],
  email: "info@agwuse.org",
  website: "https://agwuse.org",
  bankName: "Zenith International Bank",
  bankAccount: "1010327196",
  facebook: [
    "AG Wuse Abuja",
    "AGC International Gospel Centre Wuse-Abuja",
  ],
} as const;

export const USER_ROLES = {
  VISITOR: "VISITOR",
  MEMBER: "MEMBER",
  DEPT_LEAD: "DEPT_LEAD",
  FINANCE: "FINANCE",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  VISITOR: "Visitor",
  MEMBER: "Member",
  DEPT_LEAD: "Department Lead",
  FINANCE: "Finance Officer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export const WEEKLY_ACTIVITIES = [
  { day: "Sunday", activity: "Main Service / Sunday School", time: "8:00 AM" },
  { day: "Monday", activity: "New Believers Class", time: "6:00 PM" },
  { day: "Tuesday", activity: "Bible Study", time: "6:00 PM" },
  { day: "Wednesday", activity: "Prayer Meeting", time: "6:00 PM" },
  { day: "Friday", activity: "Sunday Preparatory Meeting", time: "6:00 PM" },
] as const;

export const TRANSACTION_TYPES = {
  TITHE: "TITHE",
  OFFERING: "OFFERING",
  DONATION: "DONATION",
  PLEDGE_PAYMENT: "PLEDGE_PAYMENT",
  EXPENSE: "EXPENSE",
} as const;

export const OFFERING_CATEGORIES = {
  GENERAL: "GENERAL",
  SPECIAL: "SPECIAL",
  MISSION: "MISSION",
  BUILDING_FUND: "BUILDING_FUND",
  WELFARE: "WELFARE",
  THANKSGIVING: "THANKSGIVING",
  HARVEST: "HARVEST",
  FIRST_FRUIT: "FIRST_FRUIT",
  OTHER: "OTHER",
} as const;

export const PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  POS: "POS",
  MOBILE_MONEY: "MOBILE_MONEY",
  ONLINE: "ONLINE",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  POS: "POS",
  MOBILE_MONEY: "Mobile Money",
  ONLINE: "Online (Paystack)",
};

export const DEPARTMENT_CATEGORIES = {
  MINISTRY: "MINISTRY",
  COMMITTEE: "COMMITTEE",
  CHOIR: "CHOIR",
  OUTREACH: "OUTREACH",
} as const;

export const NAV_ITEMS = {
  public: [
    { label: "Home", href: "/" },
    {
      label: "About",
      children: [
        { label: "About / Beliefs", href: "/about" },
        { label: "Ministers", href: "/ministers" },
        { label: "Church Board", href: "/board" },
      ],
    },
    {
      label: "Ministries",
      children: [
        { label: "Departments", href: "/departments" },
        { label: "Weekly Activities", href: "/activities" },
      ],
    },
    {
      label: "Media",
      children: [
        { label: "Blog / News", href: "/blog" },
        { label: "Sermons", href: "/sermons" },
        { label: "Gallery", href: "/gallery" },
        { label: "Live Stream", href: "/live" },
      ],
    },
    {
      label: "Connect",
      children: [
        { label: "Events", href: "/events" },
        { label: "Announcements", href: "/announcements" },
        { label: "Prayer Request", href: "/prayer-request" },
        { label: "Share Testimony", href: "/testimony" },
        { label: "Join Us", href: "/join" },
        { label: "Contact", href: "/contact" },
      ],
    },
    { label: "Give", href: "/give" },
  ],
  member: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "My Giving", href: "/my-giving", icon: "Heart" },
    { label: "Directory", href: "/directory", icon: "Users" },
    { label: "Profile", href: "/profile", icon: "UserCog" },
  ],
  finance: [
    { label: "Finance Dashboard", href: "/finance", icon: "BarChart3" },
    { label: "Record Transaction", href: "/finance/record", icon: "PlusCircle" },
    { label: "Reports", href: "/finance/reports", icon: "FileText" },
  ],
  admin: [
    { label: "Admin Dashboard", href: "/admin", icon: "Shield" },
    { label: "Users", href: "/admin/users", icon: "Users" },
    { label: "Finance", href: "/admin/finance", icon: "Wallet" },
    { label: "Content", href: "/admin/content/blog", icon: "FileEdit" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ],
} as const;
