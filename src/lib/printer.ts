// ESC/POS over classic Bluetooth SPP, via the tauri-plugin-spp-printer
// plugin (apps/purdia/src-tauri/tauri-plugin-spp-printer) — a Kotlin port of
// apps/pos-web/android/.../SppPrinterPlugin.java. Byte-building logic below
// is ported near-verbatim from apps/pos-web/src/native/printer.ts; SPP has
// no MTU concept (unlike the BLE transport pos-web also supports, which
// this app doesn't — see plan's "v1 ports SPP only" scoping), so the whole
// payload is written in one call, no chunking.
import { invoke } from '@tauri-apps/api/core'

export interface PairedDevice {
  address: string
  name: string
}

const PLUGIN = 'plugin:spp-printer'

export function listPairedPrinters(): Promise<PairedDevice[]> {
  return invoke<{ devices: PairedDevice[] }>(`${PLUGIN}|list_paired`).then((r) => r.devices)
}

export function connectPrinter(address: string): Promise<void> {
  return invoke(`${PLUGIN}|connect`, { address })
}

export function disconnectPrinter(address: string): Promise<void> {
  return invoke(`${PLUGIN}|disconnect`, { address })
}

function writeBytes(address: string, data: Uint8Array): Promise<void> {
  return invoke(`${PLUGIN}|write`, { address, data: Array.from(data) })
}

// ── ESC/POS byte builders ────────────────────────────────────────────────
const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

/** ESC @ — initialize/clear printer state. */
const CMD_INIT = Uint8Array.of(ESC, 0x40)
/** ESC a n — justify (0=left,1=center,2=right). */
const justify = (n: number) => Uint8Array.of(ESC, 0x61, n)
/** GS V m — cut paper (0 = full cut). */
const CMD_CUT = Uint8Array.of(GS, 0x56, 0x00)

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function concat(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

export async function printTestReceipt(address: string): Promise<void> {
  const payload = concat(
    CMD_INIT,
    justify(1),
    encodeText('Purdia POS\n'),
    encodeText('Test receipt\n'),
    Uint8Array.of(LF, LF, LF),
    CMD_CUT,
  )
  await writeBytes(address, payload)
}

export async function printReceipt(address: string, lines: readonly string[]): Promise<void> {
  const body = concat(...lines.map((l) => concat(encodeText(l), Uint8Array.of(LF))))
  const payload = concat(CMD_INIT, justify(0), body, Uint8Array.of(LF, LF, LF), CMD_CUT)
  await writeBytes(address, payload)
}
