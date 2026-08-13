//! Güvenli (şifreli) anahtar-değer deposu soyutlaması.
//!
//! Tauri command'ları `SecureStore` trait'i üzerinden çalışır; üretimde
//! `KeyringStore` (işletim sistemi keyring'i), testlerde `MockStore` (bellek içi)
//! kullanılır. Böylece keyring mantığı unit test edilebilir ve command katmanı
//! depodan bağımsız kalır.

use keyring::Entry;

/// Keyring servis adı: tüm girdiler bu servis altında tutulur.
const KEYRING_SERVICE: &str = "florence-desktop";

/// Şifreli anahtar-değer deposu.
///
/// Tüm metodlar `&self` alır: implementasyonlar iç durumlarını kendileri
/// yönetir (thread-safe olmak zorundadır, trait `Send + Sync` gerektirir).
pub trait SecureStore: Send + Sync {
    /// `key` altındaki değeri `value` olarak kaydeder (varsa üzerine yazar).
    fn set(&self, key: &str, value: &str) -> Result<(), String>;
    /// `key` altındaki değeri okur; girdi yoksa `Ok(None)` döner.
    fn get(&self, key: &str) -> Result<Option<String>, String>;
    /// `key` altındaki girdiyi siler; girdi yoksa hata dönmez.
    fn delete(&self, key: &str) -> Result<(), String>;
}

/// OS keyring'i üzerinden çalışan üretim implementasyonu
/// (Linux: Secret Service, macOS: Keychain, Windows: Credential Manager).
pub struct KeyringStore;

impl SecureStore for KeyringStore {
    fn set(&self, key: &str, value: &str) -> Result<(), String> {
        let entry = Entry::new(KEYRING_SERVICE, key).map_err(|e| e.to_string())?;
        entry.set_password(value).map_err(|e| e.to_string())
    }

    fn get(&self, key: &str) -> Result<Option<String>, String> {
        let entry = Entry::new(KEYRING_SERVICE, key).map_err(|e| e.to_string())?;
        map_get_error(entry.get_password())
    }

    fn delete(&self, key: &str) -> Result<(), String> {
        let entry = Entry::new(KEYRING_SERVICE, key).map_err(|e| e.to_string())?;
        entry.delete_credential().map_err(|e| e.to_string())
    }
}

/// Keyring okuma sonucunu command dönüş tipine çevirir:
/// `NoEntry` → `Ok(None)` (girdi yok), diğer hatalar → `Err(string)`.
fn map_get_error(result: Result<String, keyring::Error>) -> Result<Option<String>, String> {
    match result {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Mutex;

    /// Bellek içi `SecureStore` — unit testler için (lib.rs testleri de kullanır).
    #[derive(Default)]
    pub struct MockStore {
        map: Mutex<HashMap<String, String>>,
    }

    impl MockStore {
        pub fn new() -> Self {
            Self::default()
        }
    }

    impl SecureStore for MockStore {
        fn set(&self, key: &str, value: &str) -> Result<(), String> {
            let mut map = self.map.lock().map_err(|e| e.to_string())?;
            map.insert(key.to_string(), value.to_string());
            Ok(())
        }

        fn get(&self, key: &str) -> Result<Option<String>, String> {
            let map = self.map.lock().map_err(|e| e.to_string())?;
            Ok(map.get(key).cloned())
        }

        fn delete(&self, key: &str) -> Result<(), String> {
            let mut map = self.map.lock().map_err(|e| e.to_string())?;
            map.remove(key);
            Ok(())
        }
    }

    /// Her çağrıda hata dönen store — hata string'lerinin taşındığını test eder.
    struct FailingStore;

    impl SecureStore for FailingStore {
        fn set(&self, _key: &str, _value: &str) -> Result<(), String> {
            Err("mock hata".to_string())
        }
        fn get(&self, _key: &str) -> Result<Option<String>, String> {
            Err("mock hata".to_string())
        }
        fn delete(&self, _key: &str) -> Result<(), String> {
            Err("mock hata".to_string())
        }
    }

    #[test]
    fn mock_set_get_roundtrip() {
        let store = MockStore::new();
        store.set("florence_access_token", "abc").unwrap();
        assert_eq!(
            store.get("florence_access_token").unwrap(),
            Some("abc".to_string())
        );
    }

    #[test]
    fn mock_set_overwrites_existing_value() {
        let store = MockStore::new();
        store.set("k", "v1").unwrap();
        store.set("k", "v2").unwrap();
        assert_eq!(store.get("k").unwrap(), Some("v2".to_string()));
    }

    #[test]
    fn mock_get_missing_returns_none() {
        let store = MockStore::new();
        assert_eq!(store.get("yok").unwrap(), None);
    }

    #[test]
    fn mock_delete_removes_value() {
        let store = MockStore::new();
        store.set("k", "v").unwrap();
        store.delete("k").unwrap();
        assert_eq!(store.get("k").unwrap(), None);
    }

    #[test]
    fn mock_delete_missing_is_ok() {
        let store = MockStore::new();
        assert!(store.delete("yok").is_ok());
    }

    #[test]
    fn keyring_no_entry_maps_to_none() {
        assert_eq!(map_get_error(Err(keyring::Error::NoEntry)), Ok(None));
    }

    #[test]
    fn keyring_value_maps_to_some() {
        assert_eq!(
            map_get_error(Ok("gizli".to_string())),
            Ok(Some("gizli".to_string()))
        );
    }

    #[test]
    fn keyring_other_error_maps_to_err_string() {
        let mapped = map_get_error(Err(keyring::Error::PlatformFailure(Box::new(
            std::io::Error::new(std::io::ErrorKind::Other, "mock platform hatası"),
        ))));
        assert!(matches!(mapped, Err(s) if !s.is_empty()));
    }

    #[test]
    fn error_strings_propagate_from_store() {
        let store = FailingStore;
        assert_eq!(store.set("k", "v"), Err("mock hata".to_string()));
        assert_eq!(store.get("k"), Err("mock hata".to_string()));
        assert_eq!(store.delete("k"), Err("mock hata".to_string()));
    }
}
