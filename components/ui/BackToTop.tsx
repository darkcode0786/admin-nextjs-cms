"use client";

import { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-4 bottom-5 z-40 inline-flex size-11 items-center justify-center rounded-full bg-rose text-white shadow-[0_10px_24px_rgba(6,21,50,0.18)] hover:bg-rose-dark sm:right-6 sm:bottom-6"
    >
      <LuArrowUp className="size-5" />
    </button>
  );
}
