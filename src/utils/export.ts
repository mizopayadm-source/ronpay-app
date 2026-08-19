import { Transaction } from '../types';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from './date';

export interface MatrixRow {
  donorName: string;
  categoryAmounts: { [category: string]: number };
  total: number;
  isAnonymous?: boolean;
}

export interface KumtluangMatrixData {
  categories: string[];
  rows: MatrixRow[];
  columnTotals: { [category: string]: number };
  grandTotal: number;
}

/**
 * Builds a donor-by-category matrix specifically for Kumtluang Bawm / multi-category campaigns.
 */
export const buildKumtluangMatrix = (transactions: Transaction[]): KumtluangMatrixData => {
  const categorySet = new Set<string>();
  const donorMap = new Map<string, { [cat: string]: number }>();

  transactions.forEach(t => {
    const donor = t.isAnonymous ? 'Anonymous' : (t.donorName || 'Unknown Donor');
    if (!donorMap.has(donor)) {
      donorMap.set(donor, {});
    }
    const donorCats = donorMap.get(donor)!;

    if (t.subCategoryBreakdown && Object.keys(t.subCategoryBreakdown).length > 0) {
      Object.entries(t.subCategoryBreakdown).forEach(([cat, amt]) => {
        const cleanCat = cat.trim();
        const numAmt = Number(amt) || 0;
        if (numAmt > 0) {
          categorySet.add(cleanCat);
          donorCats[cleanCat] = (donorCats[cleanCat] || 0) + numAmt;
        }
      });
    } else {
      const fallbackCat = t.campaignTitle || 'General Collection';
      categorySet.add(fallbackCat);
      donorCats[fallbackCat] = (donorCats[fallbackCat] || 0) + t.amount;
    }
  });

  const categories = Array.from(categorySet);
  const rows: MatrixRow[] = [];
  const columnTotals: { [category: string]: number } = {};
  categories.forEach(c => { columnTotals[c] = 0; });
  let grandTotal = 0;

  donorMap.forEach((catAmounts, donorName) => {
    let rowTotal = 0;
    const cleanCatAmounts: { [category: string]: number } = {};

    categories.forEach(c => {
      const amt = catAmounts[c] || 0;
      cleanCatAmounts[c] = amt;
      rowTotal += amt;
      columnTotals[c] += amt;
    });

    grandTotal += rowTotal;
    rows.push({
      donorName,
      categoryAmounts: cleanCatAmounts,
      total: rowTotal,
    });
  });

  return {
    categories,
    rows,
    columnTotals,
    grandTotal,
  };
};

export const exportKumtluangMatrixToCSV = (
  transactions: Transaction[], 
  title: string = 'Kumtluang_Bawm_Category_Report',
  campaignName?: string,
  dateRangeText?: string
) => {
  const matrix = buildKumtluangMatrix(transactions);

  // Meta information headers with strict DD/MM/YYYY formatting
  const metaRows = [
    `"RONPAY TRANSACTION & CATEGORY MATRIX REPORT"`,
    `"Campaign / QR Name:","${(campaignName || 'All Campaigns').replace(/"/g, '""')}"`,
    `"Date Range / Hun Chhung:","${(dateRangeText || 'All Dates').replace(/"/g, '""')}"`,
    `"Exported Date:","${formatDateDDMMYYYY(new Date())}"`,
    `""`,
  ];

  // Headers: Hming, Cat1, Cat2, ..., Total
  const headers = ['Hming', ...matrix.categories, 'Total'];

  const dataRows = matrix.rows.map(r => {
    return [
      `"${r.donorName.replace(/"/g, '""')}"`,
      ...matrix.categories.map(c => (r.categoryAmounts[c] || 0).toString()),
      r.total.toString(),
    ];
  });

  const totalRow = [
    '"Total"',
    ...matrix.categories.map(c => (matrix.columnTotals[c] || 0).toString()),
    matrix.grandTotal.toString(),
  ];

  const csvContent = [
    ...metaRows,
    headers.join(','),
    ...dataRows.map(row => row.join(',')),
    totalRow.join(','),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}_${formatDateDDMMYYYY(new Date()).replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportTransactionsToCSV = (
  transactions: Transaction[], 
  title: string = 'RonPay_Transactions', 
  isKumtluang: boolean = false,
  campaignName?: string,
  dateRangeText?: string
) => {
  if (isKumtluang) {
    exportKumtluangMatrixToCSV(transactions, title, campaignName, dateRangeText);
    return;
  }

  // Meta info header with DD/MM/YYYY
  const metaRows = [
    `"RONPAY TRANSACTION REPORT"`,
    `"Campaign / QR Name:","${(campaignName || 'All Campaigns').replace(/"/g, '""')}"`,
    `"Date Range / Hun Chhung:","${(dateRangeText || 'All Dates').replace(/"/g, '""')}"`,
    `"Exported Date:","${formatDateDDMMYYYY(new Date())}"`,
    `""`,
  ];

  // Streamlined headers for Ralna/Khawlsak/Rikrum (item 9: no redundant empty columns)
  const headers = [
    'Transaction ID',
    'Date & Time',
    'Category / Bawm',
    'Campaign Title',
    'Donor Name',
    'Amount (INR)',
    'Payment Mode',
    'Status',
    'Reference Hash'
  ];

  const rows = transactions.map(t => {
    return [
      t.id,
      formatDateTimeDDMMYYYY(t.timestamp),
      t.category.toUpperCase(),
      `"${(t.campaignTitle || '').replace(/"/g, '""')}"`,
      `"${(t.isAnonymous ? 'Anonymous' : (t.donorName || '')).replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.paymentMethod.toUpperCase(),
      t.status.toUpperCase(),
      t.txHash
    ];
  });

  const csvContent = [
    ...metaRows,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}_${formatDateDDMMYYYY(new Date()).replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printTransactionsPDF = (
  transactions: Transaction[], 
  title: string = 'RonPay Official Report', 
  isKumtluang: boolean = false,
  campaignName: string = 'All Campaigns',
  dateRangeText: string = 'All Time',
  imageUrl?: string
) => {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and print PDF reports.');
    return;
  }

  // If Kumtluang Bawm, format matrix table: Hming | Cat 1 | Cat 2 | ... | Total
  if (isKumtluang) {
    const matrix = buildKumtluangMatrix(transactions);
    const matrixHeaderThs = matrix.categories.map(c => `<th style="text-align: right; padding: 8px 10px;">${c}</th>`).join('');
    
    const matrixRowsHtml = matrix.rows.map((r, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b;">${r.donorName}</td>
        ${matrix.categories.map(c => `
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: ${r.categoryAmounts[c] > 0 ? '#0f172a' : '#94a3b8'};">
            ${r.categoryAmounts[c] > 0 ? `₹${r.categoryAmounts[c].toLocaleString('en-IN')}` : '-'}
          </td>
        `).join('')}
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #4338ca; background-color: #f1f5f9;">
          ₹${r.total.toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const matrixFooterTds = matrix.categories.map(c => `
      <td style="text-align: right; padding: 10px; font-weight: 900; color: #047857; border-top: 2px solid #0f172a;">
        ₹${matrix.columnTotals[c].toLocaleString('en-IN')}
      </td>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${campaignName} - ${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 30px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4338ca; padding-bottom: 18px; margin-bottom: 22px; }
            .header-left { display: flex; align-items: center; gap: 20px; }
            .header-img { width: 85px; height: 85px; border-radius: 16px; object-fit: cover; border: 2.5px solid #4338ca; box-shadow: 0 4px 10px -2px rgba(0,0,0,0.15); flex-shrink: 0; }
            .title { font-size: 21px; font-weight: 900; color: #1e1b4b; margin: 0; line-height: 1.2; }
            .campaign-title { font-size: 16px; font-weight: 800; color: #4338ca; margin-top: 4px; word-break: break-word; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
            .badge { background: #e0e7ff; color: #3730a3; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; white-space: nowrap; }
            .meta-bar { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; margin-top: 15px; }
            th { background: #1e1b4b; color: #ffffff; padding: 9px 10px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            .total-row { background: #e2e8f0; font-weight: 900; font-size: 12px; }
            .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              ${imageUrl ? `<img src="${imageUrl}" class="header-img" alt="${campaignName}" />` : ''}
              <div>
                <h1 class="title">RONPAY CATEGORY-WISE DONATION MATRIX REPORT</h1>
                <div class="campaign-title">QR / Campaign: ${campaignName}</div>
                <div class="subtitle">Transaction Period (Hun Chhung): <b>${dateRangeText}</b></div>
              </div>
            </div>
            <div class="badge">Generated: ${formatDateDDMMYYYY(new Date())}</div>
          </div>

          <div class="meta-bar">
            <div><b>Campaign Name:</b> ${campaignName}</div>
            <div><b>Hun Chhung (Period):</b> <span style="color: #4338ca; font-weight: 700;">${dateRangeText}</span></div>
            <div><b>Petu Zat:</b> ${matrix.rows.length} Donors</div>
            <div><b>Grand Total:</b> <span style="color: #047857; font-weight: 900;">₹${matrix.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="padding: 8px 10px;">Hming (Donor)</th>
                ${matrixHeaderThs}
                <th style="text-align: right; padding: 8px 10px; background: #312e81;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${matrixRowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td style="padding: 10px; font-weight: 900; color: #1e1b4b; border-top: 2px solid #0f172a;">TOTAL</td>
                ${matrixFooterTds}
                <td style="text-align: right; padding: 10px; font-weight: 900; color: #047857; border-top: 2px solid #0f172a; font-size: 13px; background-color: #dcfce7;">
                  ₹${matrix.grandTotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <span>RonPay Mizoram Community Platform • Kohhran & NGO Financial Report Matrix</span>
            <span>Verified System Signature</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    return;
  }

  // Streamlined standard report for Ralna, Khawlsak, Rikrum without empty columns
  const rowsHtml = transactions.map((t, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 10px;">${t.id}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px;">${formatDateTimeDDMMYYYY(t.timestamp)}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-transform: capitalize; font-size: 11px;">${t.category}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${t.campaignTitle}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${t.isAnonymous ? '<i>Anonymous</i>' : t.donorName}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase;">${t.paymentMethod}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 11px;">₹${t.amount.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${campaignName} - ${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4338ca; padding-bottom: 18px; margin-bottom: 22px; }
          .header-left { display: flex; align-items: center; gap: 20px; }
          .header-img { width: 85px; height: 85px; border-radius: 16px; object-fit: cover; border: 2.5px solid #4338ca; box-shadow: 0 4px 10px -2px rgba(0,0,0,0.15); flex-shrink: 0; }
          .title { font-size: 21px; font-weight: 900; color: #1e1b4b; margin: 0; line-height: 1.2; }
          .campaign-title { font-size: 16px; font-weight: 800; color: #4338ca; margin-top: 4px; word-break: break-word; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
          .badge { background: #e0e7ff; color: #3730a3; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; white-space: nowrap; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; padding: 14px; border-radius: 10px; border: 1.5px solid #cbd5e1; }
          .stat-label { font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; word-break: break-word; }
          table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; margin-top: 12px; }
          th { background: #1e1b4b; color: #ffffff; padding: 9px 10px; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.5px; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            ${imageUrl ? `<img src="${imageUrl}" class="header-img" alt="${campaignName}" />` : ''}
            <div>
              <h1 class="title">RONPAY DONATION & COLLECTION REPORT</h1>
              <div class="campaign-title">QR / Campaign: ${campaignName}</div>
              <div class="subtitle">Transaction Period (Hun Chhung): <b>${dateRangeText}</b></div>
            </div>
          </div>
          <div class="badge">Generated: ${formatDateDDMMYYYY(new Date())}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Target / QR Name</div>
            <div class="stat-val" style="font-size: 14px; color: #4338ca; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${campaignName}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-val">${transactions.length} Entries</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Grand Total Collection</div>
            <div class="stat-val" style="color: #047857;">₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Bawm</th>
              <th>Campaign / Purpose</th>
              <th>Donor Name</th>
              <th>Mode</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>RonPay Mizoram Community Platform • Digital Financial Inclusivity</span>
          <span>Verified Cryptographic Receipt Signature</span>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
