const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[？?！!，,。.\s]/g, '')
    .trim()

const tripWords = ['行程', '路线', '攻略', '一日游', '两日游', '亲子', '几天', '滇池路线']
const availabilityWords = ['今天', '今晚', '房态', '有房', '可订', '空房', '实时']

function buildTripAnswer(cleaned) {
  const isFamily = ['亲子', '孩子', '儿童', '宝宝'].some((word) => cleaned.includes(word))
  const wantsDianchi = ['滇池', '海埂', '西山', '海鸥'].some((word) => cleaned.includes(word))
  const twoDays = ['两日', '2天', '二日', '两天'].some((word) => cleaned.includes(word))

  if (isFamily) {
    return '亲子出行建议节奏放慢：上午去云南省博物馆或官渡古镇，中午回民宿休息，下午安排滇池边散步。人数较多时，建议提前确认亲子家庭房。'
  }

  if (wantsDianchi) {
    return '滇池路线建议上午出发：海埂大坝 → 西山索道 → 公园茶歇 → 傍晚回城。冬季看海鸥尽量上午去，回程可顺路吃本地菌菇火锅。'
  }

  if (twoDays) {
    return '两日行程可以这样排：第1天翠湖、陆军讲武堂、老街和南屏街；第2天滇池海埂、西山和斗南花市，下午看花市更顺路。'
  }

  return '一日行程建议翠湖公园 → 陆军讲武堂 → 老街咖啡 → 南屏街晚餐。适合初到昆明，路程短，能慢慢感受老城生活。'
}

export function findAnswer(question, faqItems, fallback) {
  const cleaned = normalize(question)

  if (!cleaned) {
    return {
      text: '可以直接输入你关心的问题，比如“今天还有房吗”“从机场怎么过来”“两天亲子路线怎么安排”。',
      type: 'empty'
    }
  }

  if (availabilityWords.some((word) => cleaned.includes(normalize(word)))) {
    return {
      text: '房态实时变化，请点击联系管家确认今日可订房型。',
      type: 'availability'
    }
  }

  if (tripWords.some((word) => cleaned.includes(normalize(word)))) {
    return {
      text: buildTripAnswer(cleaned),
      type: 'route'
    }
  }

  const scored = faqItems
    .map((item) => {
      const score = item.keywords.reduce((total, keyword) => {
        return cleaned.includes(normalize(keyword)) ? total + 1 : total
      }, 0)

      return { ...item, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return {
    text: scored[0]?.answer ?? fallback,
    type: scored[0] ? 'matched' : 'fallback'
  }
}
