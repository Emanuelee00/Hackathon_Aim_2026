import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, CircleHelp, Clock3, Coffee, CookingPot, DoorOpen, Euro, FileText, Heart, Inbox, LayoutDashboard, Leaf, MapPin, Menu, MessageCircle, MoreHorizontal, Palette, Plus, Search, Send, Settings2, Sofa, Sparkles, Users, X } from 'lucide-react';

const icons = { download: ArrowDownToLine, back: ArrowLeft, arrow: ArrowRight, diagonal: ArrowUpRight, calendar: CalendarDays, check: Check, checks: CheckCheck, left: ChevronLeft, right: ChevronRight, help: CircleHelp, clock: Clock3, coffee: Coffee, cooking: CookingPot, space: DoorOpen, euro: Euro, file: FileText, heart: Heart, inbox: Inbox, dashboard: LayoutDashboard, leaf: Leaf, pin: MapPin, menu: Menu, chat: MessageCircle, more: MoreHorizontal, palette: Palette, plus: Plus, search: Search, send: Send, settings: Settings2, sofa: Sofa, sparkles: Sparkles, users: Users, close: X };
export default function Icon({ name, size = 18, ...props }) {
  const Glyph = icons[name] || Leaf;
  return <Glyph size={size} strokeWidth={1.7} aria-hidden="true" {...props} />;
}
