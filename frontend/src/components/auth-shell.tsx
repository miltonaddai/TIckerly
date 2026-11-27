import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col justify-center px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8"
      >
        <h1 className="text-center font-serif text-5xl sm:text-6xl">{title}</h1>
        {children}
      </motion.div>
    </section>
  );
}
