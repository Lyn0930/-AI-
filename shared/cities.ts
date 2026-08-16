// 与现有多维表格（tblXd4dMIJ6fUt9D）服务城市选项保持一致
// 2026-08-10 从 bitable 同步过来
export const SERVICE_CITIES = [
  '北京',
  '成都',
  '重庆',
  '长沙',
  '东莞',
  '大连',
  '佛山',
  '福州',
  '广州',
  '贵阳',
  '杭州',
  '合肥',
  '哈尔滨',
  '济南',
  '昆明',
  '兰州',
  '南京',
  '宁波',
  '南昌',
  '南宁',
  '青岛',
  '上海',
  '深圳',
  '苏州',
  '沈阳',
  '石家庄',
  '天津',
  '太原',
  '温州',
  '无锡',
  '武汉',
  '西安',
  '厦门',
  '郑州',
  '珠海',
] as const;

export type ServiceCity = (typeof SERVICE_CITIES)[number];

// 城市首字母（用于字母索引选择器）
// 参考:天鹅到家原版「选择城市」UI(2026-08-10 用户提供截图)
export const CITY_PINYIN_LETTER: Record<ServiceCity, string> = {
  '北京': 'B',
  '成都': 'C',
  '重庆': 'C',
  '长沙': 'C',
  '东莞': 'D',
  '大连': 'D',
  '佛山': 'F',
  '福州': 'F',
  '广州': 'G',
  '贵阳': 'G',
  '杭州': 'H',
  '合肥': 'H',
  '哈尔滨': 'H',
  '济南': 'J',
  '昆明': 'K',
  '兰州': 'L',
  '南京': 'N',
  '宁波': 'N',
  '南昌': 'N',
  '南宁': 'N',
  '青岛': 'Q',
  '上海': 'S',
  '深圳': 'S',
  '苏州': 'S',
  '沈阳': 'S',
  '石家庄': 'S',
  '天津': 'T',
  '太原': 'T',
  '温州': 'W',
  '无锡': 'W',
  '武汉': 'W',
  '西安': 'X',
  '厦门': 'X',
  '郑州': 'Z',
  '珠海': 'Z',
};

// 按字母分组（用于按字母导航的 city picker）
export const CITY_GROUPS: { letter: string; cities: ServiceCity[] }[] = (() => {
  const map = new Map<string, ServiceCity[]>();
  for (const city of SERVICE_CITIES) {
    const letter = CITY_PINYIN_LETTER[city];
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(city);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, cities]) => ({ letter, cities }));
})();

// 选择器中显示的字母索引（按字母序排列，只展示实际有城市的字母）
export const CITY_INDEX_LETTERS: readonly string[] = CITY_GROUPS.map((g) => g.letter);
