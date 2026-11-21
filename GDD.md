# GÖKKULE — Oyun Tasarım Belgesi (GDD)

> **Tür:** 3B blok yerleştirme + bulmaca-macera
> **Platform:** Android (telefon, dikey ekran), ileride tablet/iOS
> **Hedef kitle:** 12+, kısa oturumlarla oynayan mobil bulmaca oyuncuları
> **Oturum süresi:** 3–8 dakika
> **Durum:** Konsept + oynanabilir prototip (`prototype/index.html`)

---

## 1. Tek cümlelik özet

Gökyüzünde yüzen adalardaki antik taş kuyularına düşen 3B blokları yerleştirerek küçük gezgin **Ada**'ya merdiven örüyorsun. Ada'yı bu basamaklardan yürütüp havada süzülen kristallere ulaştırıyorsun. Ama tam dolan her kat silinip kuleyi alçaltıyor.

## 2. Tasarım sütunları

| Sütun | Anlamı | Oyunda karşılığı |
|---|---|---|
| **İnşa et ve yürü** | Bloklar dekor değil, gezilecek arazidir. | Her yerleştirme Ada'nın yolunu değiştirir. |
| **Güvenlik mi, yükseklik mi?** | Tetris tarzı kat silme seni güvende tutar ama hedefinden uzaklaştırır. | Kat silmek puan ve can verir, kristaller ise yükseklik ister. |
| **Tek elle bile okunur** | Mobilde her şey bir bakışta anlaşılmalı. | Hayalet blok, kristal ışını ve basamak kuralı (1 yukarı, 2 aşağı). |
| **Sakin macera** | Cezalandırıcı değil, merak uyandıran bir dünya. | Pastel ve low-poly ada estetiği, yumuşak sesler, ceza yerine geri bildirim. |

## 3. Çekirdek döngü

```
 ┌─► Blok düşer ──► Oyuncu kaydırır/döndürür ──► Blok yerleşir
 │                                                  │
 │        ┌──── Kat doldu mu? ──Evet──► Kat silinir (puan, can, kule alçalır)
 │        │                                         │
 │        └───────────────Hayır─────────────────────┤
 │                                                  ▼
 │                              Oyuncu bir zemine dokunur, Ada yürür
 │                                                  │
 └──────────── Kristal toplandı mı? (puan, ilerleme) ◄┘
```

**Mikro döngü (10–20 sn):** Bir blok yerleştir, Ada'yı bir iki adım yürüt.
**Orta döngü (1–2 dk):** Bir kristale merdiven kur ve kristali al.
**Makro döngü (oturumlar arası):** Yeni adalar aç, Ada'nın rün yeteneklerini geliştir, günlük kuleyi bitir.

## 4. Mekanikler

### 4.1 Kuyu
- 6×6 taban, 12 kat yüksekliğinde oyun alanı. Kırmızı **tehlike çizgisi** 12. kattadır.
- Bir bloğun bir kısmı bile çizginin üstünde kalırsa oyun biter (kat silme bunu kurtarabilir).

### 4.2 Bloklar (9 temel parça)
| Ad | Hücre | Rol |
|---|---|---|
| Sütun, Kare, Tepe, Kanca, Yılan | 4 | Düz parçalar. Katları doldurmak için. |
| Köşe | 3 | Boşluk kapatıcı. |
| Basamak | 3 | Tek parçada 1 basamak yükselir. Tırmanış parçası. |
| Üçayak, Burgu | 4 | Gerçek 3B parçalar. Hem kat hem merdiven olarak kullanılır. |

- **7'li torba** benzeri karıştırma (9'lu torba): Her şekil torba boşalmadan bir kez gelir, şans adil kalır.
- Döndürme: **↻** dikey eksen etrafında, **⤵** kameraya göre yatay eksen etrafında ("devirme"). Duvar tekmesi (wall kick) ile sıkışmayı önleme.
- Hareket her zaman **kameraya göre**dir: ▲ her zaman ekranın "içine" doğru.

### 4.3 Gezgin Ada
- Oyuncu bir zemine/bloğa dokunur, Ada en kısa yoldan oraya yürür (BFS).
- **Basamak kuralı:** Tek adımda en çok 1 blok yukarı çıkar, en çok 2 blok aşağı iner.
- Bir blok Ada'nın kafasına düşerse 1 can gider ve Ada bloğun üstüne itilir. 3 can vardır.
- Her 5 silinen katta 1 can geri gelir (en çok 3).

### 4.4 Kristaller
- Her seferinde bir kristal, mevcut kulenin **2–3 kat üstünde** rastgele bir sütunda belirir. Altına doğru inen ışın sütunu gösterir.
- Ada o sütunun tepesine tam kristal yüksekliğinde ulaşırsa kristal toplanır.
- Kristalin hücresine blok düşürülürse kristal **ezilir** ve başka yerde yeniden doğar. Puan kaybı yoktur, yalnızca zaman kaybedilir.
- Her 3 kristal **seviyeyi (Kat)** artırır. Bloklar hızlanır.

### 4.5 Puanlama
| Olay | Puan |
|---|---|
| Hızlı bırakma | 2 × düşülen hücre |
| 1 / 2 / 3 / 4 kat silme | 100 / 300 / 600 / 1000 × seviye |
| Kristal | 500 × seviye |

**Temel gerilim:** Kat silmek kuleyi alçaltır ve Ada da onunla birlikte iner, ama kristal havada sabit kalır. Oyuncu sürekli "şimdi mi temizleyeyim, önce mi tırmanayım?" diye karar verir.

## 5. Macera katmanı (tam sürüm, prototipte yok)

### 5.1 Dünya haritası: Takımadalar
| Ada | Tema | Yeni mekanik |
|---|---|---|
| 1. Çayır Adası | Eğitim, sakin rüzgâr | Temel kurallar |
| 2. Kristal Mağaraları | Karanlık, kristaller ışık verir | Görüş alanı sınırlı. Kristal ışığı çevreyi açar. |
| 3. Rüzgâr Geçidi | Fırtına bulutları | Rüzgâr düşen bloğu her 10 sn'de bir kaydırır. |
| 4. Saat Kulesi | Mekanik dişliler | Dönen katlar: Bir kat her 3 blokta 90° döner. |
| 5. Gölge Zirvesi | Son bölüm | Gölge yaratıkları bloklarını yer, oyuncu da onları blokla ezer. |

Her ada 10 elle tasarlanmış **bulmaca kulesi** (sabit parça sırası, hedef: kristal sayısı ve hamle limiti) ve 1 sonsuz **meydan okuma kuyusu** içerir.

### 5.2 Düşmanlar ve engeller
- **Yosun Sümüğü:** Yavaş yürür ve Ada'ya değerse can götürür. Üstüne blok düşürülerek yok edilir (+150).
- **Çatlak Taş:** Üstünden 2 kez geçilince kırılır.
- **Rüzgâr Ruhu:** Düşen parçayı bir hücre iter. Önceden ok ile uyarır.
- **Kilitli Sandık:** Bir katın içine gömülüdür. Kat silinince açılır ve rün parçası verir.

### 5.3 Rün yetenekleri (ilerleme)
Toplanan kristaller kamptaki **Rün Taşı**'nda harcanır. Bir oyunda en çok 2 yetenek kullanılır.
- **Tüy Adım:** Ada 2 blok yukarı zıplayabilir (oyun başına 3 kez).
- **Taş Kalkan:** Kafaya düşen ilk blok can götürmez.
- **Zaman Kumu:** Düşüşü 5 sn yavaşlatır.
- **Rün Bombası:** Seçilen sütunu tamamen temizler.

### 5.4 Hikâye
Ada, gökyüzü adalarını birbirine bağlayan kristal köprülerin söndüğünü fark eden genç bir haritacıdır. Her adanın kulesinde toplanan kristaller bir köprüyü yeniden yakar. Hikâye diyaloglarla değil, harita üzerinde beliren köprüler ve kısa kart çizimleriyle anlatılır.

## 6. Kontroller (Android)

| Eylem | Dokunmatik | Klavye / gamepad (test, Chromebook) |
|---|---|---|
| Bloğu kaydır | Sol alttaki yön tuşları (basılı tutunca tekrar eder) | Ok tuşları / D-pad |
| Yatay döndür | ↻ | Q / X |
| Devir | ⤵ | E / Y |
| Hızlı bırak | **BIRAK** | Boşluk / A |
| Ada'yı yürüt | Zemine dokun | I J K L |
| Kamerayı çevir | Ekranı yatay kaydır veya ⟲ | C / omuz tuşları |
| Duraklat | ❚❚ | Esc / Start |

- Dokunma alanları en az **48 dp**. Başparmak bölgeleri: sol alt yön tuşları, sağ alt eylem tuşları.
- Dokunma ile kaydırma ayrımı: 12 px'ten kısa hareket dokunma, 60 px'ten uzun yatay hareket kamera kaydırması sayılır.
- Titreşim: Kat silinince kısa, kafaya blok düşünce uzun (ayarlardan kapatılabilir).
- **Erişilebilirlik:** Renk körü modu (blok yüzeylerinde desen), tek tuşla otomatik yürüyüş ("en yakın basamağa git"), düşme hızı çarpanı, büyük arayüz seçeneği.

## 7. Kamera
- 4 sabit açı (90° adımlar), yumuşak geçiş. Hafif çapraz bakış (≈29°) derinliği okunur kılar.
- Kule yükseldikçe odak noktası yukarı kayar. Dikey ekranda kamera otomatik olarak uzaklaşır.
- **Hayalet blok** (yarı saydam) parçanın ineceği yeri her zaman gösterir. Bu, 3B'de derinlik algısının en önemli yardımcısıdır.

## 8. Sanat yönü
- **Stil:** Low-poly, düz gölgelendirme, pastel bloklar, gece mavisinden gün batımı turuncusuna geçen gökyüzü.
- **Renk paleti:** Gece `#141a33`, kehribar vurgu `#f2b54a`, kristal camgöbeği `#6fe3f2`, tehlike `#ff6b6b`.
- Her blok tipinin kendi rengi var. Tek ve çift katlar hafifçe farklı tonlarda gösterilir, böylece kat sınırları okunur.
- **Tipografi:** Başlıklar *Bungee* (kalın, oyuncaksı), arayüz *Fredoka* (yuvarlak, okunaklı).
- **Efektler:** Kat silinince renkli küp parçacıkları, kristal toplanınca camgöbeği patlama, yüzen kayalar ve ada salınımı (ortam hareketi).

## 9. Ses
- Müzik: Ada başına bir döngü (kalimba, hafif pad, rüzgâr). Seviye arttıkça bir enstrüman katmanı eklenir.
- SFX: Taş "tık" (yerleşme), çan (kat silme, silinen kat sayısı kadar nota), cam şıngırtısı (kristal), "uff" (kafaya blok düşmesi).

## 10. Teknik tasarım

### 10.1 Motor seçimi
| Seçenek | Artı | Eksi | Öneri |
|---|---|---|---|
| **Godot 4 (GDScript)** | Ücretsiz, hafif APK (~30 MB), iyi 2B/3B mobil desteği | 3B mobil renderer'ı Unity kadar olgun değil | **Tam sürüm için önerilen** |
| Unity (URP) | Olgun mobil araç zinciri, reklam/analitik SDK'ları | Lisans, daha büyük APK | Alternatif |
| Web (Three.js) + Capacitor/TWA | En hızlı prototip, mevcut kod çalışır | Performans tavanı, mağaza hissi zayıf | **Prototip / soft-launch** |

### 10.2 Veri modeli
- Kuyu: `Uint32Array(W*D*H)`, hücre başına renk/tip (0 = boş). Mantık tamamen ızgara tabanlı ve deterministik, render'dan bağımsız.
- Parça: göreli hücre listesi + konum. Döndürme 90° tamsayı matrisleriyle yapılır.
- Ada yol bulma: 36 hücre üzerinde BFS (bu boyutta A* gerekmez).
- Bulmaca kuleleri JSON: `{ seed, pieces[], startGrid[], crystals[], moveLimit }`.

### 10.3 Performans bütçesi (orta segment Android, ör. Snapdragon 6 serisi)
- 60 FPS hedefi, en kötü durumda 30 FPS.
- Draw call < 30: Tüm bloklar tek **InstancedMesh** ile, parçacıklar da tek instance grubuyla çizilir.
- Tek yönlü ışık + 1024² gölge haritası. Düşük kalite modunda gölge kapalı.
- APK < 60 MB, RAM < 300 MB. Soğuk açılış < 3 sn.

### 10.4 Android özel
- `minSdk 24`, `targetSdk` güncel Play gereksinimi. Yalnız dikey ekran, tam ekran (immersive) mod.
- Yaşam döngüsü: `onPause` olunca otomatik duraklatma ve durumu kaydetme.
- Kayıt: Yerel (SharedPreferences/JSON) + isteğe bağlı Google Play Games bulut kaydı.
- Geri tuşu: Oyun sırasında duraklatma menüsünü açar.

## 11. Arayüz akışı
```
Açılış ─► Ana Menü ─┬─► Harita (Adalar) ─► Kule seçimi ─► Oyun ─► Sonuç (yıldız/kristal)
                    ├─► Sonsuz Kuyu ─────────────────► Oyun ─► Sonuç (puan tablosu)
                    ├─► Günlük Kule (herkese aynı tohum)
                    ├─► Rün Taşı (yetenekler)
                    └─► Ayarlar (ses, titreşim, kalite, erişilebilirlik)
```

## 12. Gelir modeli (adil)
- Ücretsiz, **reklam yalnız isteğe bağlı** (ör. "devam etmek için izle", oyun başına 1 kez).
- Tek seferlik "Gezgin Paketi": reklamsız oyun + 2 kozmetik.
- Kozmetikler: Ada'nın şapkası/pelerini, blok temaları (mermer, buz, kristal). **Oynanışa etki eden satın alma yok.**

## 13. Ölçütler (soft-launch)
- 1. gün tutma > %40, 7. gün > %15.
- Eğitim tamamlama > %85.
- Ortalama oturum 6+ dk, günde 3+ oturum.
- İlk 10 oyunda "kafaya blok düşmesi" ile kaybedilen oyun oranı < %20. Daha yüksekse uyarı ve görünürlük iyileştirilir.

## 14. Yol haritası
| Aşama | Süre | Çıktı |
|---|---|---|
| 0. Prototip | ✅ | Web prototipi: kuyu, 9 parça, Ada, kristal, kat silme |
| 1. Dikey dilim | 6 hafta | Godot'ya taşıma, Çayır Adası (10 kule), ses, eğitim |
| 2. Alfa | 10 hafta | 3 ada, düşmanlar, rün yetenekleri, kayıt |
| 3. Soft-launch | 4 hafta | Play Store (seçili ülkeler), analitik, A/B denge testleri |
| 4. Global | 6 hafta | 5 ada, günlük kule, Play Games, yerelleştirme (TR/EN/DE/ES) |

## 15. Riskler
| Risk | Önlem |
|---|---|
| 3B'de derinliği okumak zor | Hayalet blok, kristal ışını, kat ton farkı, 4 sabit kamera |
| İki şeyi aynı anda kontrol etmek (blok + Ada) yorucu | Blok düşüşü yavaş başlar. Ada yürürken bloğu dondurma seçeneği (kolay mod). |
| Tetris klonu algısı | Asıl hedef kat silmek değil, tırmanmak. Macera, karakter ve dünya ön planda. |
| Düşük cihazlarda performans | Instancing, gölgesiz mod, sabit 30 FPS seçeneği |
