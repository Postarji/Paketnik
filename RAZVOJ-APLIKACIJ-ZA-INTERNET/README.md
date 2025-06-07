# Pametni Paketnik – RAI MERN Aplikacija 📦💻

**Pametni Paketnik** je spletna aplikacija, razvita z MERN-tehnologijo (MongoDB, Express, React, Node.js), ki omogoča interakcijo s pametnim predalčnikom preko spletnega portala. Sistem omogoča upravljanje dostopov, spremljanje odklepov in povezavo med uporabnikom in pametno napravo.

Projekt je del praktičnega dela pri predmetu **Razvoj aplikacij za internet (RAI)** na **FERI, Univerza v Mariboru**.

---

## ⚙️ Zahteve za zagon aplikacije

* **Node.js**
* **MongoDB** (lokalno ali Atlas)
* **Internetni brskalnik** (Chrome, Firefox, ipd.)

---

## 🚀 Kako uporabljati aplikacijo

### 1. Namestitev

V terminalu izvedite:

```bash
git clone https://github.com/vasa-skupina/pametni-paketnik.git
cd pametni-paketnik
npm install
cd client
npm install
```

Zaženite aplikacijo (v root mapi):

```bash
npm run dev
```

### 2. Glavne funkcionalnosti

1. **Prijava uporabnika**

   * Prek obrazca ali z uporabo slike (pripravljeno za razširitev z obrazno razpoznavo)
2. **Dodajanje in upravljanje paketnikov**

   * Vsak uporabnik lahko registrira svoje paketnike
3. **Odklepanje na daljavo**

   * Uporabnik odklene paketnik prek spletnega vmesnika
4. **Dnevnik aktivnosti**

   * Vsako odklepanje se zabeleži v podatkovno bazo in prikaže v uporabniškem portalu

---

## 📚 Arhitektura sistema

* **Frontend**: React (Vite), TailwindCSS
* **Backend**: Node.js z Express
* **Baza**: MongoDB
* **API**: RESTful API z JWT avtentikacijo

---

## 🔧 API Primeri

* `POST /api/login` – prijava uporabnika
* `POST /api/unlock/:boxId` – beleženje odklepa
* `GET /api/logs/:userId` – pridobitev dnevnika

Vzorčni curl za odklep:

```bash
curl -X POST http://localhost:5000/api/unlock/12345 -H "Authorization: Bearer <token>"
```

---

## 🧩 Scenarij uporabe

Uporabnik ima doma pametni paketnik, ki ga odklene prek spletne aplikacije. Sistem zabeleži vsako odklepanje in omogoča pregled zgodovine. Lahko si predstavljate tudi širšo rabo (npr. v blokih, podjetjih, dostavnih centrih).

---

## 👨‍💻 RAI Projektna navodila – pokrito v aplikaciji

* ✅ **Načrtovanje in user stories**
* ✅ **REST API za prijavo, upravljanje paketnikov in odklep**
* ✅ **Dnevnik aktivnosti**
* ✅ **Frontend za lastnike paketnikov**
* 🔜 **Razširitve**: obrazna razpoznava, vmesnik za dostavljalce, obvestila

---

