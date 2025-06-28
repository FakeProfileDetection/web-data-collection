/* tslint:disable */
/* eslint-disable */
export class KeystrokeCapture {
  free(): void;
  constructor(capacity: number);
  capture_keystroke(key: string, is_release: boolean): void;
  get_event_count(): number;
  export_as_csv(): string;
  clear(): void;
  get_raw_data(): any;
  get_last_10_events(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_keystrokecapture_free: (a: number, b: number) => void;
  readonly keystrokecapture_new: (a: number) => [number, number, number];
  readonly keystrokecapture_capture_keystroke: (a: number, b: number, c: number, d: number) => [number, number];
  readonly keystrokecapture_get_event_count: (a: number) => number;
  readonly keystrokecapture_export_as_csv: (a: number) => [number, number];
  readonly keystrokecapture_clear: (a: number) => void;
  readonly keystrokecapture_get_raw_data: (a: number) => [number, number, number];
  readonly keystrokecapture_get_last_10_events: (a: number) => [number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
