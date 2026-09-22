export async function triggerConfetti() {
  if (typeof window === "undefined") return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#22c55e", "#6366f1", "#a855f7", "#38bdf8"],
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback if canvas-confetti is not loaded
  }
}
