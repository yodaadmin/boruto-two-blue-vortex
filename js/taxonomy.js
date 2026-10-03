/* VORTEX — قوائم التصنيفات (مشتركة بين البحث ولوحة الإدارة) */
const mk = (arr, englishValue) => arr.map(([ar, en]) => ({ v: englishValue ? en : ar, ar, en }));

const TAX = {

    genres: mk([
        ["أكشن","Action"],["مغامرة","Adventure"],["فانتازيا","Fantasy"],["خيال علمي","Sci-Fi"],["دراما","Drama"],
        ["كوميديا","Comedy"],["رومانسية","Romance"],["شريحة من الحياة","Slice of Life"],["رعب","Horror"],["غموض","Mystery"],
        ["إثارة","Thriller"],["نفسي","Psychological"],["تاريخي","Historical"],["جريمة","Crime"],["رياضة","Sports"],
        ["فنون قتالية","Martial Arts"],["مدرسي","School"],["طبي","Medical"],["موسيقى","Music"],["عسكري","Military"],
        ["سياسي","Political"],["مأساة","Tragedy"],["خارق للطبيعة","Supernatural"],["سحر","Magic"],["وحوش","Monsters"],
        ["إيسيكاي","Isekai"],["سفر عبر الزمن","Time Travel"],["تناسخ","Reincarnation"],["بقاء","Survival"],["نهاية العالم","Apocalypse"],
        ["ديستوبيا","Dystopian"],["سايبربانك","Cyberpunk"],["ستيمبانك","Steampunk"],["أساطير","Mythological"],["سباقات","Racing"],
        ["فن","Art"],["طبخ","Cooking"],["أعمال","Workplace"],["ألعاب","Game"],["فنون أدائية","Performing Arts"]
    ]),

    tags: mk([
        ["نظام","System"],["زنزانات","Dungeon"],["أبراج","Tower"],["صيادون","Hunters"],["بوابات","Gates"],
        ["قوى خارقة","Superpowers"],["ميكا","Mecha"],["موريم","Murim"],["ووشيا","Wuxia"],["شيا","Xianxia"],
        ["مصاصو دماء","Vampires"],["زومبي","Zombies"],["شياطين","Demons"],["آلهة","Gods"],["نينجا","Ninja"],
        ["ساموراي","Samurai"],["عصابات","Gang"],["مافيا","Mafia"],["قتلة","Assassins"],["بطل قوي","Overpowered Protagonist"],
        ["بطل مضاد","Antihero"],["شرير","Villain"],["عودة بالزمن","Regression"],["أكاديمية","Academy"],["انتقام","Revenge"]
    ]),

    types: mk([
        ["مانجا","Manga"],["مانهوا","Manhwa"],["مانها","Manhua"],["ويب تون","Webtoon"],["ون شوت","One-shot"]
    ], true),

    status: mk([
        ["مستمرة","Ongoing"],["مكتملة","Completed"],["متوقفة مؤقتًا","Hiatus"],["ملغاة","Cancelled"]
    ]),

    demographics: mk([
        ["كودومو","Kodomo"],["شونين","Shōnen"],["شوجو","Shōjo"],["سينين","Seinen"],["جوسي","Josei"]
    ], true)

};
