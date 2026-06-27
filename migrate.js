// Moment App 数据迁移：SQLite → JSON + 图片文件
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const DB_PATH = process.argv[2] || '/tmp/moment.db';
const OUTPUT_DIR = process.argv[3] || '/Users/zz/.easyclaw/workspace/moment-server/migrated_data';
const UPLOADS_DIR = path.join(OUTPUT_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function queryToFile(sql, outFile) {
  try {
    execSync(`sqlite3 -json "${DB_PATH}" "${sql}" > "${outFile}" 2>/dev/null`, { stdio: 'ignore', timeout: 30000 });
  } catch(e) {}
  const raw = fs.readFileSync(outFile, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

const TMP = '/tmp/migrate_tmp';

const sqliteUsers = queryToFile("SELECT id, phone, token, created_at, daily_pick_enabled, consecutive_days, last_upload_date, badge_7, badge_30, badge_100, badge_200, badge_306, badge_365 FROM users", TMP + '_users.json');
const sqliteLikes = queryToFile("SELECT user_id, moment_id, created_at FROM likes", TMP + '_likes.json');
const sqliteReports = queryToFile("SELECT moment_id, reporter_id, reason, note, created_at FROM reports", TMP + '_reports.json');
const sqliteMoments = queryToFile("SELECT id, user_id, slot, thought, filter_style, created_at, status FROM moments", TMP + '_moments.json');

// 用户
const users = sqliteUsers.map(u => ({
  id: u.id, phone: u.phone, token: u.token, tokenCreatedAt: 0,
  nickname: '', avatar: '',
  preferences: { daily_pick_enabled: u.daily_pick_enabled === 1 },
  consecutive_days: u.consecutive_days || 0,
  last_upload_date: u.last_upload_date || '',
  badge_7: u.badge_7 || 0, badge_30: u.badge_30 || 0, badge_100: u.badge_100 || 0,
  badge_200: u.badge_200 || 0, badge_306: u.badge_306 || 0, badge_365: u.badge_365 || 0,
  created_at: u.created_at
}));

// 动态 + 图片
const moments = [];
let migratedCount = 0;

// 逐条读取 dataUrl（大字段单独处理）
for (const m of sqliteMoments) {
  execSync(`sqlite3 "${DB_PATH}" "SELECT dataUrl FROM moments WHERE id=${m.id}" > "${TMP}_dataurl"`, { stdio: 'ignore', timeout: 10000 });
  let dataUrl = fs.readFileSync(`${TMP}_dataurl`, 'utf8').trim();
  
  let imagePath = '';
  if (dataUrl && dataUrl.includes('base64,')) {
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
    if (matches) {
      const ext = matches[1] === 'png' ? 'png' : 'jpg';
      const buf = Buffer.from(matches[2], 'base64');
      const name = crypto.randomBytes(8).toString('hex') + '.' + ext;
      fs.writeFileSync(path.join(UPLOADS_DIR, name), buf);
      imagePath = '/uploads/' + name;
      migratedCount++;
    }
  }
  
  moments.push({
    id: m.id, userId: m.user_id, slot: m.slot,
    imagePath, thought: m.thought || '', filterStyle: m.filter_style || '',
    like_count: 0, status: m.status || 'approved', created_at: m.created_at
  });
}

// 点赞数
sqliteLikes.forEach(l => {
  const mom = moments.find(m => m.id === l.moment_id);
  if (mom) mom.like_count++;
});

// 点赞
const likes = sqliteLikes.map(l => ({ userId: l.user_id, momentId: l.moment_id, created_at: l.created_at }));

// 举报
const reports = sqliteReports.map(r => ({
  momentId: r.moment_id, userId: r.reporter_id, reason: r.reason || '其他',
  note: r.note || '', created_at: r.created_at
}));

const nextId = Math.max(...sqliteMoments.map(m => m.id), ...sqliteUsers.map(u => u.id), 0) + 1;
const db = { users, moments, likes, reports, nextId };

fs.writeFileSync(path.join(OUTPUT_DIR, 'db.json'), JSON.stringify(db, null, 2));
console.log(`Done:
  Users: ${users.length}
  Moments: ${moments.length}
  Likes: ${likes.length}
  Reports: ${reports.length}
  Images extracted: ${migratedCount}
  Output: ${OUTPUT_DIR}
`);
