use keyring::Entry;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, Runtime};
use tauri_plugin_notification::NotificationExt;

const KEYRING_SERVICE: &str = "florence-desktop";

#[tauri::command]
fn secure_store_set(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn secure_store_get(key: String) -> Result<Option<String>, String> {
    let entry = Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn secure_store_delete(key: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
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
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
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
    // WebKitGTK, NVIDIA sürücüleriyle Wayland'da DMABUF/GBM buffer oluşturamıyor;
    // pencere boş geliyor ya da açılmıyor. Yazılım render'a düşmek güvenilir çalışır.
    // Kullanıcı kendi değerini set ettiyse ona saygı göster.
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        if std::env::var_os("WEBKIT_DISABLE_COMPOSITING_MODE").is_none() {
            std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        }
    }

    tauri::Builder::default()
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
        })
        .run(tauri::generate_context!())
        .expect("Florence başlatılamadı");
}
