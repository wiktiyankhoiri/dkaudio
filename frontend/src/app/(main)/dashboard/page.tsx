'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpDown,
  ArrowUpRight,
  DollarSign,
  Download,
  MoreHorizontal,
  PackageCheck,
  PackageX,
  ReceiptText,
  RotateCcw,
  Settings2,
  ShoppingBag,
  TriangleAlert,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatRp } from '@/lib/format';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useAuth } from '@/providers/auth-provider';
import type { DashboardData, Penjualan } from '@/types';

const EMPTY_DASHBOARD: DashboardData = {
  total_barang: 0,
  total_kategori: 0,
  total_supplier: 0,
  total_user: 0,
  pembelian_hari_ini: 0,
  pembelian_kemarin: 0,
  penjualan_hari_ini: 0,
  penjualan_kemarin: 0,
  total_nilai_stok: 0,
  total_nilai_jual: 0,
  stok_menipis: [],
  opname_aktif: 0,
  stok_total: 0,
  stok_rendah: 0,
  stok_habis: 0,
  total_penjualan_bulan_ini: 0,
  total_penjualan_bulan_lalu: 0,
  total_penjualan_semua: 0,
  top_products: [],
  penjualan_terbaru: [],
};

const salesOverviewConfig = {
  revenue: { label: 'Pendapatan', color: 'var(--foreground)' },
  profit: { label: 'Laba', color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

const activityChartConfig = {
  orders: { label: 'Item Terjual', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const storeTrafficConfig = {
  visitors: { label: 'Transaksi', color: 'var(--chart-3)' },
  anomalies: { label: 'Item', color: 'var(--destructive)' },
} satisfies ChartConfig;

const trafficSourcesConfig = {
  share: { label: 'Porsi', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const inventoryConfig = {
  'in-stock': { label: 'Tersedia', color: 'var(--chart-2)' },
  'low-stock': { label: 'Stok menipis', color: 'var(--chart-1)' },
  'out-of-stock': { label: 'Habis', color: 'var(--destructive)' },
} satisfies ChartConfig;

const orderFilters = ['Semua', 'Perlu tindakan', 'Belum dipenuhi', 'Belum lunas', 'Retur'] as const;

function trendPercent(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatDateTitle() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function formatOrderDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('id-ID', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTrend(value: number | null, note: string, suffix = '%') {
  if (value === null) return <span className="text-muted-foreground">Tidak ada data pembanding</span>;
  const positive = value >= 0;

  return (
    <>
      <span className={positive ? 'text-green-700 dark:text-green-300' : 'text-destructive'}>
        {positive ? '+' : ''}{value}{suffix}
      </span>
      <span className="text-muted-foreground"> {note}</span>
    </>
  );
}

function EmptyPanel({ className, children = 'Tidak ada data' }: { className?: string; children?: ReactNode }) {
  return <div className={cn('flex h-54 items-center justify-center text-muted-foreground text-sm', className)}>{children}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card><CardContent className="p-4"><Skeleton className="h-96 w-full" /></CardContent></Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5"><CardContent className="p-4"><Skeleton className="h-72 w-full" /></CardContent></Card>
        <Card className="xl:col-span-7"><CardContent className="p-4"><Skeleton className="h-72 w-full" /></CardContent></Card>
        <Card className="xl:col-span-12"><CardContent className="p-4"><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('h-full rounded-none border-0 border-border border-b ring-0', className)}>
      <CardHeader>
        <CardTitle className="font-normal text-sm">{title}</CardTitle>
        <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
          {value}
        </CardDescription>
        <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
          <Icon className="size-3 text-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

function KpiStrip({ data, salesChartData, isKasir = false }: { data: DashboardData; salesChartData: SalesPoint[]; isKasir?: boolean }) {
  const recentOrders = data.penjualan_terbaru ?? [];
  const stockAvailable = Math.max(data.stok_total - data.stok_rendah - data.stok_habis, 0);
  const stockAccuracy = data.stok_total > 0 ? Math.round((stockAvailable / data.stok_total) * 100) : null;
  const averageOrder = recentOrders.length > 0
    ? recentOrders.reduce((sum, item) => sum + (item.total ?? 0), 0) / recentOrders.length
    : 0;

  return (
    <div className="h-full overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 xl:col-span-12">
      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 xl:col-span-5 xl:border-r">
          {isKasir ? (
            <>
              <KpiCard title="Pesanan Hari Ini" value={data.penjualan_hari_ini.toLocaleString('id-ID')} icon={ShoppingBag} className="md:border-r">
                {formatTrend(trendPercent(data.penjualan_hari_ini, data.penjualan_kemarin), 'vs kemarin')}
              </KpiCard>
              <KpiCard title="Total Barang" value={data.total_barang.toLocaleString('id-ID')} icon={PackageCheck}>
                <span className="text-muted-foreground">Barang terdaftar</span>
              </KpiCard>
              <KpiCard title="Stok Menipis" value={data.stok_rendah.toLocaleString('id-ID')} icon={TriangleAlert} className="md:border-r">
                <span className="text-muted-foreground">Perlu segera diisi ulang</span>
              </KpiCard>
              <KpiCard title="Stok Habis" value={data.stok_habis.toLocaleString('id-ID')} icon={PackageX}>
                <span className="text-muted-foreground">Barang kosong</span>
              </KpiCard>
              <KpiCard title="Permintaan Retur" value={data.stok_menipis.length.toLocaleString('id-ID')} icon={RotateCcw} className="md:border-r md:border-b-0">
                <span className="text-muted-foreground">Barang stok menipis</span>
              </KpiCard>
              <KpiCard title="Akurasi Stok" value={stockAccuracy === null ? '-' : `${stockAccuracy}%`} icon={PackageCheck} className="border-b-0">
                <span className="text-muted-foreground">Berdasarkan stok tersedia</span>
              </KpiCard>
            </>
          ) : (
            <>
              <KpiCard title="Total Penjualan" value={formatRp(data.total_penjualan_bulan_ini)} icon={DollarSign} className="md:border-r">
                {formatTrend(trendPercent(data.total_penjualan_bulan_ini, data.total_penjualan_bulan_lalu), 'vs bulan lalu')}
              </KpiCard>
              <KpiCard title="Total Pesanan" value={data.penjualan_hari_ini.toLocaleString('id-ID')} icon={ShoppingBag}>
                {formatTrend(trendPercent(data.penjualan_hari_ini, data.penjualan_kemarin), 'vs kemarin')}
              </KpiCard>
              <KpiCard title="Pertumbuhan Pelanggan" value={data.total_user.toLocaleString('id-ID')} icon={Users} className="md:border-r">
                <span className="text-muted-foreground">Pengguna terdaftar</span>
              </KpiCard>
              <KpiCard title="Rata-rata Pesanan" value={formatRp(averageOrder)} icon={ReceiptText}>
                <span className="text-muted-foreground">Dari pesanan terbaru</span>
              </KpiCard>
              <KpiCard title="Permintaan Retur" value={data.stok_menipis.length.toLocaleString('id-ID')} icon={RotateCcw} className="md:border-r md:border-b-0">
                <span className="text-muted-foreground">Barang stok menipis</span>
              </KpiCard>
              <KpiCard title="Akurasi Stok" value={stockAccuracy === null ? '-' : `${stockAccuracy}%`} icon={PackageCheck} className="border-b-0">
                <span className="text-muted-foreground">Berdasarkan stok tersedia</span>
              </KpiCard>
            </>
          )}
        </div>

        <Card className="h-full rounded-none border-0 ring-0 xl:col-span-7">
          <CardHeader>
            <CardTitle className="font-normal">{isKasir ? 'Aktivitas Transaksi' : 'Ringkasan Penjualan'}</CardTitle>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {salesChartData.length === 0 ? (
              <EmptyPanel className="h-74" />
            ) : isKasir ? (
              <ChartContainer config={activityChartConfig} className="h-74 w-full">
                <AreaChart data={salesChartData} margin={{ bottom: 0, left: 0, right: 0, top: 8 }}>
                  <defs>
                    <linearGradient id="fillActivity" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" axisLine={false} height={30} tick={{ fontSize: 10 }} tickLine={false} tickMargin={8} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }} />
                  <Area dataKey="orders" name="Item Terjual" dot={false} fill="url(#fillActivity)" stroke="var(--color-orders)" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={salesOverviewConfig} className="h-74 w-full">
                <ComposedChart data={salesChartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
                  <defs>
                    <filter id="sales-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feFlood floodColor="var(--color-revenue)" floodOpacity="0.35" />
                      <feComposite in2="blur" operator="in" />
                      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid yAxisId="profit" vertical={false} />
                  <XAxis dataKey="period" axisLine={false} height={30} tick={{ fontSize: 10 }} tickLine={false} tickMargin={8} />
                  <YAxis yAxisId="revenue" hide />
                  <YAxis yAxisId="profit" hide />
                  <ChartTooltip
                    content={<ChartTooltipContent className="w-40" formatter={(value, name, item) => (
                      <>
                        <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">{String(name ?? '')}</span>
                          <span className="font-medium font-mono text-foreground tabular-nums">{formatRp(Number(value))}</span>
                        </div>
                      </>
                    )} />}
                    cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
                  />
                  <Bar yAxisId="profit" barSize={4} dataKey="profit" fill="var(--color-profit)" name="Laba" opacity={0.18} radius={[6, 6, 0, 0]} />
                  <Area yAxisId="revenue" dataKey="revenue" fill="none" filter="url(#sales-line-glow)" name="Pendapatan" stroke="var(--color-revenue)" strokeWidth={1.8} type="linear" activeDot={{ r: 4, fill: 'var(--background)', stroke: 'var(--color-revenue)', strokeWidth: 2 }} dot={false} />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type SalesPoint = { period: string; revenue: number; profit: number; orders: number };
type TrafficSource = { name: string; visits: string; share: number; change: string };

function StoreTraffic({ data, isKasir = false }: { data: SalesPoint[]; isKasir?: boolean }) {
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Trafik Toko</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {totalOrders.toLocaleString('id-ID')} kunjungan
        </CardDescription>
        <CardAction><ArrowUpRight className="size-4" /></CardAction>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={storeTrafficConfig} className="h-54 w-full">
            <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 8 }}>
              <defs>
                <linearGradient id="fillVisitors" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="period" tick={{ fontSize: 11 }} tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tickMargin={6} width={36} yAxisId="traffic" />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }} />
              <Area dataKey="orders" name="Transaksi" dot={false} fill="url(#fillVisitors)" stroke="var(--color-visitors)" strokeWidth={2} type="stepAfter" yAxisId="traffic" />
              {!isKasir && <Area dataKey="profit" name="Item" dot={false} fill="transparent" stroke="var(--color-anomalies)" strokeLinecap="round" strokeWidth={1.2} type="stepAfter" yAxisId="traffic" />}
            </AreaChart>
          </ChartContainer>
        ) : <EmptyPanel />}
      </CardContent>
    </Card>
  );
}

function TrafficSources({ sources }: { sources: TrafficSource[] }) {
  const total = sources.reduce((sum, source) => sum + Number(source.visits.replace(/[^0-9]/g, '')), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Sumber Trafik</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {total.toLocaleString('id-ID')} kunjungan
        </CardDescription>
        <CardAction><ArrowUpRight className="size-4" /></CardAction>
      </CardHeader>
      <CardContent>
        {sources.length > 0 ? (
          <ChartContainer config={trafficSourcesConfig} className="h-54 w-full">
            <BarChart barCategoryGap={12} data={sources} layout="vertical" margin={{ bottom: 0, left: 100, right: 50, top: 0 }}>
              <defs>
                <pattern height="4" id="traffic-source-pattern" patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width="4">
                  <rect height="6" width="6" fill="var(--muted)" fillOpacity="0.5" />
                  <line stroke="var(--muted-foreground)" strokeOpacity="0.10" strokeWidth="1.25" x1="0" x2="0" y1="0" y2="6" />
                </pattern>
              </defs>
              <XAxis dataKey="share" domain={[0, 100]} hide type="number" />
              <YAxis dataKey="name" hide type="category" />
              <Bar background={{ fill: 'url(#traffic-source-pattern)', radius: 8 }} barSize={36} dataKey="share" fill="var(--color-share)" fillOpacity={0.5} radius={8} stroke="var(--color-share)" strokeOpacity={0.1} strokeWidth={0.5}>
                <LabelList dataKey="name" content={(props) => <SourceNameLabel {...props} sources={sources} />} />
                <LabelList dataKey="change" content={(props) => <SourceChangeLabel {...props} />} />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : <EmptyPanel />}
      </CardContent>
    </Card>
  );
}

function SourceNameLabel({ y, height, index, sources }: any & { sources: TrafficSource[] }) {
  const source = typeof index === 'number' ? sources[index] : undefined;
  const yValue = Number(y);
  const heightValue = Number(height);
  if (!source || Number.isNaN(yValue) || Number.isNaN(heightValue)) return null;

  return (
    <text dominantBaseline="middle" textAnchor="start" x={2} y={yValue + heightValue / 2}>
      <tspan className="fill-foreground font-medium" fontSize={13} x={2} y={yValue + heightValue / 2 - 7}>{source.name}</tspan>
      <tspan className="fill-muted-foreground" fontSize={12} x={2} y={yValue + heightValue / 2 + 11}>{source.visits}</tspan>
    </text>
  );
}

function SourceChangeLabel({ y, height, value }: any) {
  const yValue = Number(y);
  const heightValue = Number(height);
  const text = String(value ?? '');
  if (!text || Number.isNaN(yValue) || Number.isNaN(heightValue)) return null;

  return (
    <text className={text.startsWith('-') ? 'fill-destructive' : 'fill-green-700 dark:fill-green-300'} dominantBaseline="middle" dx={-6} fontSize={13} textAnchor="end" x="100%" y={yValue + heightValue / 2}>
      {text}
    </text>
  );
}

function TopProducts({ data }: { data: DashboardData['top_products'] }) {
  const topProducts = data.slice(0, 3);
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const visibleTotal = topProducts.reduce((sum, item) => sum + item.total, 0);
  const colors = ['var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)'];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Produk Terlaris</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {total > 0 ? `${Math.round((visibleTotal / total) * 100)}% dari penjualan` : 'Belum ada penjualan'}
        </CardDescription>
        <CardAction><ArrowUpRight className="size-4" /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {topProducts.length > 0 ? (
          <>
            <div className="flex flex-col gap-2">
              <div aria-label="Penjualan berdasarkan produk" className="flex h-2 gap-1 overflow-hidden bg-muted" role="img">
                {topProducts.map((product, index) => {
                  const share = total > 0 ? Math.round((product.total / total) * 100) : 0;
                  return <div aria-hidden="true" key={product.nama} className="rounded-md" style={{ backgroundColor: colors[index], width: `${share}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-4">
                {topProducts.map((product, index) => (
                  <div className="flex items-center gap-1" key={product.nama}>
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: colors[index] }} />
                    <span className="text-muted-foreground text-xs">Produk {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
              <div className="text-muted-foreground text-xs">Produk</div>
              <div className="text-muted-foreground text-xs">Porsi</div>
              <div className="text-muted-foreground text-xs">Penjualan</div>
              {topProducts.map((product) => {
                const share = total > 0 ? Math.round((product.total / total) * 100) : 0;
                return (
                  <div className="contents text-sm" key={product.nama}>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{product.nama}</div>
                      <div className="text-muted-foreground text-xs">{product.qty} terjual</div>
                    </div>
                    <div className="self-center text-muted-foreground tabular-nums">{share}%</div>
                    <div className="self-center font-medium tabular-nums">{formatRp(product.total)}</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : <EmptyPanel />}
      </CardContent>
    </Card>
  );
}

function Inventory({ data }: { data: DashboardData }) {
  const inStock = Math.max(data.stok_total - data.stok_rendah - data.stok_habis, 0);
  const totalUnits = inStock + data.stok_rendah + data.stok_habis;
  const availablePercent = totalUnits > 0 ? Math.round((inStock / totalUnits) * 100) : 0;
  const segmentCount = 32;
  const inStockSegments = totalUnits > 0 ? Math.round((inStock / totalUnits) * segmentCount) : 0;
  const lowStockSegments = totalUnits > 0 ? Math.round((data.stok_rendah / totalUnits) * segmentCount) : 0;
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const status = index < inStockSegments ? 'in-stock' : index < inStockSegments + lowStockSegments ? 'low-stock' : 'out-of-stock';
    return { id: `segment-${index + 1}`, value: totalUnits > 0 ? 1 : 0, fill: `var(--color-${status})` };
  });
  const summary = [
    { icon: PackageCheck, label: 'Tersedia', value: inStock },
    { icon: TriangleAlert, label: 'Stok menipis', value: data.stok_rendah },
    { icon: PackageX, label: 'Habis', value: data.stok_habis },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Inventori</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {totalUnits > 0 ? `${availablePercent}% tersedia` : 'Tidak ada stok'}
        </CardDescription>
        <CardAction><ArrowUpRight className="size-4" /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {totalUnits > 0 ? (
          <ChartContainer config={inventoryConfig} className="mx-auto h-30 w-full">
            <PieChart>
              <Pie cx="50%" cy="100%" cornerRadius={6} data={segments} dataKey="value" endAngle={0} innerRadius={80} outerRadius={110} paddingAngle={2} startAngle={180} stroke="var(--card)" strokeWidth={1}>
                <Label content={({ viewBox }) => viewBox && 'cx' in viewBox && 'cy' in viewBox ? (
                  <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                    <tspan className="fill-foreground font-medium text-2xl tabular-nums" x={viewBox.cx} y={(viewBox.cy || 0) + 22}>{availablePercent}%</tspan>
                    <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy || 0) + 38}>Tersedia</tspan>
                  </text>
                ) : null} />
                {segments.map((segment) => <Cell key={segment.id} fill={segment.fill} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : <EmptyPanel className="h-30" />}
        <Separator />
        <div className="grid grid-cols-3 divide-x">
          {summary.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-9 place-items-center rounded-full bg-muted">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs leading-none">{item.label}</div>
                <div className="font-medium text-sm tabular-nums">{item.value.toLocaleString('id-ID')}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerReviews() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Ulasan</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">Tidak ada data ulasan</CardDescription>
        <CardAction><ArrowUpRight className="size-4" /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          <EmptyPanel className="h-[8.5rem]" />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium text-sm">0 ulasan</div>
            <div className="line-clamp-2 min-h-[3em] text-muted-foreground text-xs">Sumber data ulasan pelanggan belum tersedia.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ type, label }: { type: 'paid' | 'pending' | 'fulfilled' | 'unfulfilled'; label: string }) {
  const className = type === 'paid' || type === 'fulfilled'
    ? 'border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300'
    : type === 'pending'
      ? 'border-yellow-700/25 text-yellow-700 dark:border-yellow-300/25 dark:text-yellow-300'
      : undefined;

  return (
    <Badge className={className} variant={type === 'unfulfilled' ? 'destructive' : 'outline'}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

function RecentOrders({ orders }: { orders: Penjualan[] }) {
  const visibleOrders = orders.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Pesanan Terbaru</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {orders.length.toLocaleString('id-ID')} pesanan
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button aria-label="Buka pesanan" size="icon-sm" variant="outline"><ArrowUpRight /></Button>
          <Button aria-label="Unduh pesanan" size="icon-sm" variant="outline"><Download /></Button>
          <Button size="icon-sm" variant="outline"><MoreHorizontal /></Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex items-center justify-between gap-4 overflow-x-auto px-4">
          <ToggleGroup className="bg-muted p-0.75 text-muted-foreground **:data-[slot=toggle-group-item]:rounded-md **:data-[slot=toggle-group-item]:border **:data-[slot=toggle-group-item]:border-transparent **:data-[slot=toggle-group-item]:text-foreground/60 **:data-[slot=toggle-group-item]:hover:text-foreground [&_[data-slot=toggle-group-item][data-state=on]]:bg-background [&_[data-slot=toggle-group-item][data-state=on]]:text-foreground [&_[data-slot=toggle-group-item][data-state=on]]:shadow-sm dark:[&_[data-slot=toggle-group-item][data-state=on]]:border-input dark:[&_[data-slot=toggle-group-item][data-state=on]]:bg-input/30" defaultValue="Semua" size="sm" spacing={1} type="single">
            {orderFilters.map((filter) => <ToggleGroupItem key={filter} value={filter}>{filter}</ToggleGroupItem>)}
          </ToggleGroup>
          <Button size="icon-sm" variant="outline"><ArrowUpDown /></Button>
        </div>
        <div className="overflow-hidden">
          <Table className="**:data-[slot='table-cell']:px-4.5 **:data-[slot='table-head']:px-4.5">
            <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-normal **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
              <TableRow>
                <TableHead>Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><div className="w-28">Total</div></TableHead>
                <TableHead><div className="w-44">Tanggal</div></TableHead>
                <TableHead><div className="flex w-full justify-end">Aksi</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-cell']:px-4 **:data-[slot='table-cell']:py-3 **:data-[slot='table-row']:hover:bg-transparent">
              {visibleOrders.length > 0 ? visibleOrders.map((order) => (
                <TableRow key={order.id ?? order.no_invoice}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium leading-none">{order.no_invoice}</div>
                      <div className="text-muted-foreground text-xs">{order.details?.length ?? 0} item</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.konsumen ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge type={order.status === 'lunas' ? 'paid' : 'pending'} label={order.status === 'lunas' ? 'Lunas' : 'Pending'} />
                      <StatusBadge type={order.status === 'lunas' ? 'fulfilled' : 'unfulfilled'} label={order.status === 'lunas' ? 'Terpenuhi' : 'Belum dipenuhi'} />
                    </div>
                  </TableCell>
                  <TableCell><div className="w-28 tabular-nums">{formatRp(order.total)}</div></TableCell>
                  <TableCell><div className="w-44 text-muted-foreground">{formatOrderDate(order.tanggal)}</div></TableCell>
                  <TableCell>
                    <div className="flex w-full justify-end">
                      <Button aria-label="Buka aksi pesanan" size="icon-sm" variant="ghost"><MoreHorizontal /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell className="h-24 text-center" colSpan={6}>Tidak ada pesanan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col items-start justify-between gap-4 px-4 pb-1 sm:flex-row sm:items-center">
          <p className="hidden text-muted-foreground text-sm lg:block">Menampilkan {visibleOrders.length} dari {orders.length.toLocaleString('id-ID')} pesanan</p>
          <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
            <PaginationContent className="mx-0 flex-wrap justify-center gap-1.5">
              <PaginationItem><PaginationPrevious className="pointer-events-none opacity-50" href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext className="pointer-events-none opacity-50" href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}

function StokMenipisCard({ items }: { items: DashboardData['stok_menipis'] }) {
  const list = items.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Stok Menipis</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {items.length.toLocaleString('id-ID')} barang
        </CardDescription>
        <CardAction><ArrowUpRight className="size-4" /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {list.length > 0 ? list.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">{item.nama}</div>
              <div className="text-muted-foreground text-xs">{item.kode}</div>
            </div>
            <span className={cn('shrink-0 tabular-nums font-medium', item.stok === 0 ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-300')}>
              {item.stok} tersisa
            </span>
          </div>
        )) : <EmptyPanel>Semua stok aman</EmptyPanel>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isKasir } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const d = data ?? EMPTY_DASHBOARD;

  const recentOrders = d.penjualan_terbaru ?? [];
  const salesChartData = recentOrders.slice(0, 10).reverse().map((order) => ({
    period: order.no_invoice,
    revenue: order.total ?? 0,
    profit: order.details?.reduce((sum, detail) => sum + detail.subtotal, 0) ?? 0,
    orders: order.details?.reduce((sum, detail) => sum + detail.qty, 0) ?? 0,
  }));
  const sourceRaw = [
    { name: 'Produk', value: d.total_barang },
    { name: 'Kategori', value: d.total_kategori },
    { name: 'Supplier', value: d.total_supplier },
    { name: 'Pengguna', value: d.total_user },
    { name: 'Stok', value: d.stok_total },
  ].filter((item) => item.value > 0);
  const sourceTotal = sourceRaw.reduce((sum, item) => sum + item.value, 0);
  const trafficSources = sourceRaw.map((item) => ({
    name: item.name,
    visits: item.value.toLocaleString('id-ID'),
    share: sourceTotal > 0 ? Math.round((item.value / sourceTotal) * 100) : 0,
    change: '',
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Ringkasan Toko</h1>
          <p className="text-muted-foreground text-sm">{formatDateTitle()}</p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-34" id="ecommerce-period" size="sm"><SelectValue placeholder="Bulan Ini" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="this-month">Bulan Ini</SelectItem>
                <SelectItem value="last-month">Bulan Lalu</SelectItem>
                <SelectItem value="last-30-days">30 Hari Terakhir</SelectItem>
                <SelectItem value="year-to-date">Tahun Berjalan</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select defaultValue="all-channels">
            <SelectTrigger className="w-40" id="ecommerce-channel" size="sm"><SelectValue placeholder="Semua Kanal" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-channels">Semua Kanal</SelectItem>
                <SelectItem value="sales">Penjualan</SelectItem>
                <SelectItem value="purchase">Pembelian</SelectItem>
                <SelectItem value="inventory">Inventori</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" />
          <Button size="icon-sm" variant="outline"><Settings2 /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <KpiStrip data={d} salesChartData={salesChartData} isKasir={isKasir} />
        <div className="xl:col-span-5"><StoreTraffic data={salesChartData} isKasir={isKasir} /></div>
        <div className="xl:col-span-7"><TrafficSources sources={trafficSources} /></div>
        <div className="xl:col-span-4">{isKasir ? <StokMenipisCard items={d.stok_menipis} /> : <TopProducts data={d.top_products} />}</div>
        <div className="xl:col-span-4"><Inventory data={d} /></div>
        <div className="xl:col-span-4"><CustomerReviews /></div>
        <div className="xl:col-span-12"><RecentOrders orders={recentOrders} /></div>
      </div>
    </div>
  );
}
