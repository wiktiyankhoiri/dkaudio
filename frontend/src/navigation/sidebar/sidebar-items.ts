import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardCheck,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Scale,
  ScrollText,
  Tags,
  Truck,
  Users,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: typeof LayoutDashboard;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  roles?: ('owner' | 'admin' | 'kasir')[];
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: typeof LayoutDashboard;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  roles?: ('owner' | 'admin' | 'kasir')[];
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 0,
    label: "Dashboard",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 1,
    label: "Inventori",
    items: [
      {
        id: "barang",
        title: "Barang",
        url: "/dashboard/barang",
        icon: Boxes,
      },
      {
        id: "kategori",
        title: "Kategori",
        url: "/dashboard/kategori",
        icon: Tags,
        roles: ['owner', 'admin'],
      },
      {
        id: "supplier",
        title: "Supplier",
        url: "/dashboard/supplier",
        icon: Truck,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    id: 2,
    label: "Transaksi",
    items: [
      {
        id: "pembelian",
        title: "Pembelian",
        url: "/dashboard/pembelian",
        icon: ArrowDownToLine,
        roles: ['owner', 'admin'],
      },
      {
        id: "penjualan",
        title: "Penjualan",
        url: "/dashboard/penjualan",
        icon: ArrowUpFromLine,
      },
      {
        id: "penyesuaian-stok",
        title: "Penyesuaian Stok",
        url: "/dashboard/penyesuaian-stok",
        icon: Scale,
        roles: ['owner', 'admin'],
      },
      {
        id: "stok-opname",
        title: "Stok Opname",
        url: "/dashboard/stok-opname",
        icon: ClipboardCheck,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    id: 3,
    label: "Laporan",
    items: [
      {
        id: "kartu-stok",
        title: "Kartu Stok",
        url: "/dashboard/kartu-stok",
        icon: FileText,
        roles: ['owner', 'admin'],
      },
      {
        id: "laporan-stok",
        title: "Laporan Stok",
        url: "/dashboard/laporan/stok",
        icon: FileBarChart,
        roles: ['owner', 'admin'],
      },
      {
        id: "laporan-pembelian",
        title: "Laporan Pembelian",
        url: "/dashboard/laporan/pembelian",
        icon: FileBarChart,
        roles: ['owner', 'admin'],
      },
      {
        id: "laporan-penjualan",
        title: "Laporan Penjualan",
        url: "/dashboard/laporan/penjualan",
        icon: FileBarChart,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    id: 4,
    label: "Sistem",
    items: [
      {
        id: "audit-log",
        title: "Audit Log",
        url: "/dashboard/audit-log",
        icon: ScrollText,
        roles: ['owner', 'admin'],
      },
      {
        id: "users",
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
        roles: ['owner'],
      },
    ],
  },
];
