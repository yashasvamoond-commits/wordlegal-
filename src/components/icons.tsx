import type { SVGProps } from 'react'

const P: Record<string, string> = {
  back: 'M15 18l-6-6 6-6',
  forward: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  close: 'M18 6L6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M20 6L9 17l-5-5',
  more: 'M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z',
  morev: 'M13 12a1 1 0 11-2 0 1 1 0 012 0zM13 5a1 1 0 11-2 0 1 1 0 012 0zM13 19a1 1 0 11-2 0 1 1 0 012 0z',
  undo: 'M3 7v6h6M3.5 13a9 9 0 1 0 2.6-8.5L3 7',
  redo: 'M21 7v6h-6M20.5 13a9 9 0 1 1-2.6-8.5L21 7',
  doc: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4',
  docs: 'M8 3h8l4 4v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zM4 7v13a2 2 0 002 2h9',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  star: 'M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  copy: 'M9 9h10a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8a2 2 0 012-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
  share: 'M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M12 3v13M16 7l-4-4-4 4',
  download: 'M12 3v12M7 11l5 5 5-5M4 21h16',
  upload: 'M12 17V5M7 9l5-5 5 5M4 21h16',
  print: 'M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2M6 14h12v7H6z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  bold: 'M6 4h7a4 4 0 010 8H6zM6 12h8a4 4 0 010 8H6z',
  italic: 'M19 4h-9M14 20H5M15 4L9 20',
  underline: 'M6 4v7a6 6 0 0012 0V4M4 21h16',
  strike: 'M4 12h16M16 7a4 3 0 00-4-2c-2.2 0-4 1-4 3 0 1.6 1.4 2.3 3 2.8M8 17a4 3 0 004 2c2.2 0 4-1 4-3',
  sub: 'M4 5v6a4 4 0 008 0V5M20 18h-6l6-4v6',
  sup: 'M4 15v-6a4 4 0 018 0v6M14 10h6l-6 4h6',
  palette: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 3v4M12 21v-2M3 12h4M21 12h-4',
  highlighter: 'M9 11l-6 6v3h3l6-6M15 3l6 6-8 8-6-6z',
  alignLeft: 'M3 6h18M3 12h12M3 18h15',
  alignCenter: 'M3 6h18M6 12h12M5 18h14',
  alignRight: 'M3 6h18M9 12h12M6 18h15',
  alignJustify: 'M3 6h18M3 12h18M3 18h18',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  listOrdered: 'M10 6h11M10 12h11M10 18h11M4 4h1v5M4 15h2M4 19h2M6 17c0-1-2-1-2 0M6 15c0-1-2-1-2 0',
  indentInc: 'M3 5h18M11 12h10M3 19h18M3 9l4 3-4 3',
  indentDec: 'M3 5h18M11 12h10M3 19h18M7 9l-4 3 4 3',
  lineSpacing: 'M3 5h18M3 12h18M3 19h18M21 5l-2 2 2 2M21 15l-2 2 2 2',
  font: 'M4 20L10 5h2l6 15M7 14h8',
  textSize: 'M3 18L8 6h2l5 12M5 14h8M16 18v-8M16 10c0-1.5 1-2 2-2M21 18h-5',
  table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14',
  image: 'M3 5h18v14H3zM8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 16l-5-5-9 8',
  link: 'M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1',
  pageBreak: 'M4 3h16v6H4zM4 15h16v6H4zM4 12h16M9 9l3 3 3-3',
  calendar: 'M4 6h16v14H4zM8 3v4M16 3v4M4 11h16',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  scales: 'M12 3v18M7 21h10M4 8h16M6 8l-3 7h6zM18 8l-3 7h6z',
  book: 'M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2zM8 3v18M12 8h4M12 12h4',
  law: 'M12 3v18M5 21h14M7 6l10-3 2 4-10 3zM17 7l2 8h-4z',
  layout: 'M3 3h18v18H3zM9 3v18M9 9h12',
  page: 'M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h6',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
  zoomIn: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3M8 11h6M11 8v6',
  zoomOut: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3M8 11h6',
  fit: 'M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3',
  refresh: 'M21 12a9 9 0 11-3-6.7M21 3v6h-6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5',
  warning: 'M12 3l9 16H3zM12 9v5M12 17v.5',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  edit: 'M4 20h4l11-11-4-4L4 16zM14 5l4 4',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 3v6h6M12 8v4l3 2',
  fileText: 'M14 3H6v18h12V7zM14 3v4h4M8 12h8M8 16h5',
  eraser: 'M4 16L15 5l5 5L9 21H4zM10 21h11',
  keyboard: 'M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8',
  portrait: 'M7 3h10v18H7zM10 18h4',
  landscape: 'M3 7h18v10H3zM18 10v4',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  pin: 'M12 17v5M8 3h8l-1 7 3 3H6l3-3z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4',
  rupee: 'M6 4h12M6 9h12M15 4c0 6-4 7-9 7l8 9',
  listCheck: 'M9 6h12M9 12h12M9 18h12M4 5l1 1 2-2M4 11l1 1 2-2M4 17l1 1 2-2',
  move: 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  signature: 'M3 17c3 0 4-6 6-6s1 6 3 6 3-9 5-9 0 9 4 9M3 21h18',
}

export type IconName = keyof typeof P | string

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  sw?: number
}

export function Icon({ name, size = 20, sw = 1.8, ...rest }: IconProps) {
  const d = P[name] ?? P.info
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  )
}
