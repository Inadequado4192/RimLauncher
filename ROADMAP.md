# ROADMAP

- Unsubscribe from Steam mods
- Toggle native title bar
- Dependency tree visualization for mods
- Migrate build system to `electron-builder`

---

### Long-term

- XML Mod builder

---

### Known Issues

- `useFetchWorkshopDetails` causes redundant fetches — optimize to reduce unnecessary calls  
- Modpack currently replaces entire `modConfig.xml`; should update only the `<activeMods>` section
