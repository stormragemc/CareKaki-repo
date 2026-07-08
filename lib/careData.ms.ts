// Data demo versi Bahasa Melayu — struktur sama dengan lib/demoCareData.ts.
// Nama jenama dan skim kekal dalam bahasa Inggeris: AiMao, CareKaki, Guardian,
// CHAS, MediFund, SingPass, ICCP, HDB EASE, AIC, SACH.
// Data sintetik untuk demo — tiada maklumat pesakit sebenar.

import type { CareDataBundle } from "./careData";

export const msCareData: CareDataBundle = {
  todayPlan: [
    { time: "9:00 pagi", title: "Berjalan pagi", done: true },
    { time: "3:00 petang", title: "Latihan bangun dari kerusi" },
    { time: "5:00 petang", title: "Semakan minum air" },
  ],

  todaySummary: {
    headline: "Keadaan agak stabil hari ini.",
    detail: "Satu perubahan kecil patut disemak — selera makan lebih rendah daripada biasa minggu ini.",
  },

  weeklySchedule: [
    { day: "Isn", items: ["Berjalan pagi", "Bangun dari kerusi", "Semakan minum air"] },
    { day: "Sel", items: ["Latihan imbangan", "Sarapan berprotein", "Panggilan daripada Wei Ling"] },
    { day: "Rab", items: ["Berjalan pagi", "Bangun dari kerusi", "Semakan ubat"] },
    { day: "Kha", items: ["Lawatan pusat komuniti", "Semakan minum air"] },
    { day: "Jum", items: ["Berjalan pagi", "Bangun dari kerusi", "Catat berat badan"] },
    { day: "Sab", items: ["Makan tengah hari keluarga", "Regangan ringan"] },
    { day: "Ahd", items: ["Hari rehat", "Sedia kotak ubat seminggu"] },
  ],

  activityCompletion: [
    { activity: "Berjalan pagi", done: 22, planned: 26 },
    { activity: "Bangun dari kerusi", done: 9, planned: 12 },
    { activity: "Semakan minum air", done: 24, planned: 26 },
    { activity: "Latihan imbangan", done: 5, planned: 8 },
    { activity: "Aktiviti sosial", done: 3, planned: 4 },
  ],

  careDomains: [
    { domain: "Mobiliti", attention: 72, tone: "drawer-orange" },
    { domain: "Pemakanan", attention: 64, tone: "drawer-yellow" },
    { domain: "Ubat-ubatan", attention: 35, tone: "drawer-blue" },
    { domain: "Sosial", attention: 28, tone: "drawer-green" },
  ],

  carePlanSummary: {
    paragraphs: [
      "Pelan penjagaan ini memberi tumpuan kepada mengekalkan kekuatan bahagian bawah badan, menyokong pemakanan yang teratur, dan memantau perubahan terkini pada kestabilan semasa berdiri. Aktiviti direka untuk diselitkan dalam rutin harian dan boleh dibantu oleh ahli keluarga tanpa peralatan khas.",
      "Pelan ini mengimbangi tiga jenis kerja: aktiviti harian yang melindungi kekuatan dan kebebasan, permohonan yang membuka sokongan kewangan dan komuniti, serta satu titik hubungan supaya tiada siapa perlu menyelaras seorang diri.",
    ],
    priorities: [
      "Kekalkan kekuatan kaki melalui latihan pendek yang tetap",
      "Sokong pemakanan dan pengambilan air yang konsisten",
      "Pantau perubahan terkini pada kestabilan berdiri",
    ],
    strengths: [
      "Boleh berjalan sendiri di rumah",
      "Keluarga bertanya khabar setiap hari",
      "Mengambil ubat dengan tetap menggunakan kotak ubat",
    ],
    monitor: [
      "Kestabilan berdiri (perlukan sokongan dua kali minggu ini)",
      "Selera sarapan (berkurang pada 3 pagi kebelakangan)",
    ],
    weeklyGoals: [
      "Lengkapkan latihan bangun dari kerusi 3 kali",
      "Selesaikan sekurang-kurangnya 6 daripada 7 semakan minum air",
      "Satu aktiviti sosial di luar rumah",
    ],
    caregiverInvolvement:
      "Seorang ahli keluarga membantu sesi imbangan dan bangun dari kerusi, menyertai semakan mingguan, dan memberitahu AiMao apa-apa yang luar biasa — nota 20 saat pun sudah cukup.",
  },

  activityDetails: {
    "home-safety": {
      purpose:
        "Menghapuskan punca jatuh yang paling biasa di rumah — tikar longgar, koridor gelap, wayar berselerak — sebelum ia menyebabkan kecederaan.",
      duration: "30–45 minit, sekali",
      frequency: "Sekali sekarang, semak semula setiap 3 bulan",
      difficulty: "Mudah",
      equipment: "Tiada — lampu suluh telefon membantu",
      steps: [
        "Jalani laluan harian biasa: katil → tandas → dapur → sofa → pintu.",
        "Alihkan atau lekatkan permaidani dan wayar yang longgar di sepanjang laluan itu.",
        "Pastikan setiap koridor dan tandas mempunyai lampu yang terang dan berfungsi.",
        "Tambah lampu malam antara bilik tidur dan tandas.",
        "Kosongkan laluan daripada barang, bangku rendah dan penjuru perabot.",
        "Catat di mana palang pegangan diperlukan (tandas, bilik mandi, tepi katil).",
      ],
      caregiverRole:
        "Lakukan pemeriksaan bersama-sama — orang yang tinggal di situ paling tahu laluannya; anda pula nampak bahaya yang mereka sudah tidak perasan.",
      stopIf: [],
      why: "Baru-baru ini berlaku kejatuhan dan rumah belum disemak sejak itu. Kebanyakan jatuh berulang berlaku di laluan yang sama dengan yang pertama.",
    },
    "walker-fit": {
      purpose:
        "Alat bantu jalan yang dipadankan dengan betul dan palang pegangan menjadikan saat-saat goyah — bangun dari katil, keluar dari bilik mandi — selamat.",
      duration: "1 sesi pemadanan (kira-kira 1 jam)",
      frequency: "Sekali, kemudian laraskan mengikut keperluan",
      difficulty: "Mudah",
      equipment: "Alat bantu jalan (pinjam atau beli); palang pegangan dipasang melalui HDB EASE atau kontraktor",
      steps: [
        "Berdiri tegak dengan kasut biasa; pemegang alat bantu jalan sepatutnya separas pergelangan tangan semasa lengan relaks.",
        "Latih corak: alat bantu ke depan → kaki lemah → kaki kuat.",
        "Pasang palang pegangan di sebelah tandas dan dalam bilik mandi.",
        "Latih duduk dan bangun menggunakan palang, bukan rel tuala.",
        "Periksa getah tapak alat bantu setiap bulan dan ganti bila haus.",
      ],
      caregiverRole:
        "Berjalan sedikit di belakang dan di sisi semasa latihan awal. Biarkan peralatan menanggung berat — jangan hulur tangan kecuali diminta.",
      stopIf: ["Sakit baru semasa berjalan", "Alat bantu terasa tidak stabil atau bergoyang"],
      why: "Keadaan goyah dilaporkan selepas kejatuhan baru-baru ini — peralatan yang betul mengembalikan pergerakan yang yakin dan bebas.",
    },
    "caregiver-basics": {
      purpose:
        "Memberi penjaga keluarga kemahiran praktikal — pemindahan selamat, rutin ubat, tanda-tanda untuk diperhatikan — supaya penjagaan boleh bertahan lama.",
      duration: "Kursus separuh hari",
      frequency: "Sekali, ulang kaji setiap tahun",
      difficulty: "Mudah",
      equipment: "Tiada — kursus disokong Geran Latihan Penjaga AIC",
      steps: [
        "Mohon Geran Latihan Penjaga (sehingga $200 setahun).",
        "Daftar kursus asas penjagaan warga emas berhampiran rumah.",
        "Pelajari teknik pemindahan selamat: pasak badan, kira bersama, bergerak perlahan.",
        "Sediakan kalendar ubat dan temu janji yang dikongsi.",
        "Simpan talian bantuan luar waktu di tempat yang mudah dilihat.",
      ],
      caregiverRole: "Yang ini untuk anda — orang yang menjaga.",
      stopIf: [],
      why: "Anak perempuan ialah penjaga utama dan belum menerima latihan formal. Penjaga terlatih kurang keletihan dan lebih cepat mengesan masalah.",
    },
    "home-nursing": {
      purpose:
        "Jururawat komuniti datang ke rumah untuk rawatan luka, tanda vital dan semakan ubat — pemulihan diteruskan tanpa perjalanan klinik yang memenatkan.",
      duration: "45–60 minit setiap lawatan",
      frequency: "Mingguan pada mulanya, berkurang mengikut pemulihan",
      difficulty: "Mudah — jururawat yang buat",
      equipment: "Tiada",
      steps: [
        "AiMao menyediakan draf rujukan kepada penyedia kejururawatan rumah.",
        "Sahkan hari lawatan dan letakkan senarai ubat di atas meja.",
        "Semasa lawatan: tanda vital, luka dan sebarang gejala baharu diperiksa.",
        "Tanya jururawat apa sahaja — tulis soalan antara lawatan.",
        "Nota jururawat masuk ke Ringkasan Penjagaan untuk pasukan penjagaan.",
      ],
      caregiverRole: "Cuba hadir pada lawatan pertama; selepas itu jururawat dan AiMao akan terus memaklumkan anda.",
      stopIf: [],
      why: "Pemulihan selepas discaj memerlukan pemantauan profesional yang tetap, dan perjalanan ke temu janji kini sukar.",
    },
    "physio-sach": {
      purpose:
        "Fisioterapi berstruktur membina semula kekuatan dan imbangan yang hilang selepas jatuh — cara paling berkesan untuk mencegah kejatuhan seterusnya.",
      duration: "45 minit setiap sesi",
      frequency: "2 sesi seminggu, 6–8 minggu",
      difficulty: "Sederhana — mencabar tetapi selamat",
      equipment: "Kasut selesa; selebihnya disediakan hospital komuniti",
      steps: [
        "Hadiri penilaian awal di hospital komuniti SACH.",
        "Ikuti program yang ditetapkan — biasanya penguatan kaki, latihan imbangan dan latihan berjalan.",
        "Buat versi ringkas latihan di rumah pada hari tanpa sesi.",
        "Laporkan sebarang pening atau sakit kepada ahli fisioterapi dengan segera.",
        "Pada minggu ke-4, program disemak dan ditingkatkan.",
      ],
      caregiverRole: "Bantu pengangkutan pada hari sesi dan galakkan latihan di rumah — konsisten lebih penting daripada intensiti.",
      stopIf: ["Rasa tidak selesa di dada semasa senaman", "Pening yang tidak hilang selepas rehat", "Sakit sendi yang tajam"],
      why: "Mobiliti belum pulih sepenuhnya sejak kejatuhan. Rehabilitasi berpenyelia ialah jalan terbukti kembali berjalan sendiri.",
    },
    "med-review": {
      purpose:
        "Ahli farmasi menyemak semua ubat semasa — ubat baharu selepas discaj dan ubat lama — untuk interaksi, pertindihan dan kesan sampingan berisiko jatuh.",
      duration: "30 minit",
      frequency: "Sekali sekarang, kemudian selepas setiap kemasukan hospital",
      difficulty: "Mudah",
      equipment: "Bawa setiap kotak ubat, termasuk suplemen",
      steps: [
        "Kumpulkan setiap ubat, suplemen dan ubat tradisional dalam satu beg.",
        "Tempah semakan ubat di poliklinik atau farmasi biasa.",
        "Tanya secara khusus: 'Adakah mana-mana ubat ini boleh meningkatkan risiko jatuh?'",
        "Kemas kini kotak ubat dan senarai ubat dengan sebarang perubahan.",
        "Kongsi senarai terkini dengan AiMao supaya Ringkasan Penjagaan sentiasa terkini.",
      ],
      caregiverRole: "Bantu kumpulkan ubat dan temani semakan — dua pasang telinga membantu bila arahan berubah.",
      stopIf: [],
      why: "Ubat baharu ditambah semasa discaj. Beberapa ubat biasa meningkatkan rasa mengantuk dan risiko jatuh apabila digabungkan.",
    },
    hcg: {
      purpose:
        "Home Caregiving Grant memberi $250–$400 sebulan untuk kos penjagaan bagi mereka yang mempunyai ketidakupayaan sederhana kekal.",
      duration: "Kira-kira 30 minit untuk memohon",
      frequency: "Sekali — disemak berkala oleh AIC",
      difficulty: "Mudah",
      equipment: "SingPass, maklumat pendapatan isi rumah",
      steps: [
        "Semak kelayakan: memerlukan bantuan untuk 3 atau lebih aktiviti harian.",
        "Laporan penilaian fungsi mungkin diperlukan — poliklinik boleh uruskan.",
        "Mohon di laman web AIC dengan SingPass.",
        "Hantar butiran pendapatan isi rumah untuk ujian kelayakan.",
        "Geran dibayar setiap bulan setelah diluluskan.",
      ],
      caregiverRole: "Permohonan biasanya dibuat oleh penjaga keluarga.",
      stopIf: [],
      why: "Pendapatan per kapita isi rumah berada dalam kelayakan — ini wang yang memang diperuntukkan untuk keluarga dalam keadaan begini.",
    },
    medifund: {
      purpose:
        "MediFund ialah jaring keselamatan yang membantu baki bil kesihatan apabila subsidi, MediShield dan MediSave tidak mencukupi.",
      duration: "Tanya di pejabat urusan hospital/klinik",
      frequency: "Mengikut bil, bila perlu",
      difficulty: "Mudah — pekerja sosial perubatan membantu",
      equipment: "Bil terkini, dokumen pendapatan",
      steps: [
        "Tanya pekerja sosial perubatan di hospital yang merawat tentang MediFund.",
        "Bawa bil terkini dan dokumen pendapatan isi rumah.",
        "Pekerja sosial menghantar permohonan bagi pihak anda.",
        "Jumlah yang diluluskan ditolak terus daripada bil.",
      ],
      caregiverRole: "Temani temu janji dengan pekerja sosial perubatan.",
      stopIf: [],
      why: "Rehabilitasi menambah kos selama beberapa bulan — ini mengelakkan pemulihan menjadi beban kewangan.",
    },
    chas: {
      purpose:
        "Kad CHAS memberi subsidi lawatan GP dan pergigian di klinik kejiranan — rawatan susulan menjadi mampu milik dekat rumah.",
      duration: "10 minit dalam talian",
      frequency: "Sekali — diperbaharui automatik",
      difficulty: "Mudah",
      equipment: "SingPass",
      steps: [
        "Mohon atau semak tahap di chas.sg dengan SingPass.",
        "Setelah diluluskan, pilih GP CHAS dekat rumah untuk rawatan susulan.",
        "Tunjukkan kad pada setiap lawatan untuk kadar bersubsidi.",
      ],
      caregiverRole: "Bantu permohonan dalam talian jika perlu.",
      stopIf: [],
      why: "Rawatan susulan pesakit luar kini kerap — lawatan yang sama jauh lebih murah dengan kad ini.",
    },
    iccp: {
      purpose:
        "Seorang penyelaras penjagaan yang menyatukan segalanya — temu janji, perkhidmatan, permohonan — supaya keluarga tidak perlu mengejar lima agensi.",
      duration: "Hubungan berterusan",
      frequency: "Semakan bulanan, lebih kerap bila keadaan berubah",
      difficulty: "Mudah",
      equipment: "Tiada",
      steps: [
        "AiMao menyediakan Ringkasan Penjagaan dan menyerahkan kes kepada penyelaras ICCP.",
        "Penyelaras menyemak dan mengesahkan pelan bersama keluarga.",
        "Selepas itu hanya satu nombor telefon — penyelaras yang mengejar selebihnya.",
        "Semakan bulanan mengemas kini pelan mengikut keperluan.",
      ],
      caregiverRole: "Simpan nombor penyelaras dan bangkitkan apa sahaja yang terasa tak kena — tiada isu yang terlalu kecil.",
      stopIf: [],
      why: "Penjagaan melibatkan banyak bahagian. Satu titik hubungan ialah beza antara pelan sebenar dan timbunan risalah.",
    },
    "family-loop": {
      purpose: "Rentak bulanan yang mudah supaya setiap ahli keluarga sentiasa tahu dan beban penjagaan dikongsi.",
      duration: "20 minit sebulan",
      frequency: "Bulanan, dengan kemas kini bila ada perubahan",
      difficulty: "Mudah",
      equipment: "Kumpulan sembang keluarga",
      steps: [
        "Tetapkan pertemuan keluarga bulanan — panggilan atau semasa makan.",
        "Semak Ringkasan Penjagaan bersama: apa berubah, apa seterusnya.",
        "Bergilir menemani sesi fisio atau lawatan jururawat.",
        "Setuju siapa bertindak dahulu jika AiMao menghantar amaran.",
      ],
      caregiverRole: "Anda yang mengetuainya — tetapi tujuannya ialah anda bukan lagi seorang diri memikul pelan ini.",
      stopIf: [],
      why: "Keluarga ada dan sanggup membantu — struktur ringan mengubah niat baik menjadi bantuan sebenar.",
    },
    "alert-device": {
      purpose:
        "Butang amaran boleh pakai yang menghubungi keluarga atau pusat tindak balas 24/7 sebaik sahaja jatuh — kritikal apabila tinggal seorang diri.",
      duration: "1 jam untuk dipasang",
      frequency: "Dipakai setiap hari",
      difficulty: "Mudah",
      equipment: "Butang amaran peribadi (loket atau gelang tangan)",
      steps: [
        "Pilih peranti yang benar-benar akan dipakai — loket atau gelang.",
        "Tetapkan hubungan kecemasan mengikut urutan: keluarga dahulu, kemudian pusat tindak balas.",
        "Uji bersama sebulan sekali.",
        "Pakai semasa mandi — kebanyakan jatuh di rumah berlaku di bilik air.",
      ],
      caregiverRole: "Buat panggilan ujian bulanan bersama supaya menekan butang itu tidak pernah terasa menakutkan.",
      stopIf: [],
      why: "Tinggal seorang diri selepas jatuh bermakna bantuan mesti sejauh satu tekanan, bukan satu panggilan telefon.",
    },
    "silver-support": {
      purpose:
        "Silver Support membayar bantuan tunai suku tahunan kepada warga emas yang berpendapatan rendah sepanjang hayat — tiada permohonan diperlukan jika layak.",
      duration: "Automatik",
      frequency: "Bayaran suku tahunan",
      difficulty: "Mudah",
      equipment: "Tiada",
      steps: [
        "Kelayakan dinilai secara automatik daripada rekod CPF dan perumahan.",
        "Semak status di laman web Silver Support dengan SingPass.",
        "Bayaran masuk setiap suku tahun ke akaun bank berdaftar.",
      ],
      caregiverRole: "Cukup sekadar pastikan bayaran diterima.",
      stopIf: [],
      why: "Tahap pencen daripada MyInfo menunjukkan kemungkinan layak — ini mungkin wang yang memang sepatutnya diterima.",
    },
    aac: {
      purpose:
        "Active Ageing Centre berdekatan menganjurkan aktiviti harian, kumpulan senaman dan program rakan pendamping — teman dan tujuan, beberapa minit dari rumah.",
      duration: "Singgah bila-bila pada hari bekerja",
      frequency: "Sasarkan 2 lawatan seminggu untuk bermula",
      difficulty: "Mudah",
      equipment: "Tiada",
      steps: [
        "Lawati AAC terdekat sekali — tak perlu mendaftar untuk melihat-lihat.",
        "Pilih satu aktiviti tetap yang menarik (senaman, kraf, sesi kopi).",
        "Tanya tentang program rakan pendamping untuk pelawat mingguan.",
      ],
      caregiverRole: "Lawatan pertama bersama-sama merendahkan halangan; selepas itu ia menjadi rutin.",
      stopIf: [],
      why: "Tinggal seorang diri dengan keluarga di luar negara — kesunyian ialah risiko kesihatan, dan inilah rawatannya.",
    },
    "med-flag": {
      purpose:
        "Menandakan senarai ubat semasa untuk semakan yang diketuai klinisian — AiMao tidak menilai ubat jantung sendiri.",
      duration: "Diuruskan oleh klinik",
      frequency: "Segera — minggu ini",
      difficulty: "Mudah",
      equipment: "Senarai ubat semasa",
      steps: [
        "AiMao menghantar senarai ubat dan peristiwa terkini ke klinik, ditandakan untuk semakan.",
        "Klinik menjadualkan semakan ubat yang diketuai klinisian.",
        "Sehingga itu: jangan ubah sebarang ubat tanpa doktor.",
      ],
      caregiverRole: "Pastikan temu janji berlaku minggu ini.",
      stopIf: [],
      why: "Pelbagai ubat jantung selepas pengsan ialah bidang klinisian semata-mata. Tindakan selamat ialah penyerahan pantas, bukan pendapat AI.",
    },
    "falls-review": {
      purpose:
        "Penilaian jatuh dan mobiliti berstruktur mencari punca di sebalik keadaan goyah berulang — kasut, penglihatan, tekanan darah atau kekuatan.",
      duration: "1 sesi klinik",
      frequency: "Sekali, kemudian mengikut nasihat",
      difficulty: "Mudah",
      equipment: "Bawa tongkat semasa dan kasut biasa",
      steps: [
        "Tempah penilaian klinik jatuh (penyelaras uruskan rujukan).",
        "Penilaian merangkumi imbangan, gaya berjalan, tekanan darah semasa berdiri, penglihatan dan kasut.",
        "Ikuti pelan yang terhasil — selalunya pembetulan kecil dengan kesan besar.",
      ],
      caregiverRole: "Temani penilaian dan bantu ingatkan sejarah kejatuhan.",
      stopIf: [],
      why: "Sejarah jatuh serta goyah dengan tongkat bermakna puncanya perlu dicari, bukan sekadar gejalanya diurus.",
    },
    escalate: {
      purpose:
        "Pengsan baru-baru ini dengan kegagalan jantung dan ubat antikoagulan memerlukan klinisian dan penyelaras mengambil alih kes dengan segera.",
      duration: "Minggu yang sama",
      frequency: "Segera, sekali",
      difficulty: "Diuruskan oleh profesional",
      equipment: "Tiada",
      steps: [
        "AiMao merangkum keadaan ke dalam Ringkasan Penjagaan dan menaikkannya kepada penyelaras.",
        "Penyelaras mengesahkan semakan klinisian dalam beberapa hari, bukan minggu.",
        "Keluarga dimaklumkan tentang hasil dan langkah seterusnya.",
      ],
      caregiverRole: "Anak saudara dimaklumkan pada setiap langkah.",
      stopIf: [],
      why: "Keadaan ini melebihi apa yang patut diuruskan oleh mana-mana aplikasi. Tindakan bertanggungjawab ialah penyerahan pantas dan lengkap kepada manusia.",
    },
    "nephew-loop": {
      purpose:
        "Memastikan satu-satunya ahli keluarga yang ada — anak saudara yang melawat setiap minggu — sentiasa dimaklumkan tanpa menambah bebannya.",
      duration: "Beberapa minit seminggu",
      frequency: "Ringkasan mingguan + amaran",
      difficulty: "Mudah",
      equipment: "Telefon",
      steps: [
        "Anak saudara menerima ringkasan Ringkasan Penjagaan mingguan.",
        "Amaran segera sampai kepadanya dahulu, dengan respons satu ketukan.",
        "Pemerhatiannya semasa lawatan terus kembali kepada AiMao.",
      ],
      caregiverRole: "Ini saluran anak saudara — sengaja dibuat ringan.",
      stopIf: [],
      why: "Tanpa penjaga utama, pelawat mingguan ialah jaring keselamatan — dia perlukan isyarat, bukan bunyi bising.",
    },
  },

  fallbackDetail: {
    purpose: "Sebahagian daripada pelan penjagaan semasa — minta AiMao terangkan langkah ini sepenuhnya.",
    duration: "Berbeza-beza",
    frequency: "Mengikut pelan",
    difficulty: "Mudah",
    equipment: "Tiada",
    steps: ["Minta AiMao membimbing anda melalui aktiviti ini langkah demi langkah."],
    caregiverRole: "Tanya AiMao cara terbaik untuk menyokong yang ini.",
    stopIf: [],
    why: "Ditambah ke pelan daripada perbualan anda dengan AiMao.",
  },

  briefRecentChanges: [
    "Sarapan berkurang pada 3 pagi kebelakangan",
    "Aktiviti di bawah garis dasar peribadi selama 4 hari",
    "Perlukan sokongan semasa berdiri, dua kali minggu ini",
  ],

  briefTimeline: [
    { day: "Isn", note: "Makan malam berkurang" },
    { day: "Sel", note: "Aktiviti di bawah julat biasa" },
    { day: "Rab", note: "Sarapan berkurang" },
    { day: "Kha", note: "Perlukan sokongan semasa berdiri" },
  ],

  briefWhyFlagged: [
    "Perubahan selera berulang beberapa hari",
    "Perubahan mobiliti baharu muncul dalam tempoh yang sama",
    "Corak ini berbeza daripada garis dasar peribadi",
  ],

  briefDiscussPoints: [
    "Bila kesukaran berdiri bermula",
    "Sebarang sakit atau pening",
    "Selera makan dan pengambilan air terkini",
    "Sebarang perubahan ubat terkini",
  ],
};
