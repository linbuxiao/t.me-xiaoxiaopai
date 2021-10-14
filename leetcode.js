import got from 'got'
import DB from 'nedb'
import path from 'path'
import consola from 'consola'
import { Bot } from 'grammy'
import art from 'art-template'
import dotenv from 'dotenv'

dotenv.config()

const bot = new Bot(process.env.TELEGRAM_TOKEN)

const db = new DB({ filename: path.join(process.cwd(), 'db/leetcode.db') , autoload: true})

const res = await got({
  method: 'POST',
  url: 'https://leetcode-cn.com/graphql/',
  json: {
    "operationName":"solutionArticles",
    "variables":{"userSlug":"linbuxiao","skip":0,"first":10},
    "query":"query solutionArticles($userSlug: String!, $skip: Int, $first: Int, $query: String) {\n  solutionArticles(userSlug: $userSlug, skip: $skip, first: $first, query: $query) {\n    totalNum\n    edges {\n      node {\n        ...solutionArticle\n        question {\n          questionTitle\n          questionTitleSlug\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment solutionArticle on SolutionArticleNode {\n  rewardEnabled\n  canEditReward\n  uuid\n  title\n  slug\n  sunk\n  chargeType\n  status\n  identifier\n  canEdit\n  canSee\n  reactionType\n  reactionsV2 {\n    count\n    reactionType\n    __typename\n  }\n  tags {\n    name\n    nameTranslated\n    slug\n    tagType\n    __typename\n  }\n  createdAt\n  thumbnail\n  author {\n    username\n    profile {\n      userAvatar\n      userSlug\n      realName\n      __typename\n    }\n    __typename\n  }\n  summary\n  topic {\n    id\n    commentCount\n    viewCount\n    __typename\n  }\n  byLeetcode\n  isMyFavorite\n  isMostPopular\n  isEditorsPick\n  hitCount\n  videosInfo {\n    videoId\n    coverUrl\n    duration\n    __typename\n  }\n  __typename\n}\n"}
})

let list = []

try {
  list = JSON.parse(res.body).data.solutionArticles.edges.map(item => {
    return {
      title: item.node.title,
      uuid: item.node.uuid,
      summary: item.node.summary,
      date: item.node.createdAt,
      link: `https://leetcode-cn.com/problems/${item.node.question.questionTitleSlug}/solution/${item.node.slug}/`
    }
  })
} catch(e) {
  consola.error(`
  Error: ${e} \n
  respone: ${res.body}
  `)
}

list.map(item => {
  db.findOne({uuid: item.uuid}, (err, doc)=> {
    if(err) {
      consola.error(err)
    }
    if(doc === null) {
      bot.api.sendMessage('@xiaoxiaopai', art(path.join(process.cwd(), 'views/leetcode.art'), {
        ...item,
        summary: item.summary.length > 20 ? `${item.summary.slice(0, 21)}...`: item.summary
      }), {
        parse_mode: 'Markdown'
      })
      db.insert(item)
    }
  })
})

// 删除多余的文章
const allData = db.getAllData()

if(allData.length > 10) {
  while(allData.length > 10) {
    const removeItem = allData.shift()
    db.remove({uuid: removeItem.uuid})
  }
}