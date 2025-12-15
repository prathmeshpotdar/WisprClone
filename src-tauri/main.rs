use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let handle = app.handle();

      app.global_shortcut_manager()
        .register("Ctrl+Shift+Space", move || {
          handle.emit_all("toggle-recording", ());
        })?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error");
}
