# Maintainer: YourName <your-email@example.com>
pkgname=attack-shark-x11-electron
pkgver=1.0.1
pkgrel=1
pkgdesc="Cross-platform driver for the Attack Shark X11 gaming mouse with Electron GUI"
arch=('x86_64')
url="https://github.com/dressedinblack5/attack-shark-x11-electron"
license=('MIT')
depends=('electron' 'libusb')
options=('!strip')
source=("$pkgname-$pkgver.tar.gz::$url/archive/refs/tags/v$pkgver.tar.gz")
sha256sums=('SKIP')

build() {
  cd "$pkgname-$pkgver"
  npm install
  npm run build
}

package() {
  cd "$pkgname-$pkgver"
  
  # Install the executable
  install -Dm755 dist/Attack\ Shark\ X11\ Driver-$pkgver.AppImage "$pkgdir/usr/bin/attack-shark-x11-driver"
  
  # Optional: If you want to include the desktop entry, you would add it here
  # install -Dm644 assets/icon.png "$pkgdir/usr/share/pixmaps/attack-shark-x11.png"
}
