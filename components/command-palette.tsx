"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  GitCommit,
  GitCompare,
  Rocket,
  Settings,
  Home,
  Keyboard,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShowHelp: () => void
  onFocusSearch: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onShowHelp,
  onFocusSearch,
}: CommandPaletteProps) {
  const router = useRouter()

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false)
      command()
    },
    [onOpenChange]
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Search Modes">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/")
                setTimeout(onFocusSearch, 100)
              })
            }
          >
            <GitCommit className="mr-2 h-4 w-4" />
            <span>Single Commit</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/")
                setTimeout(onFocusSearch, 100)
              })
            }
          >
            <GitCompare className="mr-2 h-4 w-4" />
            <span>Changelog</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/")
                setTimeout(onFocusSearch, 100)
              })
            }
          >
            <Rocket className="mr-2 h-4 w-4" />
            <span>Deployment</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => runCommand(onShowHelp)}>
            <Keyboard className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
