"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { placeholderMedia } from "@/lib/media";
import Modal from "@/components/ui/Modal";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function MediaGallery() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = placeholderMedia.find((m) => m.id === selectedId);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="mb-2 text-center text-3xl font-bold text-foreground">
        Highlights
      </h2>
      <p className="mb-10 text-center text-foreground/50">
        Epic moments from game night
      </p>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {placeholderMedia.map((item) => (
          <motion.button
            key={item.id}
            variants={staggerItem}
            onClick={() => setSelectedId(item.id)}
            className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-light transition hover:border-neon/50"
          >
            {/* Placeholder colored rectangle */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-light to-surface-lighter">
              <span className="text-4xl opacity-30">🎮</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-left text-sm font-medium text-foreground/90">
                {item.title}
              </p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <Modal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.title}
      >
        <div className="aspect-video rounded-lg bg-surface-light flex items-center justify-center">
          <span className="text-6xl opacity-30">🎮</span>
        </div>
      </Modal>
    </section>
  );
}
