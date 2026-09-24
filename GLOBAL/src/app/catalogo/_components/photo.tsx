export default function Photo({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  return <div className={`flex items-center justify-center overflow-hidden bg-[#f4f3f0] ${className}`}>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} loading="lazy" className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-300 group-hover:scale-105" />
    ) : <span className="text-sm text-neutral-600">Foto pendente</span>}
  </div>;
}
