export default function ColorDot({ color }: { color: string }) {
  return <span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{ backgroundColor: color }} />
}
