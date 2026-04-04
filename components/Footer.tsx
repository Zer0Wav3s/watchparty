export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-[var(--border)] py-6">
      <div className="flex flex-col items-center gap-3 text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Zer0Wav3s"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors hover:text-[var(--text-primary)]"
          >
            GitHub
          </a>
          <span className="text-[var(--border)]">·</span>
          <a
            href="https://zerowaves.io"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors hover:text-[var(--text-primary)]"
          >
            zerowaves.io
          </a>
          <span className="text-[var(--border)]">·</span>
          <a
            href="https://x.com/Zer0Wav3s"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors hover:text-[var(--text-primary)]"
          >
            𝕏
          </a>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Built by ZeroWaves</p>
      </div>
    </footer>
  );
}
