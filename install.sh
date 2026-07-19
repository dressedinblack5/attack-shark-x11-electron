#!/usr/bin/env bash
set -euo pipefail

APP_NAME="attack-shark-x11"
UDEV_RULES="/etc/udev/rules.d/99-${APP_NAME}.rules"

# --- helpers -----------------------------------------------------------

color() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
green()  { color 32 "$*"; }
yellow() { color 33 "$*"; }
red()    { color 31 "$*"; }

# --- distro detection & package management -----------------------------

detect_package_manager() {
    if command -v pacman &>/dev/null; then echo "pacman";
    elif command -v apt-get &>/dev/null; then echo "apt";
    elif command -v dnf &>/dev/null; then echo "dnf";
    elif command -v zypper &>/dev/null; then echo "zypper";
    else echo "unknown"; fi
}

install_package() {
    local pm=$(detect_package_manager)
    yellow "Attempting to install '$1' using $pm..."
    case $pm in
        pacman) sudo pacman -S --needed --noconfirm "$1" ;;
        apt) sudo apt-get update && sudo apt-get install -y "$1" ;;
        dnf) sudo dnf install -y "$1" ;;
        zypper) sudo zypper install -y "$1" ;;
        *) red "Unknown package manager. Please install '$1' manually."; exit 1 ;;
    esac
}

# --- udev rules --------------------------------------------------------

write_udev() {
	if [ -f "$UDEV_RULES" ]; then
		green "Udev rules already present, skipping."
		return
	fi
	yellow "Setting up udev rules (requires sudo) …"
	sudo tee "$UDEV_RULES" >/dev/null <<'UDEV'
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa60", MODE="0666", TAG+="uaccess"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa55", MODE="0666", TAG+="uaccess"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa61", MODE="0666", TAG+="uaccess"
UDEV
	sudo udevadm control --reload-rules
	sudo udevadm trigger
}

# --- deps --------------------------------------------------------------

ensure_node_and_bun() {
    # 1. Install Node/npm if missing
    if ! command -v npm &>/dev/null; then
        yellow "npm not found. Installing Node.js..."
        install_package "nodejs"
        install_package "npm"
    fi

    # 2. Install Bun if missing
    if ! command -v bun &>/dev/null; then
        yellow "Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
    fi
}

ensure_build_deps() {
	yellow "Checking system build dependencies …"
    # Basic requirements for Electron/Rust
    local pm=$(detect_package_manager)
    if [ "$pm" == "pacman" ]; then
        sudo pacman -S --needed --noconfirm rust base-devel libusb
    elif [ "$pm" == "apt" ]; then
        sudo apt-get update && sudo apt-get install -y rustc cargo build-essential libusb-1.0-0-dev
    elif [ "$pm" == "dnf" ]; then
        sudo dnf groupinstall -y "Development Tools"
        sudo dnf install -y rust cargo libusb-devel
    fi
}

# --- build from source -------------------------------------------------

build_local() {
	yellow "Installing JS dependencies …"
	bun install

	yellow "Building (this will take a minute) …"
	bun run package

	# locate the AppImage
	local appimage
	appimage=$(ls dist/*.AppImage 2>/dev/null | head -1)
	if [ -z "$appimage" ]; then
		red "Build output not found in dist/"
		exit 1
	fi

	# install
	local bin_dir="${HOME}/.local/bin"
	local desktop_dir="${HOME}/.local/share/applications"
	local icon_dir="${HOME}/.local/share/icons/hicolor/scalable/apps"
	mkdir -p "$bin_dir" "$desktop_dir" "$icon_dir"

	cp "$appimage" "${bin_dir}/${APP_NAME}"
	chmod +x "${bin_dir}/${APP_NAME}"

	# icon
	local installed_icon="${icon_dir}/atackshark.png"
	cp assets/atackshark.png "$installed_icon" 2>/dev/null || true

	cat >"${desktop_dir}/${APP_NAME}.desktop" <<EOF
[Desktop Entry]
Name=Attack Shark X11
Comment=Configuration tool for the Attack Shark X11 gaming mouse
Exec=${bin_dir}/${APP_NAME}
Icon=${installed_icon}
Terminal=false
Type=Application
Categories=HardwareSettings;Settings;
Keywords=mouse;gaming;driver;
EOF

	green "Installed to ${bin_dir}/${APP_NAME}"
}

# --- main --------------------------------------------------------------

main() {
	green "=== Attack Shark X11 Installer ==="
	
    write_udev
    ensure_node_and_bun
    ensure_build_deps
    build_local

	echo
	green "Done. Launch 'Attack Shark X11' from your app menu or run: ${APP_NAME}"
}

main
