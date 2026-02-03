// Docker などで node_modules が空のとき用のフォールバック。
// /// <reference types="react" /> は使わない（型パッケージがないとエラーになるため）。
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
