/**
 * TuComida Menu Seed Script — Updated 2026-06-01
 * يرفع المنيو الكامل لـ Firebase Realtime Database
 *
 * الاستخدام:
 *   node seed-menu.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://tucomida-pos-default-rtdb.firebaseio.com'
});

const db = admin.database();

// ============================================================
// CATEGORIES
// ============================================================
const categories = {
  big_wrap:       { name: 'BIG WRAP',      nameAr: 'بيج راب',       order: 1,  active: true },
  breakfast:      { name: 'BREAKFAST',     nameAr: 'إفطار',          order: 2,  active: true },
  salad:          { name: 'SALAD',         nameAr: 'سلطة',           order: 3,  active: true },
  dessert:        { name: 'DESSERT',       nameAr: 'ديسيرت',         order: 4,  active: true },
  detox:          { name: 'DETOX',         nameAr: 'ديتوكس',         order: 5,  active: true },
  mojito_healthy: { name: 'MOJITO',        nameAr: 'موهيتو صحي',     order: 6,  active: true },
  rizzo:          { name: 'RIZZO',         nameAr: 'ريزو',           order: 7,  active: true },
  meals_healthy:  { name: 'MEALS HEALTHY', nameAr: 'ميلز صحي',       order: 8,  active: true },
  meals_special:  { name: 'MEALS SPECIAL', nameAr: 'ميلز سبيشيال',   order: 9,  active: true },
  pasta:          { name: 'PASTA STATION', nameAr: 'باستا ستيشن',    order: 10, active: true },
  tatbela_chicken:{ name: 'TATBELA CHICKEN',nameAr:'تتبيلة دجاج',    order: 11, active: true },
  tatbela_meat:   { name: 'TATBELA MEAT',  nameAr: 'تتبيلة لحوم',   order: 12, active: true },
  addons:         { name: 'ADD-ONS',       nameAr: '➕ إضافات',       order: 13, active: true },
  protein:        { name: 'PROTEIN',       nameAr: 'بروتين',         order: 14, active: true },
  side_dish:      { name: 'SIDE DISH',     nameAr: 'سايد ديش',       order: 15, active: true },
  taco:           { name: 'TACO BEL',      nameAr: 'تاكو بيل',       order: 15, active: true },
  just_potato:    { name: 'JUST POTATO',   nameAr: 'جاست بوتاتو',    order: 16, active: true },
  iced_coffee:    { name: 'ICED COFFEE',   nameAr: 'قهوة مثلجة',     order: 17, active: true },
  soft_drinks:    { name: 'SOFT DRINKS',   nameAr: 'مشروبات',        order: 18, active: true },
  winter_drinks:  { name: 'WINTER DRINKS', nameAr: 'مشروبات شتوية',  order: 19, active: true },
  smoothie:       { name: 'SMOOTHIE',      nameAr: 'سموذي',          order: 20, active: true },
  mojito_special: { name: 'MOJITO SPECIAL',nameAr: 'موهيتو سبيشيال', order: 21, active: true },
  main_course:    { name: 'MAIN COURSE',   nameAr: 'الكورس الرئيسي', order: 22, active: true },
};

// ============================================================
// ITEMS — أسعار محدّثة 2026-06-01
// ============================================================
const items = [

  // ─── ADD-ONS (إضافات) ─────────────────────────────────────
  { categoryId:'addons', name:'Chicken 100g',  nameAr:'صدور دجاج 100 جرام', description:'إضافة صدور دجاج مشوي 100 جرام', singlePrice:70  },
  { categoryId:'addons', name:'Chicken 50g',   nameAr:'صدور دجاج 50 جرام',  description:'إضافة صدور دجاج مشوي 50 جرام',  singlePrice:35  },
  { categoryId:'addons', name:'Meat 100g',     nameAr:'لحمة 100 جرام',       description:'إضافة لحم مشوي 100 جرام',        singlePrice:85  },
  { categoryId:'addons', name:'Meat 50g',      nameAr:'لحمة 50 جرام',        description:'إضافة لحم مشوي 50 جرام',         singlePrice:45  },
  { categoryId:'addons', name:'Rice 100g',     nameAr:'أرز 100 جرام',        description:'إضافة أرز بسمتي 100 جرام',       singlePrice:20  },

  // ─── BIG WRAP ─────────────────────────────────────────────
  // M: 115→136 | Chicken 125→145 | Stack 125→145 | Loma 135→155 | CheeseBurger 140→165
  { categoryId:'big_wrap', name:'Crunchy Wrap',      nameAr:'كرانشي راب',     description:'تورتيلا رول محشي بقطع الاستربس الغني والفرايز والفلفل الالوان والزيتون والخس',                sizes:{ M:{price:115,calories:430,protein:16}, L:{price:136,calories:580,protein:20} } },
  { categoryId:'big_wrap', name:'Chicken Wrap',      nameAr:'تشيكن راب',      description:'تورتيلا رول محشي بشرائح الصدور والمشروم والفرايز والفلفل الالوان والخس',                      sizes:{ M:{price:125,calories:380,protein:23}, L:{price:145,calories:580,protein:35} } },
  { categoryId:'big_wrap', name:'Stack Burger Wrap', nameAr:'ستاك برجر راب',  description:'تورتيلا رول محشي برجر دجاج والفرايز والفلفل الالوان والخس وصوص تيستي',                      sizes:{ M:{price:125,calories:380,protein:23}, L:{price:145,calories:580,protein:35} } },
  { categoryId:'big_wrap', name:'Loma Wrap',         nameAr:'لوما راب',        description:'تورتيلا رول محشي ميت بول وشرائح الصدور والمشروم والفرايز والفلفل الالوان والخس',            sizes:{ M:{price:135,calories:394,protein:22}, L:{price:155,calories:615,protein:34} } },
  { categoryId:'big_wrap', name:'Cheese Burger Wrap',nameAr:'تشيز برجر راب',  description:'تورتيلا رول محشي برجر لحم وبصل مكرمل والفرايز والفلفل الالوان والخس',                      sizes:{ M:{price:140,calories:450,protein:15.8}, L:{price:165,calories:690,protein:22.8} } },

  // ─── BREAKFAST ────────────────────────────────────────────
  // Healthy Breakfast
  { categoryId:'breakfast', name:'Tuna Sandwich', nameAr:'تونة ساندويش', description:'توست رده مع تونه بخلطتنا المميزة', singlePrice:60, calories:260, protein:23 },
  { categoryId:'breakfast', name:'Egg Oats Nest', nameAr:'عيش أوتس نيست', description:'عيش تورتيلا صحي محشي بيض وجبن مشكله', singlePrice:60, calories:311, protein:19.6 },
  { categoryId:'breakfast', name:'Granola Gar',   nameAr:'جرانولا جار',   description:'شوفان محمص بالعسل والمكسرات', singlePrice:75, calories:320, protein:24, isStar:true },
  { categoryId:'breakfast', name:'Egg Wrap',      nameAr:'إيج راب',       description:'تورتيلا محشي بيض وسجق وفلفل الوان وجبن مع فرايز وسالاد', singlePrice:150, calories:586, protein:32 },
  { categoryId:'breakfast', name:'Luddite Tor',   nameAr:'لوديت تور',     description:'تورتيلا صحي محشي بيض وهوت دوج وجبن مشكله يقدم مع فرايز وسالاد', singlePrice:160, calories:416, protein:21 },
  { categoryId:'breakfast', name:'Buffalo Fast',  nameAr:'بوفالو فاست',   description:'اوملييت و هوت دوج بالباريكيو والبصل المكرمل والفلفل الالوان والمشروم الطازج يقدم مع سالاد وتورتيلا', singlePrice:165, calories:676, protein:28, isStar:true },
  { categoryId:'breakfast', name:'Smoke Me Up',   nameAr:'سموك مي أب',    description:'تورتيلا محشي اوملييت وتركي مدخن ومشروم فريش وجبن محمص يقدم مع سالاد', singlePrice:185, calories:612, protein:30, isStar:true },
  // Salty Croissant (Special Menu)
  { categoryId:'breakfast', name:'Salty Croissant Cheese',        nameAr:'كرواسون محشي جبن',              description:'كرواسون محشي جبن', singlePrice:80 },
  { categoryId:'breakfast', name:'Salty Croissant Turkish',       nameAr:'كرواسون تركي مدخن وتشيز',      description:'كرواسون تركي مدخن وتشيز', singlePrice:95 },
  { categoryId:'breakfast', name:'Salty Croissant Roast Beef',    nameAr:'كرواسون روز بيف وتشيز',         description:'كرواسون روز بيف وتشيز', singlePrice:95 },
  { categoryId:'breakfast', name:'Salty Croissant Salami',        nameAr:'كرواسون سلامي وتشيز',           description:'كرواسون سلامي وتشيز', singlePrice:95 },
  // Omelet Croissant (Special Menu)
  { categoryId:'breakfast', name:'Omelet Croissant Salami',       nameAr:'كرواسون أوملييت وسلامي وتشيز',  description:'كرواسون أوملييت وسلامي وتشيز', singlePrice:120 },
  { categoryId:'breakfast', name:'Omelet Croissant Turkish',      nameAr:'كرواسون أوملييت وتركي مدخن',   description:'كرواسون أوملييت وتركي مدخن وتشيز', singlePrice:140 },
  { categoryId:'breakfast', name:'Omelet Croissant Roast Beef',   nameAr:'كرواسون أوملييت وروز بيف',     description:'كرواسون أوملييت وروز بيف وتشيز', singlePrice:140 },
  { categoryId:'breakfast', name:'Omelet Croissant Salami Plain', nameAr:'كرواسون أوملييت سلامي وتشيز',  description:'كرواسون أوملييت سلامي وتشيز', singlePrice:140 },
  // Luddite Pie (Special Menu)
  { categoryId:'breakfast', name:'Luddite Pie Hot Dog',    nameAr:'فطير بيض وهوت دوج وتشيز مع فرايز',         description:'فطير محشي بيض وهوت دوج وتشيز مع فرايز', singlePrice:170 },
  { categoryId:'breakfast', name:'Luddite Pie Sausage',    nameAr:'فطير بيض وسجق وتشيز مع فرايز',             description:'فطير محشي بيض وسجق وتشيز مع فرايز', singlePrice:170 },
  { categoryId:'breakfast', name:'Luddite Pie Turkish',    nameAr:'فطير بيض تركي مدخن ومشروم وتشيز مع فرايز', description:'فطير محشي بيض تركي مدخن ومشروم وتشيز مع فرايز', singlePrice:185 },

  // ─── SALAD ────────────────────────────────────────────────
  // Caesar 150→160 | Shrimp 155→165 | Pasta 155→165 | CrunchyDelight 155→165
  // Salmon 199→210 | SpicyCrab 170→180 | CreakHummus 110→120 | GlowBeet 110→120 | TunaTwist 180→185
  { categoryId:'salad', name:'Caesar Salad',       nameAr:'سيزار سلطة',       description:'جريلد تشيكن وخس وخيار وفلفل الوان وذره وفاصوليا حمراء مع دريسينج الزبادي والليمون',             singlePrice:160, calories:307, protein:24 },
  { categoryId:'salad', name:'Shrimp Salad',       nameAr:'شريمب سلطة',       description:'جمبري مشوي وخس وفلفل اخضر وذرة حلوة و بقدونس وطماطم وبصل اخضر مع دريسينج الليمون والخل',     singlePrice:165, calories:206, protein:29.23 },
  { categoryId:'salad', name:'Pasta Salad',        nameAr:'باستا سلطة',       description:'باستا وصدور جريلد وخيار وفلفل احمر وذره وفاصوليا حمراء مع دريسينج الخردل',                    singlePrice:165, calories:280, protein:24.91 },
  { categoryId:'salad', name:'Tuna Salad',         nameAr:'تونة سلطة',        description:'تونة وخس وكرنب احمر وفلفل اخضر وطماطم وجزر وتوست محمص مع دريسينج رانش وليمون',                singlePrice:175, calories:324, protein:42.1 },
  { categoryId:'salad', name:'Crunchy Delight',    nameAr:'كرانشي ديلايت',    description:'كرسبي تشيكن وخس وخيار وفلفل الوان وبقدونس ومكعبات فرايز مع دريسينج دبس الرمان',              singlePrice:165, calories:307, protein:27 },
  { categoryId:'salad', name:'Salmon',             nameAr:'سالمون سلطة',      description:'سالمون مدخن وخيار وجزر وطماطم مع دريسينج مسطرده',                                              singlePrice:210, calories:550, protein:24.8, isStar:true },
  { categoryId:'salad', name:'Spicy Crab',         nameAr:'سبايسي كراب',      description:'كابوريا جزر شرايح وخيار شرايح ودريسينج مايوسيراتشا',                                           singlePrice:180, calories:515, protein:24.8, isStar:true },
  { categoryId:'salad', name:'Creak Hummus Salad', nameAr:'كريك حمص سلطة',    description:'حمص وبصل مخلل وطماطم وخيار وزيتون وجبنه فيتا',                                                 singlePrice:120, calories:480, protein:19.8, isStar:true },
  { categoryId:'salad', name:'Glow Beet',          nameAr:'جلو بيت',          description:'برتقال وبنجر وجزر وفاصوليا حمرا وخيار وبقدونس وجبنه قريش',                                    singlePrice:120, calories:300, protein:8,    isStar:true },
  { categoryId:'salad', name:'Tuna Twist',         nameAr:'تونة تويست',       description:'تونه وباستا وفلفل الوان وذره صفرا ودريسينج رانش',                                               singlePrice:185, calories:476, protein:48.5, isStar:true },

  // ─── DESSERT ──────────────────────────────────────────────
  // Brownie: 80→90
  { categoryId:'dessert', name:'Muffin',        nameAr:'مافن',           description:'', singlePrice:80,  calories:110, protein:6 },
  { categoryId:'dessert', name:'Choco Rice Box',nameAr:'تشوكو رايس بوكس',description:'3 قطع', singlePrice:120, calories:48,  protein:4 },
  { categoryId:'dessert', name:'Brownie',       nameAr:'براوني',         description:'', singlePrice:90,  calories:160, protein:9 },
  { categoryId:'dessert', name:'Sweet Potato',  nameAr:'سويت بوتاتو',   description:'', singlePrice:75,  calories:174, protein:6 },
  { categoryId:'dessert', name:'Cheese Cake',   nameAr:'تشيز كيك',      description:'', singlePrice:110, calories:210, protein:10 },
  { categoryId:'dessert', name:'Granola Box',   nameAr:'جرانولا بوكس',  description:'3 قطع', singlePrice:120, calories:90, protein:8 },

  // ─── DETOX ────────────────────────────────────────────────
  { categoryId:'detox', name:'Power Fit',     nameAr:'باور فيت',     description:'شوفان وموز وحليب وتمر ومكسرات يحتوي على فيتامين (A/k/B/MG)',          singlePrice:80,  calories:409 },
  { categoryId:'detox', name:'Sun Juice',     nameAr:'صن جوس',       description:'جزر وبرتقال وليمون وموز يحتوي على فيتامين (A/C/B/D/B6)',               singlePrice:70,  calories:177 },
  { categoryId:'detox', name:'Lomila Fresh',  nameAr:'لوميلا فريش',  description:'بنجر وفراولة ورمان وتفاح أحمر وجزر يحتوي على فيتامين (A/c/b/b12/mg/ca)',singlePrice:90,  calories:409 },
  { categoryId:'detox', name:'Green Juice',   nameAr:'جرين جوس',     description:'تفاح أخضر و سبانخ وموز وكيوي ونعناع يحتوي على فيتامين (A/B/C K/B6)',   singlePrice:99,  calories:217 },
  { categoryId:'detox', name:'TuComida Juice',nameAr:'تكوميدا جوس',  description:'افوكادو ونعناع ومانجا وماء جوز هند يحتوي على فيتامين (B6/MG/E/Ca)',    singlePrice:115, calories:193 },

  // ─── MOJITO HEALTHY ───────────────────────────────────────
  // Mint Limon: 65→75
  { categoryId:'mojito_healthy', name:'Mint Limon',  nameAr:'منت ليمون', description:'موهيتو صحي', singlePrice:75, calories:17 },
  { categoryId:'mojito_healthy', name:'Strawberry',  nameAr:'فراولة',    description:'موهيتو صحي', singlePrice:75, calories:38 },
  { categoryId:'mojito_healthy', name:'Mango',       nameAr:'مانجو',     description:'موهيتو صحي', singlePrice:75, calories:65 },
  { categoryId:'mojito_healthy', name:'Peach',       nameAr:'خوخ',       description:'موهيتو صحي', singlePrice:75, calories:46 },
  { categoryId:'mojito_healthy', name:'Kiwi',        nameAr:'كيوي',      description:'موهيتو صحي', singlePrice:75, calories:66 },

  // ─── RIZZO ────────────────────────────────────────────────
  // Stripes 75→85 | MeatBalls 85→90 | Seafood 95→115 | TuComida 140→150
  { categoryId:'rizzo', name:'Stripes',       nameAr:'ستربس ريزو',      description:'استربس مع أرز بخلطتنا المميزة وصوص ريزو',                                         singlePrice:85  },
  { categoryId:'rizzo', name:'Meat Balls',    nameAr:'ميت بولز ريزو',   description:'كور لحم مع أرز بخلطتنا المميزة وصوص تكوميدا',                                      singlePrice:90  },
  { categoryId:'rizzo', name:'Sausage',       nameAr:'سوسيج ريزو',      description:'سجق مشوي مع أرز بخلطتنا المميزة وصوص ريزو',                                         singlePrice:70  },
  { categoryId:'rizzo', name:'Burger',        nameAr:'برجر ريزو',       description:'برجر مع أرز بخلطتنا المميزة وصوص تكوميدا',                                          singlePrice:90  },
  { categoryId:'rizzo', name:'Seafood',       nameAr:'سيفود ريزو',      description:'جمبري مشوي وأصابع كابوري مع أرز صيادية وصوص',                                      singlePrice:115 },
  { categoryId:'rizzo', name:'Chicken',       nameAr:'تشيكن ريزو',      description:'صدور مشويه مع أرز بخلطتنا المميزة وصوص باربيكيو',                                   singlePrice:85  },
  { categoryId:'rizzo', name:'Fahita Chicken',nameAr:'فاهيتا تشيكن ريزو',description:'فاهيتا الدجاج المتبله مع أرز بخلطتنا المميزة',                                     singlePrice:85  },
  { categoryId:'rizzo', name:'Kofta Chicken', nameAr:'كفتة تشيكن ريزو', description:'كفتة دجاج مشويه مع أرز بسمتي مبهر وصوص ريزو',                                       singlePrice:85  },
  { categoryId:'rizzo', name:'TuComida',      nameAr:'تكوميدا ريزو',    description:'صدور وبرجر وسجق واستربس وميت بولز مع أرز بخلطتنا المميزة وصوص تكوميدا',           singlePrice:150 },

  // ─── MEALS HEALTHY ────────────────────────────────────────
  // Casdia 200→230 | MeatBalls 220→240 | Zayed 210→230 | Barry 200→235
  // RolitPasta 210→230 | Turkish 210→230 | Delight 210→230 | Tokyo 210→240
  // ExtraDelight 255→275 | ShalbiSolfan 260→275
  { categoryId:'meals_healthy', name:'Burgerlicious',   nameAr:'برجرليشس',    description:'توست صحي مع برجر اللحم الصحي والخس والخضار وصوص مع سلطه خضراء',                                                               singlePrice:180, calories:429, protein:42 },
  { categoryId:'meals_healthy', name:'Casdia',          nameAr:'كازديا',      description:'تورتيلا صحي مع شرائح الصدور والمشروم والفلفل الالوان والجبن مع سلطه خضراء',                                                    singlePrice:230, calories:517, protein:43 },
  { categoryId:'meals_healthy', name:'Meat Balls Meal', nameAr:'ميت بولز ميل',description:'كرات اللحم بالصوص مع أرز بسمتي مبهر أو باستا ريد صوص مع سلطه خضراء',                                                         singlePrice:240, calories:525, protein:37.92 },
  { categoryId:'meals_healthy', name:'Zayed Special',   nameAr:'زايد سبيشيال',description:'البطاطس البيوريه اللذيذه مع برجر الدجاج المشوي مع سلطه خضراء',                                                               singlePrice:230, calories:463, protein:37 },
  { categoryId:'meals_healthy', name:'Toxic',           nameAr:'توكسيك',      description:'تورتيلا صحي مع سماش برجر والدجاج المشوي الطازج والمشروم والبصل المكرمل والفلفل الالوان والجبن مع سلطه خضراء',                singlePrice:255, calories:506, protein:59.11 },
  { categoryId:'meals_healthy', name:'Barry',           nameAr:'باري',        description:'صدور مشويه بتتبيلة تكوميدا وأرز بسمتي متبله بالزعتر تقدم مع سلطه خضراء',                                                     singlePrice:235, calories:466, protein:46.91 },
  { categoryId:'meals_healthy', name:'Rolit Pasta',     nameAr:'روليت باستا', description:'صدور الدجاج المشوي وشرائح المشروم الفريش بصوص المشروم ويقدم باستا بصوص المشروم مع سلطه خضراء',                              singlePrice:230, calories:511, protein:46.91 },
  { categoryId:'meals_healthy', name:'Turkish Dish',    nameAr:'طبق تركي',    description:'كفته الدجاج التركية مع أرز بسمتي بالخضار مع سلطه خضراء',                                                                      singlePrice:230, calories:466, protein:46.81 },
  { categoryId:'meals_healthy', name:'Delight',         nameAr:'ديلايت',      description:'شرائح صدور مع الفلفل الحلو يتم تسويته في صوص الرانش وتقدم مع أرز بسمتي وسلطه خضراء',                                        singlePrice:230, calories:98,  protein:48.9,  isStar:true, isNew:true },
  { categoryId:'meals_healthy', name:'Tokyo',           nameAr:'طوكيو',       description:'باستا وايت صوص مع برجر اللحم وشرائح الدجاج والفلفل الالوان المشوي مع سلطه خضراء',                                            singlePrice:240, calories:535, protein:57 },
  { categoryId:'meals_healthy', name:'Extra Delight',   nameAr:'إكسترا ديلايت',description:'كرات لحم وصدور تركي مدخن وفلفل يتم تسويته في صوص الرانش وتقدم مع أرز بسمتي وسلطه خضراء',                                  singlePrice:275, calories:510, protein:62,    isStar:true, isNew:true },
  { categoryId:'meals_healthy', name:'Shalbi Solfan',   nameAr:'شلبي سلفان',  description:'ميكس لحوم ميت بولز وصدور وسجق وفلفل الوان ومشروم مع صوص كريمي يقدم مع أرز بسمتي حار مع سلطه خضراء',                        singlePrice:275, calories:567, protein:61.91, isStar:true, isNew:true },

  // ─── MEALS SPECIAL ────────────────────────────────────────
  // TrioCream 240→270 | AsianSweet 250→270
  { categoryId:'meals_special', name:'Trio Cream',       nameAr:'تريو كريم',      description:'بيف برجر محشي جبنه شيدر وقطع الهوت دوج ومشروم وصوص مشروم',                           singlePrice:270 },
  { categoryId:'meals_special', name:'Swedish Meatballs',nameAr:'سويدش ميت بولز', description:'كور لحم محشي شيدر أحمر في صوص كريمي مميز مع مشروم وبيكون',                            singlePrice:250 },
  { categoryId:'meals_special', name:'Asian Sweet',      nameAr:'آسيان سويت',     description:'بيف برجر مع قطع كرانشي تشيكن مغطي بصوص سويت اند ساور وذرة حلوه',                      singlePrice:270 },
  { categoryId:'meals_special', name:'Country Ranch',    nameAr:'كانتري رانش',    description:'صدر دجاج محشي بسجق بلدي وميكس فلفل والجبن ومغطي بصوص الرانش',                         singlePrice:250 },
  { categoryId:'meals_special', name:'Cheli Turkish',    nameAr:'تشيلي تركيش',    description:'صدر دجاج كرانشي مغطي بصوص سويت تشيلي وتركي مدخن وخيار مخلل',                          singlePrice:250 },
  { categoryId:'meals_special', name:'Escalope',         nameAr:'إسكالوب',        description:'اسكالوب تشيكن وقطع المشروم الفريش وبيف بيكون وصوص المشروم',                            singlePrice:260 },

  // ─── PASTA STATION ────────────────────────────────────────
  // ChickenAlfredo 165→180 | AlfredoShrimp 175→180 | Pesto 170→180 | Picata 170→185
  // Negresco 160→180 | NegrescoBurger 180→185 | Canton 165→180
  { categoryId:'pasta', name:'Chicken Alfredo', nameAr:'تشيكن الفريدو', description:'باستا فوتتشيني/بنا مع صوص الفريدو ومشروم والدجاج',                                     singlePrice:180 },
  { categoryId:'pasta', name:'Alfredo Shrimp',  nameAr:'الفريدو شريمب', description:'باستا فوتتشيني/بنا وصوص ألفريدو وجمبري وكابوريا',                                      singlePrice:180 },
  { categoryId:'pasta', name:'Pesto Pasta',     nameAr:'بيستو باستا',   description:'الباستا (بنا) مع صوص الريحان الطازج والدجاج',                                          singlePrice:180 },
  { categoryId:'pasta', name:'Picata',          nameAr:'بيكاتا',        description:'الباستا مع صوص المشروم والكريمه والدجاج المحمر او المشوي',                              singlePrice:185 },
  { categoryId:'pasta', name:'Bolognese',       nameAr:'بولونيز',       description:'الباستا مع صوص الطماطم مع كرات اللحم البقري',                                          singlePrice:170 },
  { categoryId:'pasta', name:'Negresco',        nameAr:'نيجريسكو',      description:'باستا بنا مع الدجاج المشوي وايت صوص وموزريلا',                                         singlePrice:180 },
  { categoryId:'pasta', name:'Negresco Burger', nameAr:'نيجريسكو برجر', description:'باستا بنا مع برجر لحم وصوص وايت وموزريلا',                                            singlePrice:185 },
  { categoryId:'pasta', name:'Canton',          nameAr:'كانتون',        description:'الباستا مع صوص اند ساور مع الخضروات المشويه وشرائح الدجاج او الاستربس',               singlePrice:180 },

  // ─── TATBELA CHICKEN ──────────────────────────────────────
  { categoryId:'tatbela_chicken', name:'صدور دجاج اسبيتيال',         nameAr:'صدور دجاج اسبيتيال',         description:'شرائح صدور فيليه بتتبيلتنا المميزة - 500 جرام',                singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'صدور دجاج تندوري',           nameAr:'صدور دجاج تندوري',           description:'شرائح صدور فيليه بتتبيلة التندوري والماسلا - 500 جرام',      singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'صدور دجاج بالتم يم',         nameAr:'صدور دجاج بالتم يم',         description:'شرائح صدور فيليه بمعجون التم يم - 500 جرام',                  singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'صدور دجاج بالريحان',         nameAr:'صدور دجاج بالريحان',         description:'شرائح صدور فيليه بالزبادي والريحان - 500 جرام',               singlePrice:180 },
  { categoryId:'tatbela_chicken', name:'صدور دجاج زبده وزعتر كيتو',  nameAr:'صدور دجاج زبده وزعتر كيتو',  description:'شرائح صدور فيليه بالزبده والزعتر الفريش - 500 جرام',          singlePrice:180 },
  { categoryId:'tatbela_chicken', name:'صدور بالثوم والعسل',         nameAr:'صدور بالثوم والعسل',         description:'شرائح صدور فيليه بالثوم والعسل - 500 جرام',                    singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'فاهيتا الدجاج',             nameAr:'فاهيتا الدجاج',             description:'مكعبات صدور بتتبيلة الفاهيتا والفلفل الألوان - 500 جرام',     singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'كفتة دجاج تركي',            nameAr:'كفتة دجاج تركي',            description:'مفروم الصدور بخلطتنا المميزة - 500 جرام',                      singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'برجر دجاج',                 nameAr:'برجر دجاج',                 description:'مفروم الصدور بخلطه برجر تكوميدا - 500 جرام',                  singlePrice:175 },
  { categoryId:'tatbela_chicken', name:'شيش طاووق',                 nameAr:'شيش طاووق',                 description:'مكعبات شيش وبصل وفلفل الوان - 500 جرام',                       singlePrice:175 },

  // ─── TATBELA MEAT ─────────────────────────────────────────
  { categoryId:'tatbela_meat', name:'كفته صافي',           nameAr:'كفته صافي',           description:'كفته لحم بالبصل وتتبيلتنا المميزة - 500 جرام',    singlePrice:335 },
  { categoryId:'tatbela_meat', name:'برجر لحم',            nameAr:'برجر لحم',            description:'برجر لحم المميز من تكوميدا - 500 جرام',            singlePrice:335 },
  { categoryId:'tatbela_meat', name:'برجر لحم محشي كيتو',  nameAr:'برجر لحم محشي كيتو',  description:'برجر لحمة محشي جبن - 500 جرام',                   singlePrice:240 },
  { categoryId:'tatbela_meat', name:'ميت بولز',            nameAr:'ميت بولز',            description:'كورات لحم بالبصل وتتبيلتنا المميزة - 500 جرام',    singlePrice:334 },
  { categoryId:'tatbela_meat', name:'سويدش ميت بولز كيتو', nameAr:'سويدش ميت بولز كيتو', description:'كورات لحم محشيه جبن مميزه - 500 جرام',              singlePrice:335 },
  { categoryId:'tatbela_meat', name:'تاكو بيف',            nameAr:'تاكو بيف',            description:'تورتيلا محشي لحم مفروم متبل - 3 قطع',              singlePrice:300 },
  { categoryId:'tatbela_meat', name:'فرضه للشوي',          nameAr:'فرضه للشوي',          description:'فرضة للشوي - 500 جرام',                            singlePrice:340 },
  { categoryId:'tatbela_meat', name:'أوراك للشوي',         nameAr:'أوراك للشوي',         description:'أوراك للشوي',                                       singlePrice:160 },
  { categoryId:'tatbela_meat', name:'كوردن بلو',           nameAr:'كوردن بلو',           description:'كوردن بلو',                                         singlePrice:180 },

  // ─── PROTEIN ──────────────────────────────────────────────
  { categoryId:'protein', name:'صدور فيليه مشويه',       nameAr:'صدور فيليه مشويه',      description:'', singlePrice:120 },
  { categoryId:'protein', name:'صدور ليمون ديل',         nameAr:'صدور ليمون ديل',        description:'', singlePrice:135 },
  { categoryId:'protein', name:'صدور بيكاتا',            nameAr:'صدور بيكاتا',           description:'', singlePrice:135 },
  { categoryId:'protein', name:'صدور رانشي',             nameAr:'صدور رانشي',            description:'', singlePrice:125 },
  { categoryId:'protein', name:'صدور فاهيتا',            nameAr:'صدور فاهيتا',           description:'', singlePrice:120 },
  { categoryId:'protein', name:'شيش طاووق بروتين',       nameAr:'شيش طاووق',             description:'', singlePrice:120 },
  { categoryId:'protein', name:'كفته دجاج تركي بروتين',  nameAr:'كفته دجاج تركي',        description:'', singlePrice:120 },
  { categoryId:'protein', name:'برجر دجاج بروتين',       nameAr:'برجر دجاج',             description:'', singlePrice:120 },
  { categoryId:'protein', name:'ميت بولز بالصوص',        nameAr:'ميت بولز بالصوص',       description:'', singlePrice:160 },
  { categoryId:'protein', name:'كفته مشويه',             nameAr:'كفته مشويه',            description:'', singlePrice:160 },
  { categoryId:'protein', name:'برجر لحم بروتين',        nameAr:'برجر لحم',              description:'', singlePrice:160 },

  // ─── SIDE DISH ────────────────────────────────────────────
  { categoryId:'side_dish', name:'أرز بسمتي',       nameAr:'أرز بسمتي',      description:'', singlePrice:40 },
  { categoryId:'side_dish', name:'باستا وايت صوص',  nameAr:'باستا وايت صوص', description:'', singlePrice:50 },
  { categoryId:'side_dish', name:'باستا ريد صوص',   nameAr:'باستا ريد صوص',  description:'', singlePrice:45 },
  { categoryId:'side_dish', name:'بيستو باستا سايد', nameAr:'بيستو باستا',   description:'', singlePrice:50 },
  { categoryId:'side_dish', name:'فرايز ايرفراير',  nameAr:'فرايز ايرفراير', description:'', singlePrice:40 },
  { categoryId:'side_dish', name:'بطاطس مهروسة',    nameAr:'بطاطس مهروسة',   description:'', singlePrice:40 },
  { categoryId:'side_dish', name:'سلطة خضراء',      nameAr:'سلطة خضراء',     description:'', singlePrice:40 },

  // ─── TACO BEL ─────────────────────────────────────────────
  { categoryId:'taco', name:'Taco Beef',   nameAr:'تاكو بيف',   description:'لحم مفروم متبل مع البصل والفلفل والجبن',                    singlePrice:90 },
  { categoryId:'taco', name:'Ola Borito',  nameAr:'أولا بوريتو',description:'قطع ستربس الغني وفلفل الوان وجبن خضروات',                  singlePrice:75 },
  { categoryId:'taco', name:'Alfredo Taco',nameAr:'الفريدو تاكو',description:'الدجاج الكريمي والمشروم الفريش والخضروات وجبن',            singlePrice:80 },
  { categoryId:'taco', name:'Latchi',      nameAr:'لاتشي',      description:'سوسيس وفلفل وبصل مكرمل وجبن',                              singlePrice:65 },
  { categoryId:'taco', name:'Bachi',       nameAr:'باتشي',      description:'سجق وصدور ومفروم وهوت دوج وميكس جبن',                      singlePrice:80, isNew:true },
  { categoryId:'taco', name:'Turki Taco',  nameAr:'تركي تاكو',  description:'كفته فراخ مشويه وفلفل والبصل المكرمل وميكس جبن',           singlePrice:75, isNew:true },

  // ─── JUST POTATO ──────────────────────────────────────────
  // Savory: 70→80
  { categoryId:'just_potato', name:'Potato Purée',    nameAr:'بوتاتو بيوريه',  description:'بطاطس بيوريه محشيه بـ (لحم مفروم/مشروم ودجاج حشوه تكوميدا) وصوص وجبن او خضروات فريش', singlePrice:90 },
  { categoryId:'just_potato', name:'Potica',          nameAr:'بوتيكا',          description:'فرايز والدجاج والمشروم والجبن والفلفل',                                                   singlePrice:85 },
  { categoryId:'just_potato', name:'Savory',          nameAr:'سافوري',          description:'فرايز وسوسيس وفلفل الوان وصوص تيستي',                                                     singlePrice:80 },
  { categoryId:'just_potato', name:'Vetga',           nameAr:'فيتجا',           description:'فرايز وقطع الاستربس والاضافات وصوص تكساس',                                                singlePrice:85 },
  { categoryId:'just_potato', name:'Tucomida Potato', nameAr:'تكوميدا بوتاتو',  description:'فرايز والبرجر والصدور والسوسيس والفلفل',                                                  singlePrice:95, isNew:true },
  { categoryId:'just_potato', name:"Puc's",           nameAr:"بك'ز",            description:'فرايز ولحم مفروم والفلفل والجبن',                                                         singlePrice:90, isNew:true },

  // ─── ICED COFFEE ──────────────────────────────────────────
  { categoryId:'iced_coffee', name:'Coffee',          nameAr:'قهوة',        description:'', singlePrice:35 },
  { categoryId:'iced_coffee', name:'Latte',           nameAr:'لاتيه',       description:'', singlePrice:45 },
  { categoryId:'iced_coffee', name:'Mocha',           nameAr:'موكا',        description:'', singlePrice:50 },
  { categoryId:'iced_coffee', name:'Caramel',         nameAr:'كراميل',      description:'', singlePrice:55 },
  { categoryId:'iced_coffee', name:'White Mocha',     nameAr:'وايت موكا',   description:'', singlePrice:55 },
  { categoryId:'iced_coffee', name:'Nutella Mocha',   nameAr:'نوتيلا موكا', description:'', singlePrice:59 },
  { categoryId:'iced_coffee', name:'Oreo Latte',      nameAr:'أوريو لاتيه', description:'', singlePrice:57, isStar:true },
  { categoryId:'iced_coffee', name:'Cinnamon Latte',  nameAr:'قرفة لاتيه',  description:'', singlePrice:50, isStar:true },
  { categoryId:'iced_coffee', name:'Strawberry Latte',nameAr:'فراولة لاتيه',description:'', singlePrice:55, isStar:true },

  // ─── SOFT DRINKS ──────────────────────────────────────────
  { categoryId:'soft_drinks', name:'Tea',        nameAr:'شاي',      description:'', singlePrice:25 },
  { categoryId:'soft_drinks', name:'Herbs',      nameAr:'أعشاب',    description:'', singlePrice:25 },
  { categoryId:'soft_drinks', name:'Water',      nameAr:'مياه',     description:'', singlePrice:20 },
  { categoryId:'soft_drinks', name:'Sptro',      nameAr:'سبترو',    description:'', singlePrice:40 },
  { categoryId:'soft_drinks', name:'V7',         nameAr:'V.7',      description:'', singlePrice:50 },
  { categoryId:'soft_drinks', name:'Green Cola', nameAr:'قرين كولا',description:'', singlePrice:60 },

  // ─── WINTER DRINKS ────────────────────────────────────────
  { categoryId:'winter_drinks', name:'Hot Chocolate',          nameAr:'هوت شوكليت',          description:'', singlePrice:80 },
  { categoryId:'winter_drinks', name:'Hot Chocolate Brownie',  nameAr:'هوت شوكليت براوني',    description:'', singlePrice:85 },
  { categoryId:'winter_drinks', name:'Hot Chocolate Strawb',   nameAr:'هوت شوكليت فراولة',    description:'', singlePrice:85 },
  { categoryId:'winter_drinks', name:'Hot Chocolate Flex',     nameAr:'هوت شوكليت فليكس',     description:'', singlePrice:85 },
  { categoryId:'winter_drinks', name:'Hot Chocolate Espresso', nameAr:'هوت شوكليت إسبريسو',   description:'', singlePrice:90 },
  { categoryId:'winter_drinks', name:'Hot Chocolate Nutella',  nameAr:'هوت شوكليت نوتيلا',    description:'', singlePrice:90 },

  // ─── SMOOTHIE ─────────────────────────────────────────────
  // Single: 60→75 | Combo: 70→85
  ...[
    ['Peach','خوخ',75], ['Melon','شمام',75], ['Mango','مانجو',75], ['Kiwi','كيوي',75],
    ['Strawberrie','فراولة',75], ['Minte Lemon','منت ليمون',75], ['MixBerry','ميكس بيري',75],
    ['Blueberry','بلوبيري',75],
    ['Berry & Strawberry','بيري وفراولة',85], ['Melon & Strawberry','شمام وفراولة',85],
    ['Melon & Peach','شمام وخوخ',85], ['Mango & Kiwi','مانجو وكيوي',85],
    ['Peach & Mago','خوخ ومانجو',85], ['Kiwi & Strawberry','كيوي وفراولة',85],
  ].map(([n,ar,p]) => ({ categoryId:'smoothie', name:n, nameAr:ar, description:'سموذي طازج', singlePrice:p })),

  // ─── MOJITO SPECIAL ───────────────────────────────────────
  ...[
    ['Mango','مانجو',75], ['Kiwi','كيوي',75], ['JellyCola','جيلي كولا',75],
    ['Strawberrie','فراولة',75], ['Watermelon','بطيخ',75], ['Peach','خوخ',75],
    ['Mint Lemon','منت ليمون',75], ['Blueberry','بلوبيري',75], ['Mixberry','ميكس بيري',75],
    ['Melon & Strawberry','شمام وفراولة',95], ['Melon & Peach','شمام وخوخ',95],
    ['Mango & Kiwi','مانجو وكيوي',95], ['Peach & Mango','خوخ ومانجو',95],
    ['Kiwi & Mint','كيوي ومنت',95], ['Kiwi & Strawberry','كيوي وفراولة',95],
  ].map(([n,ar,p]) => ({ categoryId:'mojito_special', name:n+' Mojito', nameAr:ar, description:'موهيتو سبيشيال', singlePrice:p })),

  // ─── MAIN COURSE ──────────────────────────────────────────
  // ChikyBeef 210→235 | ShishLovers 220→230 | MixGrill 230→240 | MixGrillVIP 270→290 | BeefBuds 225→240
  { categoryId:'main_course', name:'Crunchy Main',  nameAr:'كرانشي',       description:'استربس و رز وبطاطس وصوص',                                               singlePrice:190 },
  { categoryId:'main_course', name:'Chiky Beef',    nameAr:'تشيكي بيف',    description:'كفته لحم وشيش طاووق وأرز وفرايز وصوص',                                  singlePrice:235 },
  { categoryId:'main_course', name:'Shish Lovers',  nameAr:'شيش لفرز',     description:'شيش طاووق وأرز وفرايز وسلطه وطحينه',                                    singlePrice:230 },
  { categoryId:'main_course', name:'Mix Grill',     nameAr:'ميكس جريل',    description:'شيش طاووق و كفته الدجاج وكفته لحم أرز وفرايز وطحينه',                   singlePrice:240 },
  { categoryId:'main_course', name:'Mix Grill VIP', nameAr:'ميكس جريل VIP',description:'شيش طاووق و كفته الدجاج وكفته لحم وسجق وصدر أرز وفرايز وطحينه وسلاد',  singlePrice:290 },
  { categoryId:'main_course', name:'BEEF BUDS',     nameAr:'بيف بودز',     description:'كفته مشويه وأرز وطحينه وفرايز',                                          singlePrice:240 },
];

// ============================================================
async function seed() {
  console.log('🌱 بدء رفع المنيو المحدّث...');

  await db.ref('menu').remove();
  console.log('🗑  تم مسح المنيو القديم');

  const catRefs = {};
  for (const [key, cat] of Object.entries(categories)) {
    const ref = await db.ref('menu/categories').push(cat);
    catRefs[key] = ref.key;
    process.stdout.write('.');
  }
  console.log(`\n✅ تم رفع ${Object.keys(categories).length} كاتيجوري`);

  let count = 0;
  for (const item of items) {
    const catId = catRefs[item.categoryId];
    if (!catId) { console.warn(`⚠️ لم يُعثر على كاتيجوري: ${item.categoryId}`); continue; }
    const { categoryId, ...itemData } = item;
    await db.ref('menu/items').push({ ...itemData, categoryId: catId, active: true, image: '' });
    count++;
    process.stdout.write('.');
  }
  console.log(`\n✅ تم رفع ${count} أيتم`);

  console.log('\n🎉 اكتمل تحديث المنيو بنجاح!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
