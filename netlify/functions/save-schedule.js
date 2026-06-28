const crypto = require('crypto');

const OWNER = process.env.GITHUB_OWNER || 'keyman1335-maker';
const REPO = process.env.GITHUB_REPO || 'cnine-schedule';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = process.env.SCHEDULE_FILE_PATH || 'data/schedule.json';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

function sha256(text){ return crypto.createHash('sha256').update(String(text || '')).digest('hex'); }
function headers(){
  return {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS'
  };
}
function json(statusCode, obj){ return {statusCode, headers:headers(), body:JSON.stringify(obj)}; }
function b64encode(str){ return Buffer.from(str, 'utf8').toString('base64'); }
function b64decode(str){ return Buffer.from(String(str || ''), 'base64').toString('utf8'); }

const DEFAULT_FILE = {
  adminPasswordHash: '',
  data: {
    weekly: { chulgu: ['방송','방송','방송','방송','방송','방송','방송'] },
    today: { schedule: '등록된 일정 없음', notice: '등록된 공지사항 없음' },
    monthly: {}
  }
};

async function githubFetch(url, options={}){
  if(!TOKEN) throw new Error('GITHUB_TOKEN 환경변수가 없습니다. Netlify Environment variables에 토큰을 등록하세요.');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'cnine-schedule-center',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw:text }; }
  if(!res.ok){
    const msg = body.message || body.error || `GitHub API 오류 ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

async function readFromGithub(){
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(FILE_PATH).replace(/%2F/g,'/')}?ref=${encodeURIComponent(BRANCH)}&t=${Date.now()}`;
  try{
    const body = await githubFetch(url);
    const parsed = JSON.parse(b64decode(body.content));
    return { file: parsed, sha: body.sha };
  }catch(e){
    if(String(e.message || '').includes('Not Found')) return { file: DEFAULT_FILE, sha: null };
    throw e;
  }
}

async function writeToGithub(nextFile, sha){
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(FILE_PATH).replace(/%2F/g,'/')}`;
  const payload = {
    message: `Update CNINE schedule ${new Date().toISOString()}`,
    content: b64encode(JSON.stringify(nextFile, null, 2) + '\n'),
    branch: BRANCH
  };
  if(sha) payload.sha = sha;
  return githubFetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
}

exports.handler = async function(event){
  try{
    if(event.httpMethod === 'OPTIONS') return {statusCode:204, headers:headers(), body:''};

    if(event.httpMethod === 'GET'){
      const { file } = await readFromGithub();
      return json(200, file);
    }

    if(event.httpMethod !== 'POST') return json(405, {error:'Method Not Allowed'});

    const body = JSON.parse(event.body || '{}');
    const password = String(body.password || '');
    const newPassword = String(body.newPassword || '');
    if(!password) return json(401, {error:'비밀번호를 입력하세요'});

    const { file: current, sha } = await readFromGithub();
    if(current.adminPasswordHash && sha256(password) !== current.adminPasswordHash){
      return json(403, {error:'비밀번호가 틀렸습니다'});
    }

    const next = {
      adminPasswordHash: newPassword ? sha256(newPassword) : (current.adminPasswordHash || sha256(password)),
      data: body.data || current.data || DEFAULT_FILE.data
    };

    await writeToGithub(next, sha);
    return json(200, {ok:true, adminPasswordHash:next.adminPasswordHash, savedTo:'github'});
  }catch(e){
    return json(500, {error:e.message || '서버 오류'});
  }
};
