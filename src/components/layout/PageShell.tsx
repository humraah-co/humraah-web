/** Standard page width and padding: 20 px on mobile, 80 px gutters on desktop. */
export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 lg:px-20 ${className}`}>{children}</div>;
}
