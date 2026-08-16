export interface RequirementField {
  key: string;
  label: string;
  question: string;
  required: boolean;
}

const BAOMU_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '咱们这边是需要钟点工、白班、住家、育儿、护工还是菲式保姆呢？', required: true },
  { key: 'householdSize', label: '家庭情况', question: '家里几口人吃饭呀？', required: false },
  { key: 'area', label: '房屋面积', question: '房子大概多大面积呢？', required: false },
  { key: 'elderlyCare', label: '老人照护', question: '家里有需要照顾的老人吗？老人多大年纪？', required: false },
  { key: 'restDays', label: '休息天数', question: '阿姨月休几天呢？4天还是2天？', required: true },
  { key: 'startTime', label: '到岗时间', question: '您希望阿姨什么时候到岗呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'helperRequirements', label: '阿姨要求', question: '对阿姨有什么特殊要求吗？', required: false },
  { key: 'dietaryPreferences', label: '做饭口味', question: '做饭口味有什么偏好？', required: false },
  { key: 'budget', label: '薪资预算', question: '薪资预算大概多少呢？', required: true },
];

const YUESAO_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '您是需要月嫂服务对吗？是26天还是42天的？', required: true },
  { key: 'startTime', label: '预产期/到岗', question: '预产期是什么时候？您需要月嫂什么时候到岗呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'helperRequirements', label: '月嫂要求', question: '对月嫂有什么特殊要求吗？比如催乳、月子餐、新生儿护理等', required: false },
  { key: 'restDays', label: '休息天数', question: '月嫂月休几天呢？', required: false },
  { key: 'budget', label: '薪资预算', question: '薪资预算大概多少？', required: true },
];

const YANGLOA_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '咱们这边是需要住家照顾老人还是白班陪护呢？', required: true },
  { key: 'workMode', label: '工作时间', question: '阿姨是【24 小时住家】还是【8 小时白班】呢？', required: true },
  { key: 'elderlyCare', label: '老人情况', question: '老人身体状况如何？能自理 / 半自理 / 不能自理？', required: true },
  { key: 'restDays', label: '休息天数', question: '阿姨月休几天呢？4天还是2天？', required: true },
  { key: 'startTime', label: '到岗时间', question: '您希望阿姨什么时候到岗呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'helperRequirements', label: '阿姨要求', question: '对照顾老人的阿姨有什么特殊要求吗？', required: false },
  { key: 'dietaryPreferences', label: '做饭口味', question: '老人饮食有什么偏好或忌口？', required: false },
  { key: 'budget', label: '薪资预算', question: '薪资预算大概多少呢？', required: true },
];

const YUER_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '咱们这边是需要住家育儿还是白班育儿呢？', required: true },
  { key: 'workMode', label: '工作时间', question: '阿姨是【24 小时住家】还是【8 小时白班】呢？', required: true },
  { key: 'householdSize', label: '孩子情况', question: '宝宝多大啦？几个孩子需要照顾？', required: true },
  { key: 'restDays', label: '休息天数', question: '阿姨月休几天呢？4天还是2天？', required: true },
  { key: 'startTime', label: '到岗时间', question: '您希望阿姨什么时候到岗呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'helperRequirements', label: '阿姨要求', question: '对育儿阿姨有什么特殊要求吗？比如早教、辅食等', required: false },
  { key: 'dietaryPreferences', label: '做饭口味', question: '家里做饭口味有什么偏好？', required: false },
  { key: 'budget', label: '薪资预算', question: '薪资预算大概多少呢？', required: true },
];

const BAOJIE_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '咱们这边是需要日常保洁还是深度保洁呢？', required: true },
  { key: 'area', label: '房屋面积', question: '房子大概多大面积呢？', required: true },
  { key: 'serviceDuration', label: '服务频次', question: '需要阿姨每周来几次呢？每次几个小时？', required: true },
  { key: 'startTime', label: '开始时间', question: '希望阿姨什么时候开始服务呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'specialRequirements', label: '特殊需求', question: '有没有特殊保洁需求？比如油烟机清洗、擦玻璃、收纳整理等', required: false },
  { key: 'budget', label: '预算', question: '预算大概每次多少呢？', required: true },
];

const FEISHI_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '您是需要菲式保姆对吧？', required: true },
  { key: 'workMode', label: '工作时间', question: '阿姨是【24 小时住家】还是【8 小时白班】呢？', required: true },
  { key: 'householdSize', label: '家庭情况', question: '家里几口人呢？主要想阿姨负责哪些事？', required: true },
  { key: 'restDays', label: '休息天数', question: '阿姨月休几天呢？4天还是2天？', required: true },
  { key: 'startTime', label: '到岗时间', question: '您希望阿姨什么时候到岗呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'helperRequirements', label: '阿姨要求', question: '对菲式阿姨有什么特殊要求吗？比如英语、做菜风格、带睡等', required: false },
  { key: 'budget', label: '薪资预算', question: '薪资预算大概多少呢？', required: true },
];

const DEFAULT_TEMPLATE: RequirementField[] = [
  { key: 'serviceType', label: '服务类型', question: '咱们这边是需要住家、白班还是钟点服务呀？', required: true },
  { key: 'startTime', label: '到岗时间', question: '您希望阿姨什么时候到岗呢？', required: true },
  { key: 'serviceAddress', label: '服务地址', question: '服务地址在哪个区哪个街道？', required: true },
  { key: 'budget', label: '薪资预算', question: '薪资预算大概多少呢？', required: true },
];

const SERVICE_TYPE_ALIASES: Record<string, string> = {
  baomu: 'baomu',
  zhujia: 'baomu',
  baiban: 'baomu',
  zhongdian: 'baomu',
  feishi: 'feishi',
  '保姆': 'baomu',
  '住家': 'baomu',
  '白班': 'baomu',
  '钟点': 'baomu',
  '钟点工': 'baomu',
  '菲式': 'feishi',
  '菲佣': 'feishi',
  yuesao: 'yuesao',
  '26day_yuesao': 'yuesao',
  '月嫂': 'yuesao',
  '26天月嫂': 'yuesao',
  yanglao: 'yanglao',
  '养老': 'yanglao',
  '养老陪护': 'yanglao',
  '护工': 'yanglao',
  yuer: 'yuer',
  '育儿': 'yuer',
  '育儿嫂': 'yuer',
  baojie: 'baojie',
  qingjie: 'baojie',
  '保洁': 'baojie',
  '清洁': 'baojie',
  '保洁阿姨': 'baojie',
  '日常保洁': 'baojie',
  '深度保洁': 'baojie',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  baomu: '保姆',
  feishi: '菲式保姆',
  yuesao: '月嫂',
  yanglao: '护工保姆',
  yuer: '育儿嫂',
  baojie: '保洁',
};

export const SERVICE_TYPE_TEMPLATES: Record<string, RequirementField[]> = {
  baomu: BAOMU_TEMPLATE,
  feishi: FEISHI_TEMPLATE,
  yuesao: YUESAO_TEMPLATE,
  yanglao: YANGLOA_TEMPLATE,
  yuer: YUER_TEMPLATE,
  baojie: BAOJIE_TEMPLATE,
};

export const DEFAULT_TEMPLATE_KEY = 'default';

export function normalizeServiceType(serviceType: string | null | undefined): string {
  if (!serviceType) return DEFAULT_TEMPLATE_KEY;
  const trimmed = serviceType.trim().toLowerCase();
  return SERVICE_TYPE_ALIASES[trimmed]
    ?? SERVICE_TYPE_ALIASES[serviceType.trim()]
    ?? DEFAULT_TEMPLATE_KEY;
}

const SERVICE_SUBTYPE_MAP: Record<string, string> = {
  zhujia: 'zhujia', '住家': 'zhujia', '住家保姆': 'zhujia',
  baiban: 'baiban', '白班': 'baiban', '白班保姆': 'baiban',
  yuer: 'yuer', '育儿': 'yuer', '育儿嫂': 'yuer', '育儿保姆': 'yuer',
  yanglao: 'yanglao', '养老': 'yanglao', '护工': 'yanglao', '护工保姆': 'yanglao', '养老保姆': 'yanglao', '养老陪护': 'yanglao',
  zhongdian: 'zhongdian', '钟点': 'zhongdian', '钟点工': 'zhongdian', '钟点工保姆': 'zhongdian',
  feishi: 'feishi', '菲式': 'feishi', '菲式保姆': 'feishi', '菲佣': 'feishi',
  '26day_yuesao': '26day_yuesao', yuesao: '26day_yuesao', '月嫂': '26day_yuesao', '26天月嫂': '26day_yuesao',
  baomu: 'baomu', '保姆': 'baomu',
};

export function normalizeServiceSubType(serviceType: string | null | undefined): string | null {
  if (!serviceType) return null;
  const trimmed = serviceType.trim();
  const lower = trimmed.toLowerCase();
  return SERVICE_SUBTYPE_MAP[lower] ?? SERVICE_SUBTYPE_MAP[trimmed] ?? null;
}

/**
 * 把 normalizeServiceSubType 返回的 pinyin 标准化成中文（用于写库）
 * normalizeServiceSubType 必须保留 pinyin 输出（routing 决策用），所以在写库前过这层
 */
export function chineseServiceType(pinyinOrChinese: string | null | undefined): string {
  if (!pinyinOrChinese) return '';
  const PINYIN_TO_CHINESE: Record<string, string> = {
    yuesao: '月嫂',
    '26day_yuesao': '月嫂',
    feishi: '菲式',
    zhongdian: '钟点工',
    yuer: '育儿嫂',
    yanglao: '护工',
    baomu: '住家保姆',
    baojie: '保洁',
    baiban: '白班保姆', // v4 实测漏改：白班 pinyin 永远还原不回来，导致白班保姆走兜底
  };
  if (PINYIN_TO_CHINESE[pinyinOrChinese]) return PINYIN_TO_CHINESE[pinyinOrChinese];
  if (/[\u4e00-\u9fa5]/.test(pinyinOrChinese)) return pinyinOrChinese;
  return pinyinOrChinese;
}

export function getTemplate(serviceType: string | null | undefined): RequirementField[] {
  const key = normalizeServiceType(serviceType);
  return SERVICE_TYPE_TEMPLATES[key] ?? DEFAULT_TEMPLATE;
}

export function getServiceTypeLabel(serviceType: string | null | undefined): string {
  const key = normalizeServiceType(serviceType);
  return SERVICE_TYPE_LABELS[key] ?? '通用';
}

export const OPENING_MESSAGES: Record<string, string> = {
  baomu:
    '您好，我是天鹅到家家政服务顾问小书，很高兴为您服务～咱们这边是钟点工、白班、住家、育儿、护工还是菲式保姆？【客服后续会根据您所在的城市给出准确报价】。',
  yuesao:
    '您好，我是天鹅到家家政服务顾问小书，很高兴为您服务～请问您的【预产期】是什么时候？需要【26 天】还是【42 天】的月嫂服务呢？【客服后续会根据您所在的城市给出准确报价】。',
  yanglao:
    '您好，我是天鹅到家家政服务顾问小书，很高兴为您服务～咱们这边是需要【住家】照顾老人还是【白班】陪护？【客服后续会根据您所在的城市给出准确报价】。',
  yuer:
    '您好，我是天鹅到家家政服务顾问小书，很高兴为您服务～请问【宝宝】多大啦？需要【住家】育儿还是【白班】育儿呢？【客服后续会根据您所在的城市给出准确报价】。',
  baojie:
    '您好，我是天鹅到家家政服务顾问小书，很高兴为您服务～咱们这边是需要【日常保洁】还是【深度保洁】呀？【客服后续会根据您所在的城市给出准确报价】。',
};

export const DEFAULT_OPENING_MESSAGE =
  '您好，我是天鹅到家家政服务顾问小书，很高兴为您服务～咱们先确认一下您需要的服务类型和主要想阿姨负责的事。具体价格会根据您所在的城市调整，【客服后续会给准确报价】。请问您想找哪种类型的阿姨？主要想阿姨负责什么呢？';
