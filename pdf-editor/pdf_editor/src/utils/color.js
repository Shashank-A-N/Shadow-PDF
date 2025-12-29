function clamp01(v){return Math.min(1,Math.max(0,v))}
function clamp255(v){return Math.min(255,Math.max(0,Math.round(v)))}
export function hexToRgb(hex){const s=String(hex).trim();const m=s.match(/^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/);if(!m)return null;let h=m[1].toLowerCase();if(h.length===3){h=h.split('').map(c=>c+c).join('')}const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return {r,g,b}}
export function hexToRgbNormalized(hex){const c=hexToRgb(hex);if(!c)return null;return {r:c.r/255,g:c.g/255,b:c.b/255}}
export function rgbToHex(r,g,b){return '#'+[r,g,b].map(v=>clamp255(v).toString(16).padStart(2,'0')).join('')}
export function rgbNormalizedToHex(r,g,b){return rgbToHex(r*255,g*255,b*255)}
export function hexToRgba(hex,a=1){const c=hexToRgb(hex);if(!c)return null;return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp01(a)})`}
export function rgbaToHex(r,g,b,a=1){const rr=clamp255(r),gg=clamp255(g),bb=clamp255(b),aa=clamp255(clamp01(a)*255);return '#'+[rr,gg,bb,aa].map(v=>v.toString(16).padStart(2,'0')).join('')}
export function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break}h/=6}return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)}}
export function hslToRgb(h,s,l){h=((h%360)+360)%360;s=clamp01(s/100);l=clamp01(l/100);if(s===0){const v=clamp255(l*255);return {r:v,g:v,b:v}}const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;const hk=h/360;const tc=[hk+1/3,hk,hk-1/3];const c=tc.map(t=>{if(t<0)t+=1;if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3 - t)*6; return p});return {r:clamp255(c[0]*255),g:clamp255(c[1]*255),b:clamp255(c[2]*255)}}
export function lighten(hex,amount=0.1){const c=hexToRgb(hex);if(!c)return null;const hsl=rgbToHsl(c.r,c.g,c.b);hsl.l=Math.round(Math.min(100,Math.max(0,hsl.l+amount*100)));const rgb=hslToRgb(hsl.h,hsl.s,hsl.l);return rgbToHex(rgb.r,rgb.g,rgb.b)}
export function darken(hex,amount=0.1){return lighten(hex,-amount)}
export function setAlpha(hex,alpha=1){return hexToRgba(hex,alpha)}
export function blend(hex1,hex2,t=0.5){const c1=hexToRgb(hex1),c2=hexToRgb(hex2);if(!c1||!c2)return null;const r=c1.r+(c2.r-c1.r)*t,g=c1.g+(c2.g-c1.g)*t,b=c1.b+(c2.b-c1.b)*t;return rgbToHex(r,g,b)}
export function contrastColor(hex,threshold=186){const c=hexToRgb(hex);if(!c)return '#000000';const yiq=(c.r*299+c.g*587+c.b*114)/1000;return yiq>=threshold?'#000000':'#FFFFFF'}
export function isValidHex(hex){return /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(String(hex).trim())}
export function normalizeHex(hex){const s=String(hex).trim().toLowerCase();if(!isValidHex(s))return null;let h=s.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return '#'+h}
export function toCssRgb(hex){const c=hexToRgb(hex);if(!c)return null;return `rgb(${c.r}, ${c.g}, ${c.b})`}
export function toCssRgba(hex,alpha=1){return hexToRgba(hex,alpha)}
export function parseColor(input){const s=String(input).trim();if(isValidHex(s))return {...hexToRgb(normalizeHex(s)),a:1,hex:normalizeHex(s)};const mrgb=s.match(/^rgb\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)$/i);if(mrgb){const r=+mrgb[1],g=+mrgb[2],b=+mrgb[3];return {r,g,b,a:1,hex:rgbToHex(r,g,b)}}const mrgba=s.match(/^rgba\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)$/i);if(mrgba){const r=+mrgba[1],g=+mrgba[2],b=+mrgba[3],a=+mrgba[4];return {r,g,b,a,hex:rgbToHex(r,g,b)}}return null}