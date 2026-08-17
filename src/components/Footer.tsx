import { Video } from "lucide-react";
import { FOOTER_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-indigo-500" />
          <span className="text-sm font-medium text-white">
            AI Video Analysis
          </span>
        </div>

        <div className="flex gap-6">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
