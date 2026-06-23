/*
 * RealNail 款式 & DIY 素材数据库
 * 30款真实流行款式 + DIY素材分类
 */
const DB={
  // 款式分类
  cats:[
    {k:'all',n:'全部'},{k:'solid',n:'简约纯色'},{k:'magnetic',n:'猫眼流光'},
    {k:'french',n:'法式优雅'},{k:'ombre',n:'晕染手绘'},{k:'gem',n:'立体钻饰'},
  ],

  // 30款
  styles:[
    {id:'s1',name:'裸粉釉面',s:'solid',c:['#F5EDE6','#FAF5F0'],tags:['纯色','裸粉','日常'],price:198,hot:1,n:0},
    {id:'s2',name:'豆沙玫瑰',s:'solid',c:['#D4A9AD','#E8D5D7'],tags:['纯色','豆沙','显白'],price:198,hot:1,n:0},
    {id:'s3',name:'安可拉红',s:'solid',c:['#8B1A2B','#A52A3D'],tags:['纯色','酒红','气场'],price:218,hot:0,n:0},
    {id:'s4',name:'雾霾蓝',s:'solid',c:['#A8BFCF','#C8DFEF'],tags:['纯色','雾蓝','高级'],price:198,hot:0,n:0},
    {id:'s5',name:'摩卡棕',s:'solid',c:['#A08070','#C0A090'],tags:['纯色','摩卡','秋冬'],price:198,hot:0,n:1},
    {id:'s6',name:'深蓝银河猫眼',s:'magnetic',c:['#1B2838','#2D4A7A','#5B8BD4'],tags:['猫眼','深蓝','显白'],price:328,hot:1,n:0},
    {id:'s7',name:'酒红琥珀猫眼',s:'magnetic',c:['#722F37','#A0525A','#C8797E'],tags:['猫眼','酒红','约会'],price:348,hot:1,n:0},
    {id:'s8',name:'灰月光猫眼',s:'magnetic',c:['#8B8B8B','#B0B0B0','#D4D4D4'],tags:['猫眼','灰色','通勤'],price:298,hot:0,n:0},
    {id:'s9',name:'蜜桃金猫眼',s:'magnetic',c:['#D4A08A','#E0B8A0','#F0C8B0'],tags:['猫眼','蜜桃','温柔'],price:318,hot:0,n:1},
    {id:'s10',name:'经典法式白边',s:'french',c:['#FFF5F5','#FFE0E0','#FFFFFF'],tags:['法式','经典','优雅'],price:238,hot:1,n:0},
    {id:'s11',name:'极细金线法式',s:'french',c:['#FAF5F0','#FFFBF7','#D4AF37'],tags:['法式','金线','高级'],price:258,hot:0,n:0},
    {id:'s12',name:'彩色糖豆法式',s:'french',c:['#FFB3C6','#A8D8EA','#C3E8CD'],tags:['法式','彩色','俏皮'],price:218,hot:0,n:1},
    {id:'s13',name:'微弧黑法式',s:'french',c:['#FAFAFA','#F0F0F0','#262626'],tags:['法式','黑白','极简'],price:238,hot:0,n:0},
    {id:'s14',name:'大理石水墨',s:'ombre',c:['#F5F5F5','#D5D5D5','#A0A0A0'],tags:['晕染','大理石','国风'],price:328,hot:1,n:0},
    {id:'s15',name:'日落海岸',s:'ombre',c:['#FF8C69','#FFB89A','#FFD4C4'],tags:['晕染','橙色','度假'],price:288,hot:0,n:0},
    {id:'s16',name:'蜜桃腮红',s:'ombre',c:['#FDE0D9','#FCC9BB','#FAAE9C'],tags:['晕染','蜜桃','元气'],price:258,hot:1,n:0},
    {id:'s17',name:'柔紫极光',s:'ombre',c:['#E8E0F0','#D0C8E8','#B8A8E0'],tags:['晕染','紫色','梦幻'],price:278,hot:0,n:0},
    {id:'s18',name:'焦糖琥珀',s:'ombre',c:['#C8795A','#D4956E','#E0AD85'],tags:['晕染','焦糖','温暖'],price:328,hot:0,n:1},
    {id:'s19',name:'祖母绿碎钻',s:'gem',c:['#1B4D3E','#2E6B5A','#D4AF37'],tags:['钻饰','绿色','华丽'],price:398,hot:1,n:0},
    {id:'s20',name:'星月满天钻',s:'gem',c:['#FFFDF8','#F5F5DC','#FFD700'],tags:['钻饰','金色','闪耀'],price:458,hot:0,n:0},
    {id:'s21',name:'巴洛克珍珠',s:'gem',c:['#FFF5F0','#FFFAF7','#C0A060'],tags:['钻饰','珍珠','复古'],price:428,hot:0,n:1},
    {id:'s22',name:'海蓝宝冰晶',s:'gem',c:['#8EC8D9','#A8D8EA','#E8F5FA'],tags:['钻饰','蓝色','清透'],price:388,hot:0,n:0},
    {id:'s23',name:'液态银镜面',s:'solid',c:['#C0C0C0','#D4D4D4','#E8E8E8'],tags:['纯色','银色','未来'],price:358,hot:0,n:1},
    {id:'s24',name:'香槟镜面',s:'solid',c:['#D4AF37','#E0C068','#EDD9A3'],tags:['纯色','香槟','轻奢'],price:378,hot:0,n:0},
    {id:'s25',name:'冰透粉晶',s:'solid',c:['#F5E6E8','#FADDE0','#FFD1D7'],tags:['纯色','冰透','清纯'],price:198,hot:0,n:0},
    {id:'s26',name:'薄荷曼波',s:'solid',c:['#C8E8D0','#D8F0DD','#E8F8EA'],tags:['纯色','薄荷','清新'],price:218,hot:0,n:0},
    {id:'s27',name:'干花标本',s:'ombre',c:['#FAF5F0','#F5EDE6','#D4A9AD'],tags:['晕染','干花','文艺'],price:338,hot:0,n:0},
    {id:'s28',name:'极简一根金线',s:'french',c:['#FAF5F0','#FFFBF7','#D4AF37'],tags:['法式','极简','日常'],price:168,hot:0,n:0},
    {id:'s29',name:'小雏菊田园',s:'ombre',c:['#FFFDF8','#F5F5DC','#FFD700'],tags:['晕染','花卉','田园'],price:278,hot:0,n:0},
    {id:'s30',name:'磨砂裸粉',s:'solid',c:['#E2CFCF','#EAD8D8','#F2E1E1'],tags:['纯色','磨砂','温柔'],price:198,hot:0,n:0},
  ],

  enhance(s){return{...s,catName:this.cats.find(c=>c.k===s.s)?.n||s.s,primary:s.c[0],likes:Math.floor(Math.random()*8000)+200}},

  all(){return this.styles.map(s=>this.enhance(s))},

  filter(f={}){
    let l=this.all()
    if(f.s)l=l.filter(s=>s.s===f.s)
    if(f.q){const q=f.q.toLowerCase();l=l.filter(s=>s.name.includes(q)||s.tags.some(t=>t.includes(q)))}
    if(f.hot)l=l.filter(s=>s.hot)
    if(f.n)l=l.filter(s=>s.n)
    return l
  },

  ranking(n=10){return this.all().sort((a,b)=>b.likes-a.likes).slice(0,n)},
  get(id){return this.all().find(s=>s.id===id)||null},
  similar(id,n=6){const s=this.get(id);if(!s)return[];return this.all().filter(x=>x.id!==id&&x.s===s.s).slice(0,n)},

  // DIY素材
  diy:{
    shapes:[
      {k:'square',n:'方形',w:80,h:110,r:'12%'},
      {k:'roundsq',n:'方圆',w:80,h:110,r:'30%'},
      {k:'oval',n:'椭圆',w:78,h:112,r:'42% 42% 34% 34% / 14% 14% 22% 22%'},
      {k:'almond',n:'杏仁',w:76,h:114,r:'44% 44% 34% 34% / 12% 12% 24% 24%'},
      {k:'stiletto',n:'芭蕾',w:72,h:118,r:'45% 45% 20% 20% / 10% 10% 30% 30%'},
    ],
    colors:[
      '#F5EDE6','#FFB3C1','#FF6B8A','#E05575','#D4A9AD','#E8D5D7','#8B1A2B','#A52A3D',
      '#A8BFCF','#C8DFEF','#1B2838','#2D4A7A','#722F37','#A0525A','#8B8B8B','#B0B0B0',
      '#C0C0C0','#D4D4D4','#D4AF37','#EDD9A3','#1B4D3E','#2E6B5A','#FF8C69','#FFB89A',
      '#C8E8D0','#D8F0DD','#E8E0F0','#D0C8E8','#FFD700','#90C695','#FAF5F0','#FFFBF7',
    ],
    decors:{
      gem:{n:'钻饰',items:[
        {id:'dg1',e:'💎',n:'水钻'},{id:'dg2',e:'💠',n:'平底钻'},{id:'dg3',e:'🔷',n:'异形钻'},
      ]},
      pearl:{n:'珍珠',items:[
        {id:'dp1',e:'⚪',n:'圆珍珠'},{id:'dp2',e:'🫧',n:'巴洛克珠'},
      ]},
      sticker:{n:'贴纸',items:[
        {id:'ds1',e:'🌸',n:'花卉'},{id:'ds2',e:'⭐',n:'星星'},{id:'ds3',e:'🦋',n:'蝴蝶'},{id:'ds4',e:'🍒',n:'樱桃'},
      ]},
      metal:{n:'铆钉',items:[
        {id:'dm1',e:'●',n:'圆铆钉'},{id:'dm2',e:'■',n:'方铆钉'},
      ]},
      foil:{n:'金箔',items:[
        {id:'df1',e:'✨',n:'碎金箔'},{id:'df2',e:'🌟',n:'碎银箔'},
      ]},
    },
  },

  // 转化配置
  shop:{wechat:'realnail_kf',url:'https://shop.example.com/nails'},
}

module.exports=DB
