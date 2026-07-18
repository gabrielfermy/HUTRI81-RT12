/**
 * Utility to print payment receipts in a standard 80mm thermal printer format using ESC/POS guidelines.
 */
export const handlePrintReceipt = (warga: { id: string; nama: string; blok: string; nominal_iuran: number; paid_at?: string }) => {
  const serial = `TX-8112-${warga.id.slice(0, 5).toUpperCase()}-${new Date(warga.paid_at || Date.now()).toISOString().slice(2, 10).replace(/-/g, '')}`;
  const paymentDateStr = warga.paid_at 
    ? new Date(warga.paid_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';
  const printDateStr = new Date().toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const nominalStr = Number(warga.nominal_iuran).toLocaleString('id-ID');

  const printWindow = window.open('', '_blank', 'width=450,height=600');
  if (!printWindow) {
    alert('Gagal membuka jendela cetak. Silakan periksa popup blocker Anda.');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Cetak Struk - ${warga.nama}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm; /* Standard printable area for 80mm roll */
            margin: 0 auto;
            padding: 4mm 2mm;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .bold {
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 3mm 0;
          }
          .double-divider {
            border-top: 1px double #000;
            margin: 3mm 0;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .info-table td {
            padding: 0.8mm 0;
            vertical-align: top;
          }
          .info-table td:first-child {
            width: 35%;
          }
          .title {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 1.5mm;
          }
          .subtitle {
            font-size: 9pt;
            margin-bottom: 2mm;
          }
        </style>
      </head>
      <body>
        <div class="text-center bold title">RT 12 PELEM KIDUL</div>
        <div class="text-center subtitle">PANITIA HUT RI KE-81</div>
        <div class="double-divider"></div>
        <div class="text-center bold" style="margin-bottom: 2.5mm;">BUKTI PEMBAYARAN IURAN</div>
        
        <table class="info-table">
          <tr>
            <td>Serial</td>
            <td>: <span class="bold">${serial}</span></td>
          </tr>
          <tr>
            <td>Warga</td>
            <td>: ${warga.nama}</td>
          </tr>
          <tr>
            <td>Blok</td>
            <td>: ${warga.blok}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table class="info-table">
          <tr>
            <td class="bold">NOMINAL</td>
            <td class="bold text-right" style="font-size: 11pt;">Rp ${nominalStr}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td class="bold text-right">LUNAS</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table class="info-table" style="font-size: 8pt; color: #333;">
          <tr>
            <td>Tgl Bayar</td>
            <td>: ${paymentDateStr}</td>
          </tr>
          <tr>
            <td>Tgl Cetak</td>
            <td>: ${printDateStr}</td>
          </tr>
        </table>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 8pt; font-style: italic; margin-bottom: 2mm; line-height: 1.4; padding: 0 1mm;">
          * Ini adalah bukti pembayaran yang sah untuk iuran/sumbangan warga RT 12 Pelem Kidul *
        </div>

        <div class="double-divider"></div>
        <div class="text-center" style="font-size: 8pt; margin-top: 4mm;">
          Terima kasih atas partisipasi<br/>
          dan sumbangsih Anda!<br/>
          <span class="bold">Satu Hati Untuk Indonesia</span>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
