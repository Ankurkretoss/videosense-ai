"use client";

import Link from "next/link";
import { Video, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Video className="h-6 w-6 text-indigo-500" />
          <span className="text-lg font-semibold text-white">
            AI Video Analysis
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/sports-analysis"
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Sports Analysis
          </Link>
          <Link href="/analyze">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Analyze Video
            </Button>
          </Link>
        </div>

        <button
          className="text-gray-400 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-black/80 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-4 px-4 py-4">
              <Link
                href="/"
                className="block text-gray-400 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/sports-analysis"
                className="block text-gray-400 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Sports Analysis
              </Link>
              <Link href="/analyze" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Analyze Video
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
