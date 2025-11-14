export function downloadReport(rows: { date: string; adld: string; combo: string; units: number }[]) {
  if (typeof window === 'undefined' || !rows.length) return;

  const headers = ['Date', 'ADLD', 'Combo', 'Units'];
  const csvRows = [headers.join(','), ...rows.map((r) => `${r.date},${r.adld},${r.combo},${r.units}`)];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'incentive-passbook-report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
