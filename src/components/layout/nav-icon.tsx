import {
  Boxes,
  Building,
  CalendarDays,
  ChartColumn,
  CreditCard,
  FileBadge,
  FileText,
  FlaskConical,
  Globe,
  Home,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCog,
  UserRoundCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { NavIconName } from '@/lib/navigation';

const icons: Record<NavIconName, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'calendar-days': CalendarDays,
  stethoscope: Stethoscope,
  'file-text': FileText,
  pill: Pill,
  'flask-conical': FlaskConical,
  wallet: Wallet,
  'shield-check': ShieldCheck,
  package: Package,
  users: Users,
  'user-round-cog': UserRoundCog,
  building: Building,
  sparkles: Sparkles,
  'message-circle': MessageCircle,
  globe: Globe,
  'user-cog': UserCog,
  'credit-card': CreditCard,
  settings: Settings,
  'chart-column': ChartColumn,
  layers: Layers,
  boxes: Boxes,
  'file-badge': FileBadge,
  home: Home,
};

export function NavIcon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: NavIconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = icons[name] ?? LayoutDashboard;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
