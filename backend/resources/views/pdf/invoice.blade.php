<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Courier New', monospace; font-size: 12px; color: #1a1a1a; margin: 0; padding: 20px; }
.invoice { max-width: 600px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; }
.header h1 { font-size: 24px; text-transform: uppercase; letter-spacing: 3px; margin: 0; }
.ref { font-size: 11px; margin-bottom: 15px; }
.ref div { display: inline-block; width: 48%; vertical-align: top; }
.ref .right { text-align: right; }
.parties { font-size: 11px; margin-bottom: 15px; }
.parties div { display: inline-block; width: 48%; vertical-align: top; }
.parties .right { text-align: right; }
.parties .bold { font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px; }
table th { background: #f5f5f5; padding: 5px 8px; text-align: left; text-transform: uppercase; font-size: 10px; }
table th.right, table td.right { text-align: right; }
table td { padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
.summary { font-size: 11px; }
.summary div { display: flex; justify-content: space-between; padding: 2px 0; }
.summary .total { border-top: 1px dashed #999; padding-top: 6px; font-weight: bold; font-size: 13px; margin-top: 4px; }
.summary .due { font-weight: 600; }
.footer { font-size: 10px; color: #888; margin-top: 20px; }
</style>
</head>
<body>
<div class="invoice">
<div class="header">
<div><img src="{{ public_path('logo-dkaudio.png') }}" style="height: 40px; width: auto;" /></div>
<h1>Invoice</h1>
</div>

<div class="ref">
<div>
<p>Referensi: {{ $p->no_invoice }}</p>
<p>Tanggal: {{ \Carbon\Carbon::parse($p->tanggal)->locale('id')->isoFormat('D MMMM YYYY') }}</p>
</div>
<div class="right">
<p>Jatuh tempo: {{ $p->jatuh_tempo ? \Carbon\Carbon::parse($p->jatuh_tempo)->locale('id')->isoFormat('D MMMM YYYY') : '—' }}</p>
</div>
</div>

<div class="parties">
<div>
<p class="bold">Dari</p>
<p>DK Audio</p>
<p>Jl. Jolotundo 1 RT 03 RW 02</p>
<p>Semarang</p>
<p>(Depan Masjid Agung Jawa Tengah)</p>
<p>0821 3483 9888</p>
</div>
@if ($p->konsumen)
<div class="right">
<p class="bold">Kepada</p>
<p>{{ $p->konsumen }}</p>
@if ($p->telepon)<p>{{ $p->telepon }}</p>@endif
@if ($p->alamat)<p>{{ $p->alamat }}</p>@endif
</div>
@endif
</div>

<table>
<tr>
<th colspan="2">Barang</th>
<th class="right">Jml</th>
<th class="right">Harga</th>
</tr>
@foreach ($p->details as $d)
<tr>
<td colspan="2">{{ $d->barang->nama_barang ?? '—' }}</td>
<td class="right">{{ $d->qty }}</td>
<td class="right">{{ number_format($d->harga_jual, 0, ',', '.') }}</td>
</tr>
@endforeach
</table>

<div class="summary">
<div><span>Subtotal</span><span>{{ number_format($p->subtotal, 0, ',', '.') }}</span></div>
@if ($p->diskon > 0)
<div><span>Diskon</span><span>-{{ number_format($p->diskon, 0, ',', '.') }}</span></div>
@endif
@if ($p->ppn > 0)
<div><span>PPN ({{ $p->ppn }}%)</span><span>+{{ number_format(($p->subtotal - $p->diskon) * ($p->ppn / 100), 0, ',', '.') }}</span></div>
@endif
<div class="total"><span>Total</span><span>{{ number_format($p->total, 0, ',', '.') }}</span></div>
<div><span>Dibayar</span><span>{{ number_format($p->dibayar, 0, ',', '.') }}</span></div>
<div class="due"><span>Sisa</span><span>{{ number_format($p->total - $p->dibayar, 0, ',', '.') }}</span></div>
</div>

<div class="footer"><p>Siap diproses.</p></div>
</div>
</body>
</html>
