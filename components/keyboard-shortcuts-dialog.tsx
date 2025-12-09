"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  shortcuts: ShortcutItem[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["/"], description: "Focus search input" },
      { keys: ["Cmd", "K"], description: "Open command palette" },
      { keys: ["Esc"], description: "Close dialogs / blur input" },
    ],
  },
  {
    title: "Results",
    shortcuts: [
      { keys: ["\u2191", "\u2193"], description: "Navigate through items" },
      { keys: ["Enter"], description: "Select / open item" },
    ],
  },
  {
    title: "Help",
    shortcuts: [{ keys: ["?"], description: "Show this dialog" }],
  },
]

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 text-xs font-medium bg-secondary border border-border rounded shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Navigate faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <span key={key} className="flex items-center gap-1">
                          {index > 0 && (
                            <span className="text-muted-foreground text-xs">
                              +
                            </span>
                          )}
                          <KeyboardKey>{key}</KeyboardKey>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <KeyboardKey>Esc</KeyboardKey> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
