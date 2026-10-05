"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

/** Live local time in the owner's timezone (renders after mount to avoid hydration drift). */
export default function LocalTime({ withZone = true }: { withZone?: boolean }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: site.timezone,
    });
    const update = () => setNow(fmt.format(new Date()));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {now ?? "--:--:--"}
      {withZone && " IST"}
    </span>
  );
}
