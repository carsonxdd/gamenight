"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  wide?: boolean;
}

export default function Modal({ open, onClose, children, title, wide }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.8,
            }}
            className={`relative w-full rounded-xl border border-border bg-surface p-4 sm:p-6 max-h-[90vh] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-lg"}`}
          >
            {title && (
              <h2 className="mb-4 text-lg font-bold text-foreground">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-foreground/50 transition hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
