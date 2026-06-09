import { homedir } from "node:os";
import { join } from "node:path";

const home = homedir();

export const SOURCES = [
  { id: "terminal-app", label: "Terminal.app", src: join(home, "Library/Preferences/com.apple.Terminal.plist"), dest: join(home, "Library/Preferences/com.apple.Terminal.plist"), kind: "file" as const },
  { id: "iterm2-prefs", label: "iTerm2", src: join(home, "Library/Preferences/com.googlecode.iterm2.plist"), dest: join(home, "Library/Preferences/com.googlecode.iterm2.plist"), kind: "file" as const },
  { id: "iterm2-profiles", label: "iTerm2 profiles", src: join(home, "Library/Application Support/iTerm2/DynamicProfiles"), dest: join(home, "Library/Application Support/iTerm2/DynamicProfiles"), kind: "dir" as const },
  { id: "cursor-settings", label: "Cursor", src: join(home, "Library/Application Support/Cursor/User/settings.json"), dest: join(home, "Library/Application Support/Cursor/User/settings.json"), kind: "settings-merge" as const },
  { id: "vscode-settings", label: "VS Code", src: join(home, "Library/Application Support/Code/User/settings.json"), dest: join(home, "Library/Application Support/Code/User/settings.json"), kind: "settings-merge" as const },
  { id: "alacritty", label: "Alacritty", src: join(home, ".config/alacritty/alacritty.toml"), dest: join(home, ".config/alacritty/alacritty.toml"), kind: "file" as const },
  { id: "kitty", label: "Kitty", src: join(home, ".config/kitty/kitty.conf"), dest: join(home, ".config/kitty/kitty.conf"), kind: "file" as const },
  { id: "starship", label: "Starship", src: join(home, ".config/starship.toml"), dest: join(home, ".config/starship.toml"), kind: "file" as const },
  { id: "p10k", label: "p10k", src: join(home, ".p10k.zsh"), dest: join(home, ".p10k.zsh"), kind: "file" as const },
] as const;

export const SETTING_PREFIXES = [
  "terminal.integrated.",
  "workbench.colorTheme",
  "workbench.colorCustomizations",
  "workbench.preferred",
] as const;
