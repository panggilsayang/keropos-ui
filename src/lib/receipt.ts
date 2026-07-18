// Ported from apps/pos-web/src/pages/pos/components/receipt.ts — plain text
// line formatting, transport-agnostic (printer.ts turns these into ESC/POS
// bytes). Adapted to this app's Transaction/LineItem shape (src/lib/terminal.ts).
import type { Transaction } from './terminal'

function money(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID')
}

// `label` distinguishes the store/checker copy (printed automatically on
// checkout) from an extra customer copy (printed on demand, when the buyer
// asks for one after the fact) — same transaction, same lines, just a
// header so whoever's holding the paper knows which copy it is.
export function receiptLines(tx: Transaction, label?: string): string[] {
  const lines = ['Purdia POS', '----------------------------']
  if (label) lines.push(`-- ${label} --`)
  for (const it of tx.items) {
    lines.push(`${it.name} x${it.qty}  ${money(it.price * it.qty)}`)
  }
  lines.push('----------------------------')
  lines.push(`Total       ${money(tx.total)}`)
  lines.push(`Payment     ${tx.payment_method}`)
  return lines
}
