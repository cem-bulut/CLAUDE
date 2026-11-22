# Gökkule

Android için tasarlanmış, Tetris tarzı blok yerleştirmeyi 3B bir platform macerasıyla birleştiren oyun.
Düşen blokları yerleştirerek gezgin **Ada**'ya merdiven örüyorsun ve onu havada süzülen kristallere ulaştırıyorsun.

- **[GDD.md](GDD.md):** Tam oyun tasarım belgesi (mekanikler, macera katmanı, kontroller, sanat, teknik plan, yol haritası).
- **[prototype/index.html](prototype/index.html):** Oynanabilir 3B prototip (Three.js, tek dosya, dokunmatik kontroller).

## Prototipi çalıştırma

Dosya internete bağlı herhangi bir tarayıcıda açılır (three.js cdnjs'ten yüklenir).

```bash
cd prototype && python3 -m http.server 8080
# Telefonda (aynı Wi-Fi): http://<bilgisayarın-IP'si>:8080
```

| Eylem | Dokunmatik | Klavye |
|---|---|---|
| Bloğu kaydır | ▲ ◀ ▶ ▼ | Ok tuşları |
| Döndür / devir | ↻ / ⤵ | Q / E |
| Hızlı bırak | BIRAK | Boşluk |
| Ada'yı yürüt | Bir zemine dokun | I J K L |
| Kamerayı çevir | Yatay kaydır veya ⟲ | C |

## Android APK'ya paketleme (Capacitor)

Android Studio ve JDK 17 gerekir.

```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init Gokkule com.example.gokkule --web-dir=prototype
npx cap add android
npx cap sync android
npx cap open android      # Android Studio'da Run ya da Build > Build APK
```

Notlar:
- Çevrimdışı çalışması için `three.min.js` dosyasını `prototype/` içine indirip `<script src>` yolunu yerel dosyaya çevirin.
- Dikey ekranı sabitlemek için `android/app/src/main/AndroidManifest.xml` içindeki activity'ye `android:screenOrientation="portrait"` ekleyin.
- Tam sürüm için GDD'de önerilen yol Godot 4'tür (bkz. GDD §10.1).

## Doğum Günü Mumu (mobil uygulama)

Telefonun mikrofonuna üfleyince mumlar söner, havai fişekler patlar ve "İyi ki doğdun" şarkısı çalar.
[Capacitor](https://capacitorjs.com) ile Android ve iOS uygulaması olarak paketlenmiştir. Aynı dosyalar tarayıcıda yüklenebilir bir PWA olarak da çalışır.

```
dogum-gunu/
├── www/                  # Uygulamanın kendisi (index.html, PWA manifest, service worker, ikonlar)
├── android/              # Android Studio projesi (mikrofon izni, dikey ekran)
├── ios/                  # Xcode projesi (mikrofon izin metni, dikey ekran)
├── assets/               # İkon ve açılış ekranı kaynakları
└── capacitor.config.json
```

### Android APK

- **Hazır APK:** `dogum-gunu/` altında bir değişiklik push edildiğinde GitHub Actions'taki **"Doğum Günü Mumu APK"** iş akışı APK'yı derler.
  Çalıştırmanın sayfasındaki *Artifacts* bölümünden `dogum-gunu-mumu-apk` dosyasını indirin, zip'ten çıkan `app-debug.apk` dosyasını telefona kurun
  (bilinmeyen kaynaklardan yüklemeye izin vermek gerekir). İş akışı *Run workflow* ile elle de başlatılabilir.
- **Kendi bilgisayarında** (JDK 21 ve Android SDK / Android Studio gerekir):

```bash
cd dogum-gunu
npm install
npm run apk               # APK: android/app/build/outputs/apk/debug/app-debug.apk
# ya da: npm run android  # Android Studio'da açar
```

### iOS

Mac ve Xcode gerekir: `cd dogum-gunu && npm install && npm run ios`. Ardından Xcode'da takımını seçip cihaza yükleyebilirsin.

### Tarayıcı / PWA

`www/` klasörünü HTTPS üzerinden yayınla (ör. GitHub Pages). Telefonda sayfayı açıp **Ana ekrana ekle** dediğinde uygulama gibi tam ekran açılır ve çevrimdışı da çalışır.
Bilgisayarda yerel test için: `cd dogum-gunu && npm run serve` (mikrofon yalnızca `localhost` ya da HTTPS üzerinde çalışır).

### Değişiklik yaptıktan sonra

`www/index.html` dosyasını düzenledikten sonra `npx cap sync` komutunu çalıştır. Bu, dosyaları Android ve iOS projelerine kopyalar.
İkonu ya da açılış ekranını değiştirmek için `assets/` altındaki görselleri değiştirip şunu çalıştır:
`npx capacitor-assets generate --android --ios --iconBackgroundColor '#0b0820' --splashBackgroundColor '#0b0820'`.
