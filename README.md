# Gökkule

Android için tasarlanmış, Tetris tarzı blok yerleştirmeyi 3B bir platform macerasıyla birleştiren oyun.
Düşen blokları yerleştirerek gezgin **Ada**'ya merdiven örüyorsun ve onu havada süzülen kristallere ulaştırıyorsun.

- **[GDD.md](GDD.md):** Tam oyun tasarım belgesi (mekanikler, macera katmanı, kontroller, sanat, teknik plan, yol haritası).
- **[prototype/index.html](prototype/index.html):** Oynanabilir 3B prototip (Three.js, tek dosya, dokunmatik kontroller).
- **[kupdiyar/index.html](kupdiyar/index.html):** *Küpdiyar*, sonsuz voksel sandbox oyunu (kaz, inşa et, keşfet). Ayrıntılar aşağıda.

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

## Küpdiyar (voksel sandbox)

`kupdiyar/index.html` tek dosyadır ve masaüstünde de telefonda da çalışır.

```bash
cd kupdiyar && python3 -m http.server 8081
```

- Tohumdan üretilen sonsuz dünya: tepeler, dağlar, karlı zirveler, kumsallar, çöller, denizler, ormanlar, mağaralar ve cevherler.
- 17 blok türü var. Tüm dokular kodla çizilir, dışarıdan görsel dosyası yüklenmez.
- Blok kırma ve koyma, köşe gölgelendirmesi (AO), gölge altında kararma, gündüz/gece döngüsü, su altı görünümü, uçma modu.
- Yaptığın değişiklikler ve konumun tarayıcıda (localStorage) tohum bazında saklanır.

| Eylem | Klavye / fare | Dokunmatik |
|---|---|---|
| Yürü / bak | WASD + fare | Sol yarıda sürükle / sağ yarıda sürükle |
| Zıpla / koş | Boşluk / Shift | Zıpla düğmesi / joystick'i sonuna kadar it |
| Kır / koy | Sol tık / sağ tık | Basılı tut / dokun |
| Blok seç | 1–9, tekerlek, orta tık, E | Alt çubuk, ▦ |
| Uçma | F (Boşluk yukarı, Shift aşağı) | Uç düğmesi (Zıpla / İn) |

**Fare modları** (menüden seçilir): *Kilitli imleç*, klasik FPS kontrolüdür; fare hareketi doğrudan bakışı döndürür. *Sürükleyerek bak* modunda sol tuşla sürükleyince bakış döner, tıklayınca blok kırılır, basılı tutunca sürekli kırılır. İmleç kilitlenemezse (örneğin oyun bir iframe ya da önizleme içindeyse) oyun bu moda kendisi geçer. Menüden fare hassasiyeti ve dikey bakış yönü de ayarlanabilir.
