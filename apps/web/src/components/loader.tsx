export default function AppLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-black"
      role="status"
      aria-label="Loading"
    >
      <div className="flex h-12 w-12 items-center justify-center border border-[#5eead4]/50">
        <div className="h-3 w-3 rotate-45 bg-[#5eead4] animate-spin" />
      </div>
    </div>
  );
}
