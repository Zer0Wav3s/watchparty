import confetti from "canvas-confetti";

export function fireConfetti() {
  // First burst — center
  void confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"],
  });

  // Second burst — left side (slight delay)
  setTimeout(() => {
    void confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"],
    });
  }, 150);

  // Third burst — right side
  setTimeout(() => {
    void confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"],
    });
  }, 300);
}
