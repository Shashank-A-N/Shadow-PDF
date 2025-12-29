export function deg2rad(d){return d*Math.PI/180}
export function rad2deg(r){return r*180/Math.PI}
export function identity(){return [1,0,0,1,0,0]}
export function translate(tx,ty){return [1,0,0,1,tx,ty]}
export function scale(sx,sy=sx){return [sx,0,0,sy,0,0]}
export function rotateRad(rad){const c=Math.cos(rad),s=Math.sin(rad);return [c,s,-s,c,0,0]}
export function rotateDeg(deg){return rotateRad(deg2rad(deg))}
export function multiply(m1,m2){const[a1,b1,c1,d1,e1,f1]=m1,[a2,b2,c2,d2,e2,f2]=m2;return [a1*a2+c1*b2,b1*a2+d1*b2,a1*c2+c1*d2,b1*c2+d1*d2,a1*e2+c1*f2+e1,b1*e2+d1*f2+f1]}
export function applyToPoint(m,p){const[a,b,c,d,e,f]=m;return {x:a*p.x+c*p.y+e,y:b*p.x+d*p.y+f}}
export function fromObject(t){const tx=t?.x||0,ty=t?.y||0,rot=deg2rad(t?.rotation||0),sx=t?.scaleX??1,sy=t?.scaleY??1;const M=multiply(translate(tx,ty),multiply(rotateRad(rot),scale(sx,sy)));return M}
export function compose(...matrices){return matrices.reduce((acc,m)=>multiply(acc,m),identity())}
export function invert(m){const[a,b,c,d,e,f]=m;const det=a*d-b*c;if(det===0)return null;const na=d/det, nb=-b/det, nc=-c/det, nd=a/det, ne=(c*f-d*e)/det, nf=(b*e-a*f)/det;return [na,nb,nc,nd,ne,nf]}
export function transformRect(rect,m){const p1=applyToPoint(m,{x:rect.x,y:rect.y});const p2=applyToPoint(m,{x:rect.x+rect.width,y:rect.y});const p3=applyToPoint(m,{x:rect.x+rect.width,y:rect.y+rect.height});const p4=applyToPoint(m,{x:rect.x,y:rect.y+rect.height});const xs=[p1.x,p2.x,p3.x,p4.x],ys=[p1.y,p2.y,p3.y,p4.y];const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);return {x:minX,y:minY,width:maxX-minX,height:maxY-minY}}
export function getRotationFromPoints(p1,p2){return rad2deg(Math.atan2(p2.y-p1.y,p2.x-p1.x))}
export function snapAngle(deg,step=15){const s=Math.max(1,step);return Math.round(deg/s)*s}
export function normalizeTransform(t){return {x:t?.x||0,y:t?.y||0,rotation:t?.rotation||0,scaleX:t?.scaleX??1,scaleY:t?.scaleY??1}}
export function mergeTransforms(a,b){const A=fromObject(a),B=fromObject(b);const M=multiply(A,B);return matrixToObject(M)}
export function matrixToObject(m){const[a,b,c,d,e,f]=m;const scaleX=Math.hypot(a,b);const scaleY=Math.hypot(c,d);let rotation=rad2deg(Math.atan2(b,a));return {x:e,y:f,rotation,scaleX,scaleY}}
export function transformPoint(point,t){return applyToPoint(fromObject(t),point)}
export function centerOfRect(rect){return {x:rect.x+rect.width/2,y:rect.y+rect.height/2}}
export function rotateAround(point,center,deg){const rad=deg2rad(deg);const s=Math.sin(rad),c=Math.cos(rad);const px=point.x-center.x,py=point.y-center.y;const x=px*c-py*s+center.x;const y=px*s+py*c+center.y;return {x,y}}
export function scaleAround(point,center,sx,sy=sx){return {x:center.x+(point.x-center.x)*sx,y:center.y+(point.y-center.y)*sy}}
export function constrainScale(value,min=0.1,max=10){return Math.min(max,Math.max(min,value))}
