mod store;

use store::SecureStore;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, Runtime, State};
use tauri_plugin_notification::NotificationExt;

/// Tüm Tauri command'larının eriştiği paylaşılan durum.
///
/// `store` alanı üzerinden şifreli anahtar-değer deposuna erişilir;
/// üretimde `KeyringStore`, testlerde `MockStore` enjekte edilir.
pub struct AppState {
    store: Box<dyn SecureStore + Send + Sync>,
}

#[tauri::command]
fn secure_store_set(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    state.store.set(&key, &value)
}

#[tauri::command]
fn secure_store_get(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    state.store.get(&key)
}

#[tauri::command]
fn secure_store_delete(state: State<'_, AppState>, key: String) -> Result<(), String> {
    state.store.delete(&key)
}

#[tauri::command]
fn notify<R: Runtime>(app: tauri::AppHandle<R>, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

fn show_main_window<R: Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Tray menü tıklamasını eyleme çeviren saf fonksiyon (test edilebilir).
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum TrayAction {
    Show,
    Quit,
    Ignore,
}

fn tray_menu_action(id: &str) -> TrayAction {
    match id {
        "show" => TrayAction::Show,
        "quit" => TrayAction::Quit,
        _ => TrayAction::Ignore,
    }
}

fn handle_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>, id: &str) {
    match tray_menu_action(id) {
        TrayAction::Show => show_main_window(app),
        // 'Çıkış' gerçek çıkıştır: hide-on-close davranışını baypas eder.
        TrayAction::Quit => app.exit(0),
        TrayAction::Ignore => {}
    }
}

fn setup_tray<R: Runtime>(app: &mut tauri::App<R>) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Florence'i Göster", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let default_icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::InvalidIcon(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "window icon bulunamadı",
        )))?;

    TrayIconBuilder::with_id("florence-tray")
        .icon(default_icon)
        .tooltip("Florence")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| handle_tray_menu(app, event.id.as_ref()))
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // WebKitGTK, NVIDIA suruculeriyle Wayland'da DMABUF/GBM buffer olusturamiyor;
    // pencere bos geliyor ya da acilmiyor (AcceleratedSurfaceDMABuf hatalari,
    // Gdk Error 71 Protocol error). Arastirma sonucu dogru recete:
    //   - WEBKIT_DISABLE_DMABUF_RENDERER=1  -> beyaz ekran/crash'i cozer,
    //     GPU compositing korunur (akici kalir).
    //   - __NV_DISABLE_EXPLICIT_SYNC=1      -> Wayland Error 71 crash'ini
    //     PERFORMANS KAYBI OLMADAN cozer (NVIDIA 560+ + EGLStreams). AMD/Intel
    //     sistemlerde no-op'dur.
    //   - GDK_BACKEND x11'e ZORLANMAZ        -> uygulama native Wayland'da calisir
    //     (XWayland maliyeti ve quirk cakismalari olmaz).
    //   - WEBKIT_DISABLE_COMPOSITING_MODE BILEREK AYARLANMAZ -> yazilim render'a
    //     duser, kaydirma akiciligini oldurur (20-30 FPS). Kullanici override
    //     ederse kendi degeri korunur.
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        if std::env::var_os("__NV_DISABLE_EXPLICIT_SYNC").is_none() {
            std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
        }
    }

    let mut builder = tauri::Builder::default()
        .manage(AppState {
            store: Box::new(store::KeyringStore),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            secure_store_set,
            secure_store_get,
            secure_store_delete,
            notify
        ])
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        });

    // Hide-on-close: pencere kapatılınca uygulama çıkmaz, tepside çalışmaya
    // devam eder (tray 'Çıkış' menüsü gerçek çıkışı yapar).
    // macOS'ta standart davranış korunur: kapatınca uygulama çıkar.
    if cfg!(not(target_os = "macos")) {
        builder = builder.on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                let _ = notify(
                    window.app_handle().clone(),
                    "Florence".to_string(),
                    "Florence tepside çalışmaya devam ediyor".to_string(),
                );
            }
        });
    }

    builder
        .run(tauri::generate_context!())
        .expect("Florence başlatılamadı");
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::tests::MockStore;

    #[test]
    fn tray_menu_action_matches_show() {
        assert_eq!(tray_menu_action("show"), TrayAction::Show);
    }

    #[test]
    fn tray_menu_action_matches_quit() {
        assert_eq!(tray_menu_action("quit"), TrayAction::Quit);
    }

    #[test]
    fn tray_menu_action_ignores_unknown_ids() {
        assert_eq!(tray_menu_action("bogus"), TrayAction::Ignore);
        assert_eq!(tray_menu_action(""), TrayAction::Ignore);
    }

    #[test]
    fn app_state_works_with_mock_store() {
        let state = AppState {
            store: Box::new(MockStore::new()),
        };
        state.store.set("florence_access_token", "gizli").unwrap();
        assert_eq!(
            state.store.get("florence_access_token").unwrap(),
            Some("gizli".to_string())
        );
        state.store.delete("florence_access_token").unwrap();
        assert_eq!(state.store.get("florence_access_token").unwrap(), None);
    }
}
