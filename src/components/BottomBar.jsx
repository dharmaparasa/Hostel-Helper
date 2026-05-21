export function BottomBar({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4 pt-3 safe-bottom">
      <div className="panel border border-white/60 bg-white/95 p-3 shadow-soft backdrop-blur">
        {children}
      </div>
    </div>
  );
}
