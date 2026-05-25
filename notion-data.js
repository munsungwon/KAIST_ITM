/**
 * KAIST I&TM 동문회 - Notion API 프록시
 * Vercel 서버리스 함수
 *
 * 환경변수 (Vercel Dashboard > Settings > Environment Variables):
 *   NOTION_TOKEN       : 노션 API 토큰 (ntn_xxxxxxxx)
 *   NOTION_DATABASE_ID : b96fd44e2aea48a492fe17cbb486cc65
 */

const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_DATABASE_ID;

  if (!TOKEN || !DB_ID) {
    return res.status(500).json({
      error: '환경변수(NOTION_TOKEN, NOTION_DATABASE_ID)를 Vercel에 설정해주세요.'
    });
  }

  try {
    const records = await fetchAll(TOKEN, DB_ID);
    const stats   = aggregate(records);
    res.status(200).json({ total: records.length, updated: new Date().toISOString(), stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function fetchAll(token, dbId) {
  const results = [];
  let cursor;

  while (true) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type':   'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
    const data = await r.json();

    for (const page of data.results) {
      const p = page.properties;
      results.push({
        name:     getTitle(p['이름']),
        company:  getText(p['소속(회사)']),
        industry: getSelect(p['업종']),
        class:    getSelect(p['기수']),
        classNum: getNumber(p['기수 번호']),
        degree:   getText(p['최종학위']),
      });
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return results;
}

function aggregate(records) {
  const company = {}, industry = {}, classMap = {}, degree = {};

  for (const r of records) {
    if (r.company)  company[r.company]   = (company[r.company]   || 0) + 1;
    if (r.industry) industry[r.industry] = (industry[r.industry] || 0) + 1;
    if (r.class)    classMap[r.class]    = (classMap[r.class]    || 0) + 1;

    const dk = r.degree.includes('박사') ? '박사/박사과정'
             : r.degree.includes('석사') ? '석사/석사과정'
             : r.degree.includes('학사') ? '학사' : '기타';
    degree[dk] = (degree[dk] || 0) + 1;
  }

  const sort = o => Object.fromEntries(Object.entries(o).sort((a,b) => b[1]-a[1]));
  const sortClass = o => Object.fromEntries(
    Object.entries(o).sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
  );

  return { company: sort(company), industry: sort(industry), class: sortClass(classMap), degree: sort(degree) };
}

const getTitle    = p => p?.title?.[0]?.plain_text?.trim()     || '';
const getText     = p => p?.rich_text?.[0]?.plain_text?.trim() || '';
const getSelect   = p => p?.select?.name                       || '';
const getNumber   = p => p?.number ?? null;
