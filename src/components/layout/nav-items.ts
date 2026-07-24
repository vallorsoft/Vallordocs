import {
  BarChart3,
  Building2,
  Cpu,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Truck,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS } from '@/modules/auth/rbac';

/**
 * Admin navigation catalogue (PRD 4. fejezet – Admin menü).
 *
 * The single source of truth for the sidebar. Each item names its route, its
 * `nav.*` translation key and the RBAC permission required to see it — items the
 * caller lacks permission for are hidden (defence in depth over the server-side
 * checks, never a substitute for them). `permission: null` means every
 * authenticated user may see it (e.g. their own profile).
 */
export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  permission: string | null;
}

export const ADMIN_NAV: NavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.DOCUMENT_READ,
  },
  {
    href: '/trips',
    labelKey: 'nav.trips',
    icon: Truck,
    permission: PERMISSIONS.TRIP_READ,
  },
  {
    href: '/documents',
    labelKey: 'nav.documents',
    icon: FileText,
    permission: PERMISSIONS.DOCUMENT_READ,
  },
  {
    href: '/drivers',
    labelKey: 'nav.drivers',
    icon: Users,
    permission: PERMISSIONS.DRIVER_READ,
  },
  {
    href: '/users',
    labelKey: 'nav.users',
    icon: UserCog,
    permission: PERMISSIONS.USER_MANAGE,
  },
  {
    href: '/tenant',
    labelKey: 'nav.tenant',
    icon: Building2,
    permission: PERMISSIONS.TENANT_MANAGE,
  },
  {
    href: '/ai-queue',
    labelKey: 'nav.aiQueue',
    icon: Cpu,
    permission: PERMISSIONS.AI_EXECUTE,
  },
  {
    href: '/audit',
    labelKey: 'nav.audit',
    icon: ShieldCheck,
    permission: PERMISSIONS.AUDIT_READ,
  },
  {
    href: '/reports',
    labelKey: 'nav.reports',
    icon: BarChart3,
    permission: PERMISSIONS.DOCUMENT_READ,
  },
  {
    href: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
  {
    href: '/profile',
    labelKey: 'nav.profile',
    icon: User,
    permission: null,
  },
  // Super-admin console — a distinct, platform-level menu entry visible only to
  // holders of `platform.manage` (the platform_owner / platform_admin roles).
  {
    href: '/superadmin',
    labelKey: 'nav.superadmin',
    icon: ShieldAlert,
    permission: PERMISSIONS.PLATFORM_MANAGE,
  },
];
