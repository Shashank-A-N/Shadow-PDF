export function isNumber(v){return typeof v==='number'&&Number.isFinite(v)}
export function isString(v){return typeof v==='string'}
export function isObject(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
export function isArray(v){return Array.isArray(v)}
export function isNonNegative(v){return isNumber(v)&&v>=0}
export function isPositive(v){return isNumber(v)&&v>0}
export function inRange(v,min,max){return isNumber(v)&&v>=min&&v<=max}
export function sanitizeNumber(v,{min=-Infinity,max=Infinity,def=0}={}){let n=Number(v);if(!Number.isFinite(n))n=def;return Math.min(max,Math.max(min,n))}
export function isHexColor(s){return /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(String(s).trim())}
export function isRgbString(s){return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(String(s).trim())}
export function isRgbaString(s){return /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/i.test(String(s).trim())}
export function isDataUrl(s){return /^data:([a-zA-Z]+\/[a-zA-Z0-9\-\.+]+)?;base64,/.test(String(s))}
export function isImageMime(t){return /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/i.test(String(t))}
export function isPdfMime(t){return /^application\/pdf$/i.test(String(t))}
export function validateFileType(file,types){if(!file||!file.type)return false;return types.includes(file.type)}
export function validateFileSize(file,max){if(!file||!isNumber(file.size))return false;return file.size<=max}
export function notEmptyString(s){return isString(s)&&s.trim().length>0}
export function parsePageRange(range,total){const out=new Set();const str=String(range||'').trim();if(!str)return [];const parts=str.split(',');for(const part of parts){const p=part.trim();if(!p)continue;const m=p.match(/^(\d+)\-(\d+)$/);if(m){let a=parseInt(m[1],10),b=parseInt(m[2],10);if(a>b)[a,b]=[b,a];for(let i=a;i<=b;i++){if(i>=1&&i<=total)out.add(i)}}else{const n=parseInt(p,10);if(Number.isFinite(n)&&n>=1&&n<=total)out.add(n)}}return Array.from(out).sort((a,b)=>a-b)}
export function validatePageRange(range,total){const arr=parsePageRange(range,total);return arr.length>0}
export function validateObjectKeys(obj,keys){if(!isObject(obj))return false;for(const k of keys){if(!(k in obj))return false}return true}
export function validateTransform(t){if(!t)return false;const sx=('scaleX'in t)?t.scaleX:1,sy=('scaleY'in t)?t.scaleY:1;return isNumber(t.x||0)&&isNumber(t.y||0)&&isNumber(t.rotation||0)&&isNumber(sx)&&isNumber(sy)}
export function validateColorInput(s){return isHexColor(s)||isRgbString(s)||isRgbaString(s)}
