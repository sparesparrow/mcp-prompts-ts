# MCP Prompts TypeScript - TODO

## Úkoly pro migraci a vývoj

### Fáze 1: Refaktoring a Cleanup
- [x] Odstranit ne-TypeScript kód (android_app/)
- [x] Odstranit adresáře extrahované v Phase 1 (prompts/, packages/)
- [x] Aktualizovat závislosti na versioned NPM balíčky
- [x] Vyčistit package.json od nepotřebných závislostí

### Fáze 2: Aktualizace Dependencies
- [x] Nahradit lokální workspace dependencies s versioned NPM balíčky
- [x] Přidat `@sparesparrow/mcp-prompts-contracts` jako dependency
- [x] Přidat `@sparesparrow/mcp-prompts-catalog` jako dependency
- [x] Aktualizovat importy v kódu

### Fáze 3: Opravy a Stabilizace
- [x] Opravit HTTP Server error handling unit testy
- [x] Opravit PromptService template helpers unit testy
- [x] Implementovat concurrency control pro FileAdapter
- [x] Přidat atomic writes pro bezpečné aktualizace

### Fáze 4: Pokročilé Funkce
- [x] Implementovat conditional logic v templating engine
- [x] Přidat nested templates / partials podporu
- [x] Implementovat configurable delimiters
- [x] Přidat helper functions pro šablony

### Fáze 5: CI/CD Pipeline
- [x] Nastavit GitHub Actions pro testy a build
- [x] Konfigurovat Docker image building a publishing
- [x] Nastavit automatické NPM package publishing
- [x] Přidat repository_dispatch event na meta-repo

### Fáze 6: Dokumentace
- [ ] Aktualizovat API dokumentaci
- [ ] Vytvořit příklady použití
- [ ] Dokumentovat konfigurační možnosti
- [ ] Vytvořit migrační průvodce

### Fáze 7: Testování
- [ ] Spustit kompletní test suite
- [ ] Otestovat integraci s novými balíčky
- [ ] Validovat Docker image
- [ ] Otestovat produkční deployment 