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

---

# Kuzgun Haber

**[haberler/index.html](haberler/index.html):** Hayali Esrâvan dünyasından sürekli, gerçek bir ajans gibi haber yayımlayan tek dosyalık haber uygulaması.

- Yeni haberler kendiliğinden düşer (sakin / normal / hızlı akış, durdur-sürdür). Son dakika haberleri şeritte ve bildirimde görünür.
- **Gelişen hikâyeler** (ejderha göçü, kayıp taç, alçalan uçan şehir Lothra, lonca seçimi, su krizi, batık şehir) birkaç adımda ilerler. Her haberde hikâyenin zaman çizelgesi vardır.
- Haberler panoları da etkiler: piyasalar (Ejder Altını, Mana Kristali...), Grifon Ligi puan durumu, hava durumu, iki ayın evreleri, en çok okunanlar.
- Haber metinleri, Türkçe ek uyumunu gözeten şablonlarla üretilir. Her habere üretken bir illüstrasyon çizilir. Akış tarayıcıda saklanır, geri dönünce kaldığı yerden sürer.

```bash
cd haberler && python3 -m http.server 8081
```
