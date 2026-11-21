# Demos Evreni

Telefon için tasarlanmış, 3B bir yıldız sisteminde geçen etkileşimli nüfus simülasyonu.
Bir toplumun nüfusunu etkileyen kararları sen veriyorsun; sonuçları gezegenin yüzeyinde, şehir ışıklarında, atmosferinde ve grafiklerde izliyorsun.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Arayüz ve 3B sahne (Three.js r128) |
| `sim.js` | Simülasyon motoru (tarayıcı ve Node'da çalışır) |
| `vendor/three.min.js` | Three.js r128 (MIT), çevrimdışı çalışsın diye yerel kopya |
| `manifest.webmanifest`, `icon.svg` | Ana ekrana eklenebilir web uygulaması bilgileri |

## Çalıştırma

```bash
cd demos && python3 -m http.server 8080
# Telefonda (aynı Wi-Fi): http://<bilgisayarın-IP'si>:8080
```

Android APK için kök README'deki Capacitor adımlarını `--web-dir=demos` ile uygula.

## Model

Her gezegende 0–100 yaş için yıllık **yaş kohortu** tutulur. Her simülasyon yılında:

- **Ölüm:** yaşa özel olasılıklar. Bebek ve çocuk ölümleri ayrıca hesaplanır. Yetişkinlerde Gompertz–Makeham eğrisi kullanılır. Sağlık, aşı, sanitasyon, yaşlı bakımı, teknoloji, kirlilik, açlık, savaş ve salgın bu olasılıkları değiştirir.
- **Doğum:** doğurganlık hızı × 14–49 yaş arası doğum dağılımı. Doğurganlık; istenen çocuk sayısı, doğum kontrolü, eğitim, kentleşme, eşitlik, teşvikler, gelenek, refah, bebek ölümü, kalabalık ve doğum politikasıyla belirlenir.
- **Taşıma kapasitesi:** gıda üretimi (tarım, teknoloji, yaşanabilirlik, kirlilik). Aşılırsa açlık başlar.
- **Ekonomi:** vergi geliri çalışan nüfusa bağlıdır. Sağlık ve emeklilik harcamaları yaşlı nüfusla birlikte artar. Açık borç biriktirir, borç da refahı düşürür.
- **Göç:** mutluluk yüksekse göçmen gelir, düşükse insanlar Yurt'u terk eder.
- **Uzay:** teknoloji 2,0'da koloni gemileri, 2,8'de terraform açılır. Ay, Kızıl ve Buzul'un kendi yaşanabilirlik ve kapasite değerleri vardır.
- **Olaylar:** salgın, kıtlık, savaş, doğal afet, bebek patlaması, bilimsel atılım, göç dalgası, tıbbi devrim, asteroit. Hepsi elle tetiklenebilir ya da politikalara bağlı olasılıklarla rastgele gelir.

Beş başlangıç senaryosu var: Gelişen toplum, Yaşlanan refah toplumu, Nüfus patlaması, Son hayatta kalanlar, Uzay çağı.
