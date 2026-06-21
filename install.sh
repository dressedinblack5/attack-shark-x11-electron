#!/usr/bin/env bash
set -euo pipefail

GITHUB_REPO="dressedinblack5/attack-shark-x11-electron"
APP_NAME="attack-shark-x11"
UDEV_RULES="/etc/udev/rules.d/99-${APP_NAME}.rules"

# build from source — no prebuilt releases
TAG=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null \
	| grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || true)
# if no releases exist, use HEAD
REF=${TAG:-main}
TAR_URL="https://github.com/${GITHUB_REPO}/archive/${REF}.tar.gz"

# --- helpers -----------------------------------------------------------

color() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
green()  { color 32 "$*"; }
yellow() { color 33 "$*"; }
red()    { color 31 "$*"; }

# --- udev rules --------------------------------------------------------

write_udev() {
	if [ -f "$UDEV_RULES" ]; then
		green "Udev rules already present, skipping."
		return
	fi
	yellow "Setting up udev rules (requires sudo) …"
	sudo tee "$UDEV_RULES" >/dev/null <<'UDEV'
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa60", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa55", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa61", MODE="0666", GROUP="plugdev"
UDEV
	sudo udevadm control --reload-rules
	sudo udevadm trigger
}

# --- deps --------------------------------------------------------------

install_bun() {
	if command -v bun &>/dev/null; then return; fi
	yellow "Installing Bun …"
	curl -fsSL https://bun.sh/install | bash
	# shellcheck disable=SC2016
	echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.bashrc"
	echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.bashrc"
	export BUN_INSTALL="$HOME/.bun"
	export PATH="$BUN_INSTALL/bin:$PATH"
}

ensure_deps() {
	yellow "Checking system dependencies …"
	if [ -f /etc/arch-release ]; then
		local missing=()
		command -v rustc &>/dev/null || missing+=(rust)
		command -v gcc   &>/dev/null || missing+=(base-devel)
		ldconfig -p | grep -q libusb 2>/dev/null || missing+=(libusb)
		if [ ${#missing[@]} -gt 0 ]; then
			yellow "Installing: ${missing[*]}"
			sudo pacman -S --needed --noconfirm "${missing[@]}"
		fi
	elif grep -qi "ubuntu\|debian" /etc/os-release 2>/dev/null; then
		local missing=()
		command -v rustc &>/dev/null || missing+=(rustc cargo)
		command -v gcc   &>/dev/null || missing+=(build-essential)
		dpkg -s libusb-1.0-0-dev &>/dev/null 2>&1 || missing+=(libusb-1.0-0-dev)
		if [ ${#missing[@]} -gt 0 ]; then
			yellow "Installing: ${missing[*]}"
			sudo apt update -qq && sudo apt install -y "${missing[@]}"
		fi
	else
		# assume the user has rust etc.
		command -v rustc &>/dev/null || { red "rustc required — install rustup: https://rustup.rs"; exit 1; }
		command -v gcc   &>/dev/null || { red "C compiler required — install build-essential / base-devel"; exit 1; }
	fi
}

# --- build from source -------------------------------------------------

build_from_source() {
	local tmp_dir
	tmp_dir=$(mktemp -d)
	cd "$tmp_dir"

	yellow "Downloading source …"
	curl -fsSL "$TAR_URL" -o source.tar.gz
	tar xzf source.tar.gz
	cd attack-shark-x11-* 2>/dev/null || cd */ 2>/dev/null

	yellow "Installing JS dependencies …"
	bun install 2>&1 | tail -1

	yellow "Building (this will take a minute) …"
	bun run package 2>&1 | tail -5

	# locate the AppImage
	local appimage
	appimage=$(ls dist/*.AppImage 2>/dev/null | head -1)
	if [ -z "$appimage" ]; then
		# maybe built as deb — install that instead
		local deb
		deb=$(ls dist/*.deb 2>/dev/null | head -1)
		if [ -n "$deb" ]; then
			yellow "Installing .deb …"
			sudo dpkg -i "$deb" 2>/dev/null || sudo apt install -f -y
			cd / && rm -rf "$tmp_dir"
			return
		fi
		red "Build output not found in dist/"
		exit 1
	fi

	# install AppImage
	local bin_dir="${HOME}/.local/bin"
	local desktop_dir="${HOME}/.local/share/applications"
	local icon_dir="${HOME}/.local/share/icons/hicolor/scalable/apps"
	mkdir -p "$bin_dir" "$desktop_dir" "$icon_dir"

	cp "$appimage" "${bin_dir}/${APP_NAME}"
	chmod +x "${bin_dir}/${APP_NAME}"

	# icon — use the one from the build
	cp assets/attack-shark-x11.svg "${icon_dir}/" 2>/dev/null || true

	cat >"${desktop_dir}/${APP_NAME}.desktop" <<EOF
[Desktop Entry]
Name=Attack Shark X11
Comment=Configuration tool for the Attack Shark X11 gaming mouse
Exec=${bin_dir}/${APP_NAME}
Icon=attack-shark-x11
Terminal=false
Type=Application
Categories=HardwareSettings;Settings;
Keywords=mouse;gaming;driver;
EOF

	cd / && rm -rf "$tmp_dir"

	if ! echo "$PATH" | tr ':' '\n' | grep -qxF "$bin_dir"; then
		yellow "Tip: add ~/.local/bin to your PATH:"
		echo "  export PATH=\"\$HOME/.local/bin:\$PATH\"  # >> ~/.bashrc"
	fi

	green "Installed to ${bin_dir}/${APP_NAME}"
}

# --- main --------------------------------------------------------------

main() {
	green "=== Attack Shark X11 Installer ==="
	echo "   building from source"
	echo

	write_udev
	install_bun
	ensure_deps
	build_from_source

	echo
	green "Done. Launch 'Attack Shark X11' from your app menu or run: ${APP_NAME}"
}

main
