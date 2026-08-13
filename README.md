# Florence Desktop

Florence — akıllı yatırım asistanının masaüstü istemcisi. Piyasa verileri, yapay zekâ analizleri ve sanal portföy yönetimini tek bir masaüstü uygulamasında sunar. [Tauri 2](https://tauri.app) + Rust arka uç; ön yüz, `web/` git-subtree'sindeki React/Vite uygulamasıdır (`web/dist` prodüksiyon ön yüzü olarak paketlenir).

## İçindekiler

1. [Ön Koşullar](#ön-koşullar)
2. [Geliştirme](#geliştirme)
3. [Build](#build)
4. [Release Akışı](#release-akışı)
5. [Mimari](#mimari)
6. [Sorun Giderme](#sorun-giderme)
7. [Test](#test)

## Ön Koşullar

- **Rust** (stable, `rustup` ile)
- **Node.js 20+** (npm)
- **Linux sistem paketleri** (Tauri 2 WebKitGTK gereksinimleri):

  ```bash
  sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

  - `libwebkit2gtk-4.1-dev` — webview katmanı (zorunlu)
  - `libayatana-appindicator3-dev` — sistem tepsisi (tray) ikonu (zorunlu)
  - `librsvg2-dev` — AppImage bundling

## Geliştirme

```bash
npm install            # kök bağımlılıklar (@tauri-apps/cli, cross-env)
npm run dev            # = tauri dev → web dev sunucusu (Vite, :5173) + Rust uygulaması
```

`npm run dev` önce `web/` içinde Vite'i, sonra Tauri uygulamasını başlatır. Kod değişiklikleri: Rust tarafı `src-tauri/`, ön yüz `web/src/` (doğrudan `web/` içinde düzenlenir; değişiklikler subtree sync ile gelir).

## Build

```bash
npm run build          # = cross-env NO_STRIP=1 tauri build
```

- Çıktılar: `src-tauri/target/release/bundle/` (deb, rpm, AppImage, dmg, msi, exe…)
- **`NO_STRIP=1` zorunludur**: tauri-action'ın CI ortamında uyguladığı `strip` davranışını yerel build'de de eşitler; CI ile tutarlı binary üretir.
- Prodüksiyon ön yüzü `web/dist`'ten paketlenir (`beforeBuildCommand: npm --prefix web run build`).

## Release Akışı

Tek aksiyon: **web repo'sunda `vX.Y.Z` tag atmak.** Gerisi otomatik:

```
web repo (project-florence/web)
  │  package.json version → vX.Y.Z tag
  ▼
tag-from-version.yml (web)
  ├─► deploy iş akışı            → sunucu (web uygulaması yayını)
  └─► sync-desktop.yml (web)
        ├─ git subtree pull --prefix web  → desktop/web güncellenir
        ├─ package.json + src-tauri/tauri.conf.json version = X.Y.Z
        └─ desktop'a aynı vX.Y.Z tag
              ▼
        build.yml (desktop, tag tetiklemeli)
          ├─ tauri-action → Windows/Linux/macOS (aarch64+x86_64) binary'leri
          │    tagName: v__VERSION__ (tauri.conf.json'dan okur) → draft release
          └─ publish işi → sunucu /downloads + manifest.json (indirme listesi)
```

- Sürümün tek kaynağı `web/package.json`'dır; `src-tauri/tauri.conf.json` ve kök `package.json` sync sırasında eşitlenir.
- `build.yml` her `v*` tag'inde tetiklenir; `tauri-action` `releaseDraft: true` ile draft release açar, `publish` işi binary'leri `/usr/share/nginx/html/downloads`'a yükler ve `manifest.json` üretir.
- macOS sürümleri hem `aarch64-apple-darwin` hem `x86_64-apple-darwin` hedefleriyle derlenir.

## Mimari

- **Tauri 2 + Rust (edition 2021)**: `src-tauri/src/lib.rs` — uygulama girişi, tray, window event'leri ve 4 Tauri command'ı; `src-tauri/src/store.rs` — şifreli depo soyutlaması.
- **`web/` git-subtree**: ön yüz ayrı `project-florence/web` repo'sunda geliştirilir, `sync-desktop.yml` ile desktop'a squash-merge edilir. **`web/` içindeki dosyaları doğrudan düzenlemeyin** — bir sonraki sync'te üzerine yazılır.
- **Command sözleşmesi** (frontend `web/src/lib/desktop.ts` ile paylaşılır — isimler ve parametreler **asla değiştirilmemeli**):
  - `secure_store_set { key, value }` / `secure_store_get { key }` / `secure_store_delete { key }` → OS keyring'i (`florence-desktop` servisi; erişim/refresh token saklar)
  - `notify { title, body }` → masaüstü bildirimi
- **State**: `AppState { store: Box<dyn SecureStore> }` `Builder::manage` ile enjekte edilir; command'lar `State<'_, AppState>` üzerinden `SecureStore` trait metodlarını çağırır (üretimde `KeyringStore`, testlerde `MockStore`).
- **Tray davranışı**: sol tık → pencereyi göster; menü → "Florence'i Göster" / "Çıkış" (`app.exit(0)` — gerçek çıkış).
- **Hide-on-close** (Windows/Linux, macOS hariç): pencere kapatılınca uygulama çıkmaz; pencere gizlenir, tepside çalışmaya devam eder ve "Florence tepside çalışmaya devam ediyor" bildirimi gösterilir. Çıkış yalnızca tray "Çıkış" menüsünden yapılır.
- **Wayland/NVIDIA reçetesi** (`lib.rs` içinde): NVIDIA + WebKitGTK DMABUF çakışmasında pencere boş gelir/crash olur. Uygulama başlangıcında (kullanıcı override etmediyse) `WEBKIT_DISABLE_DMABUF_RENDERER=1` ve `__NV_DISABLE_EXPLICIT_SYNC=1` ayarlanır; `GDK_BACKEND` x11'e zorlanmaz (native Wayland korunur), `WEBKIT_DISABLE_COMPOSITING_MODE` bilerek ayarlanmaz (yazılım render'a düşer, kaydırma akıcılığı ölür).
- **CSP**: `tauri.conf.json`'da `security.csp` (prod) ve `security.devCsp` (dev) tanımlıdır. `style-src 'unsafe-inline'` klinecharts'ın runtime style enjeksiyonu için şarttır; `connect-src` API (`api.florencex.com.tr`) erişimini açar; `devCsp` ayrıca Vite HMR için `localhost:5173` (http + ws) kaynaklarını içerir.

## Sorun Giderme

- **Keyring `NoEntry`**: Kayıt bulunamadığı normal bir durumdur — `secure_store_get` `Ok(None)` döner (hata değil). Frontend bu durumda `localStorage`'a düşer. Kalıcı keyring hatası olursa (ör. oturum kilidi altında Secret Service erişilemez): oturumu kilitleyip açın ya da `secret-tool clear` ile `florence-desktop` servisini temizleyin.
- **Wayland'da boş/beyaz pencere veya "Gdk Error 71"**: NVIDIA + WebKitGTK DMABUF çakışması. Uygulama env reçetesini otomatik uygular; elle de deneyebilirsiniz:
  ```bash
  WEBKIT_DISABLE_DMABUF_RENDERER=1 __NV_DISABLE_EXPLICIT_SYNC=1 npm run dev
  ```
- **Dev'de HMR çalışmıyor / CSP ihlali**: `devCsp` olmadan Vite HMR (ws://localhost:5173) ve `'unsafe-inline'` script engellenir. `tauri.conf.json` → `security.devCsp` tanımlı olduğundan emin olun; değişiklik sonrası `npm run dev`'i yeniden başlatın.
- **Tray ikonu görünmüyor**: `libayatana-appindicator3-dev` kurulu değil (Linux). Kurun ve rebuild edin.

## Test

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

- `src-tauri/src/store.rs` — `SecureStore` trait'i, `KeyringStore` (NoEntry → `Ok(None)` dahil) ve `MockStore` unit testleri (set/get/delete, hata string'leri).
- `src-tauri/src/lib.rs` — tray menü id eşleştirmesi (`tray_menu_action`) ve `AppState` + `MockStore` wiring testleri.
