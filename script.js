/* CLASSVERSE Neon 3D — dependency-free perspective 3D renderer.
   The entire campus and all four interiors work without Three.js or CDN modules.
   Designed for VS Code Live Server and GitHub Pages. */
(() => {
  'use strict';
  const rooms = {
    campus: {
      name: 'Неон кампус', type: '3D Campus', subtitle: 'Мектеп қалашығын аралап, ғимараттардың есіктерін басыңыз.',
      features: ['4 жеке интерактивті ғимарат', 'Камераны 360° айналдыру', 'Анимацияланған неон элементтері', 'Бөлмелердің толық 3D интерьері'],
      actions: ['Ғимаратты басу', 'Тінтуірмен айналдыру', 'Дөңгелекпен жақындату']
    },
    classroom: {
      name: 'Smart Classroom', type: 'Digital Classroom', subtitle: 'Неон тақта, оқушы парталары және цифрлық сынып.',
      features: ['3D интерактивті тақта', '6 оқушы партасы', 'Цифрлық оқу аймағы', 'Сынып ішін 360° қарау'],
      actions: ['Сыныпты зерттеу', 'Тақтаны қарау', 'Кампусқа қайту']
    },
    lab: {
      name: 'STEM / AI Lab', type: 'Science Zone', subtitle: 'STEM тәжірибелері мен AI зертханасына қош келдіңіз.',
      features: ['Жарқыраған колбалар', 'Тәжірибе үстелдері', '3D молекула моделі', 'Неон зертхана интерьері'],
      actions: ['3D молекула', 'Тәжірибе аймағы', 'Кампусқа қайту']
    },
    library: {
      name: 'Neon Library', type: 'Reading Zone', subtitle: 'Кітап сөрелері мен жарық оқу орындары.',
      features: ['Көлемді кітап сөрелері', 'Оқуға арналған үстелдер', 'Тыныш оқу аймағы', 'Неон интерьер'],
      actions: ['Кітапханаға шолу', 'Оқу аймағы', 'Кампусқа қайту']
    },
    hall: {
      name: 'Event Hall', type: 'Creative Stage', subtitle: 'Мектеп іс-шаралары мен презентация залы.',
      features: ['Көлемді сахна', 'LED презентация экраны', 'Көрермен орындықтары', 'Шоу жарықтары'],
      actions: ['Сахнаға қарау', 'Орындарды аралау', 'Кампусқа қайту']
    }
  };
  const Q = id => document.getElementById(id);
  const sceneHost = Q('sceneContainer');
  const canvas = document.createElement('canvas');
  canvas.id = 'campusCanvas';
  canvas.setAttribute('aria-label', 'Интерактивті 3D мектеп кампусы');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  sceneHost.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) { sceneHost.textContent = 'Бұл браузер Canvas функциясын қолдамайды.'; return; }

  const palette = {
    cyan: '#00e7f2', mint: '#5bffb5', blue: '#6b8cff', violet: '#b493ff', pink: '#ff78d7',
    white: '#f2feff', pale: '#d3f5ff', steel: '#93c4dc', ink: '#193a65', dark: '#234570', gold: '#ffdb78'
  };
  const buildings = [
    { key: 'classroom', x: -10, z: -6, w: 7.6, d: 6.3, h: 5.4, color: palette.cyan, tint: '#d3fcff' },
    { key: 'lab', x: 10, z: -6, w: 7.6, d: 6.3, h: 5.4, color: palette.mint, tint: '#d9fff2' },
    { key: 'library', x: -10, z: 7, w: 7.6, d: 6.3, h: 5.4, color: palette.violet, tint: '#e5e7ff' },
    { key: 'hall', x: 10, z: 7, w: 7.6, d: 6.3, h: 5.4, color: palette.pink, tint: '#ffe2f5' }
  ];
  const V = (x=0,y=0,z=0) => ({x,y,z});
  const sub = (a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z);
  const plus = (a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
  const mul=(a,s)=>V(a.x*s,a.y*s,a.z*s);
  const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
  const cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
  const normal=a=>mul(a,1/(Math.hypot(a.x,a.y,a.z)||1));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>1-Math.pow(1-t,3);
  const hexToRgb = hex => {
    const n=parseInt(hex.replace('#',''),16);
    return [n>>16,(n>>8)&255,n&255];
  };
  const shade=(color,factor)=>{
    const c=hexToRgb(color);
    return `rgb(${c.map(n=>Math.min(255,Math.round(n*factor))).join(',')})`;
  };
  function rgba(hex,a){const c=hexToRgb(hex);return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}

  let screenW=700, screenH=600, sceneMode='campus';
  let azimuth=-0.36, elevation=0.75, radius=44;
  let roomAz=0, roomElevation=0.15, roomRadius=11;
  let baseCam=V(0,0,0), targetCam=V(0,0,0);
  let viewPos=V(0,16,33), viewTarget=V(0,2,0), basis={};
  let cameraBlend=null, curtain=0, tick=0;
  let polys=[], markers=[], picked=[];
  let pointer={x:-100,y:-100}, grabbed=false, lastPointer=V(), moved=false;
  let currentRoom='campus';

  function resize(){
    const r=sceneHost.getBoundingClientRect();
    screenW=Math.max(220,r.width); screenH=Math.max(260,r.height);
    const dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(screenW*dpr); canvas.height=Math.round(screenH*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  new ResizeObserver(resize).observe(sceneHost);

  function cameraFor(){
    const camTarget=sceneMode==='campus'?V(0,2,0):V(0,2.7,-2);
    const a=sceneMode==='campus'?azimuth:roomAz;
    const el=sceneMode==='campus'?elevation:roomElevation;
    const r=sceneMode==='campus'?radius:roomRadius;
    const p=V(camTarget.x+Math.sin(a)*r*Math.cos(el),camTarget.y+Math.sin(el)*r,camTarget.z+Math.cos(a)*r*Math.cos(el));
    return {pos:p,target:camTarget};
  }
  function updateCamera(now){
    const next=cameraFor();
    if(cameraBlend){
      const a=Math.min(1,(now-cameraBlend.start)/cameraBlend.duration),u=ease(a);
      viewPos=V(lerp(cameraBlend.fromPos.x,next.pos.x,u),lerp(cameraBlend.fromPos.y,next.pos.y,u),lerp(cameraBlend.fromPos.z,next.pos.z,u));
      viewTarget=V(lerp(cameraBlend.fromTarget.x,next.target.x,u),lerp(cameraBlend.fromTarget.y,next.target.y,u),lerp(cameraBlend.fromTarget.z,next.target.z,u));
      if(a>=1)cameraBlend=null;
    } else {viewPos=next.pos;viewTarget=next.target;}
    const forward=normal(sub(viewTarget,viewPos));
    const right=normal(cross(forward,V(0,1,0)));
    const up=normal(cross(right,forward));
    basis={forward,right,up};
  }
  function project(p){
    const v=sub(p,viewPos);
    const z=dot(v,basis.forward);
    if(z<0.35)return null;
    const scale=Math.min(screenW,screenH)*1.17/z;
    return {x:screenW/2+dot(v,basis.right)*scale,y:screenH*0.52-dot(v,basis.up)*scale,z,scale};
  }
  function polygon(verts, color, opt={}){
    const projected=verts.map(project);
    if(projected.some(v=>!v))return;
    const depth=projected.reduce((s,p)=>s+p.z,0)/projected.length;
    polys.push({points:projected,depth,color,stroke:opt.stroke,glow:opt.glow||0,line:opt.line||1,alpha:opt.alpha??1,key:opt.key||null});
  }
  function rectXZ(x,z,w,d,y,color,opt){polygon([V(x-w/2,y,z-d/2),V(x+w/2,y,z-d/2),V(x+w/2,y,z+d/2),V(x-w/2,y,z+d/2)],color,opt);}
  function rectXY(x,y,w,h,z,color,opt){polygon([V(x-w/2,y-h/2,z),V(x+w/2,y-h/2,z),V(x+w/2,y+h/2,z),V(x-w/2,y+h/2,z)],color,opt);}
  function rectYZ(x,y,z,h,d,color,opt){polygon([V(x,y-h/2,z-d/2),V(x,y-h/2,z+d/2),V(x,y+h/2,z+d/2),V(x,y+h/2,z-d/2)],color,opt);}
  function box(x,y,z,w,h,d,color,opt={}){
    const h2=h/2,w2=w/2,d2=d/2,edge=opt.stroke||null,key=opt.key;
    const sides=[
      [[-w2,-h2,d2],[w2,-h2,d2],[w2,h2,d2],[-w2,h2,d2]],
      [[w2,-h2,-d2],[-w2,-h2,-d2],[-w2,h2,-d2],[w2,h2,-d2]],
      [[-w2,-h2,-d2],[-w2,-h2,d2],[-w2,h2,d2],[-w2,h2,-d2]],
      [[w2,-h2,d2],[w2,-h2,-d2],[w2,h2,-d2],[w2,h2,d2]],
      [[-w2,h2,d2],[w2,h2,d2],[w2,h2,-d2],[-w2,h2,-d2]],
      [[-w2,-h2,-d2],[w2,-h2,-d2],[w2,-h2,d2],[-w2,-h2,d2]]
    ];
    const factors=[.92,.76,.82,.88,1.1,.67];
    sides.forEach((f,i)=>polygon(f.map(v=>V(x+v[0],y+v[1],z+v[2])),shade(color,factors[i]),{stroke:edge,line:opt.line||.75,glow:opt.glow||0,alpha:opt.alpha??1,key}));
  }
  function beam(x,y,z,w,h,d,color,glow=0){box(x,y,z,w,h,d,color,{stroke:color,glow});}
  function disc(cx,cy,cz,r,color,n=36,opt={}){
    const p=[];
    for(let i=0;i<n;i++){const a=i*2*Math.PI/n;p.push(V(cx+Math.cos(a)*r,cy,cz+Math.sin(a)*r));}
    polygon(p,color,opt);
  }
  function line3(a,b,color,thick=1,glow=0){
    const A=project(a),B=project(b);if(!A||!B)return;
    markers.push({type:'line',A,B,color,thick,glow,depth:(A.z+B.z)/2});
  }
  function text3(str,p,color=palette.ink,size=14){
    const pos=project(p);if(!pos)return;
    markers.push({type:'text',pos,str,color,size:Math.max(10,Math.min(21,size*(22/Math.max(12,pos.z)))),depth:pos.z});
  }

  const stars=Array.from({length:46},(_,i)=>({x:Math.random(),y:Math.random(),size:1+Math.random()*2,offset:Math.random()*Math.PI*2}));
  function background(){
    const bg=ctx.createLinearGradient(0,0,screenW,screenH);
    bg.addColorStop(0,'#edffff');bg.addColorStop(.5,'#d6f8ff');bg.addColorStop(1,'#e8eaff');
    ctx.fillStyle=bg;ctx.fillRect(0,0,screenW,screenH);
    const g=ctx.createRadialGradient(screenW*.65,screenH*.12,0,screenW*.65,screenH*.12,screenW*.8);
    g.addColorStop(0,'rgba(80,255,214,.4)');g.addColorStop(1,'rgba(80,255,214,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,screenW,screenH);
    stars.forEach(s=>{ctx.globalAlpha=.18+Math.sin(tick*.0014+s.offset)*.14;ctx.fillStyle='#16bde4';ctx.beginPath();ctx.arc(s.x*screenW,s.y*screenH,s.size,0,2*Math.PI);ctx.fill();});
    ctx.globalAlpha=1;
  }
  function gridGround(){
    for(let i=-42;i<=42;i+=3.5){
      line3(V(i,-.42,-42),V(i,-.42,42),'rgba(45,186,218,.21)',.7);
      line3(V(-42,-.42,i),V(42,-.42,i),'rgba(45,186,218,.21)',.7);
    }
  }
  function campusScene(){
    gridGround();
    disc(0,-.24,0,20.4,'#edfaff',48,{stroke:'#77eff4',line:2,glow:10});
    disc(0,-.23,0,18.9,'#e4fbff',48,{stroke:'#b2fff2',line:1});
    rectXZ(0,0,5,36,-.16,'#cfecfa',{stroke:'#79dcff'});
    rectXZ(0,0,36,4,-.15,'#d7ebff',{stroke:'#a6dcff'});
    for(let i=-17;i<=17;i+=3){line3(V(i,-.08,-1.95),V(i,-.08,1.95),'#9cf8ff',1.1,2);}
    for(let i=-17;i<=17;i+=3){line3(V(-2.45,-.07,i),V(2.45,-.07,i),'#9cf8ff',1.1,2);}
    buildings.forEach((b,idx)=>{
      disc(b.x,-.15,b.z,5.75,rgba(b.color,.15),32,{stroke:b.color,line:2,glow:13});
      box(b.x,2.75,b.z,b.w,b.h,b.d,b.tint,{stroke:'#a2dce9',key:b.key});
      // Wrap upper building edges in neon rims.
      beam(b.x,5.57,b.z,b.w+.55,.19,b.d+.55,b.color,7);
      beam(b.x,5.85,b.z,b.w+.1,.38,b.d+.1,'#f1ffff',1);
      // Sliding glass door on the forward facade.
      box(b.x,.96,b.z+b.d/2+.085,1.55,2.05,.13,'#679dc5',{stroke:b.color,glow:6,key:b.key});
      line3(V(b.x,.1,b.z+b.d/2+.21),V(b.x,1.95,b.z+b.d/2+.21),b.color,2,5);
      // Windows: front and side facades.
      for(let floor=0;floor<2;floor++)for(let c=-2;c<=2;c++){
        const wx=b.x+c*1.32,wy=2.45+floor*1.74;
        if(!(floor===0&&c===0))box(wx,wy,b.z+b.d/2+.075,.86,1.05,.08,'#45b3d2',{stroke:b.color,glow:idx%2===0?2:4});
        box(b.x+b.w/2+.08,wy,b.z+c*.5,.07,1,.55,'#69c9e2',{stroke:b.color,glow:2});
      }
      for(let k=-1;k<=1;k++)beam(b.x+k*2.2,4.9,b.z+b.d/2+.14,.10,1.1,.13,b.color,5);
      // Awning / entrance porch.
      beam(b.x,2.23,b.z+b.d/2+.85,2.5,.18,1.7,b.color,4);
      text3(b.key==='classroom'?'SMART CLASS':b.key==='lab'?'STEM / AI LAB':b.key==='library'?'NEON LIBRARY':'EVENT HALL',V(b.x,6.75,b.z),b.color,23);
      text3('КІРУ ↗',V(b.x,.28,b.z+b.d/2+1.0),'#11617c',13);
    });
    // Central portal sculpture, vertical plasma pillar + animated rings.
    beam(0,1.3,0,.6,2.7,.6,'#ecfdff',3);
    beam(0,3.1,0,1.15,.35,1.15,palette.cyan,10);
    for(let i=0;i<3;i++){
      const r=2.0+i*.47,yy=.26+i*.22+Math.sin(tick*.0018+i)*.13;
      for(let j=0;j<40;j++){
        const a=j*Math.PI*2/40+tick*(i%2?-.00022:.00017),next=a+Math.PI*2/40;
        line3(V(Math.cos(a)*r,yy,Math.sin(a)*r),V(Math.cos(next)*r,yy,Math.sin(next)*r),i%2?palette.mint:palette.cyan,1.7,6);
      }
    }
    // Trees and neon floor ornaments.
    [[-17,-14],[17,-14],[-17,14],[17,14],[-16,0],[16,0],[0,-16],[0,16]].forEach(([x,z],i)=>{
      box(x,.84,z,.36,1.65,.36,'#80bed3');
      const r=.86+Math.sin(i)*.1;
      box(x,1.83,z,r*1.6,1.2,r*1.6, i%2?'#b0ffe4':'#acfff4',{stroke:palette.mint,glow:5});
      box(x,2.5,z,r*1.2,.74,r*1.2,'#ccfff8',{stroke:palette.cyan,glow:4});
    });
    text3('CLASSVERSE 3D',V(0,4.2,0),palette.ink,24);
  }

  function roomShell(accent){
    rectXZ(0,0,14,16,-.02,'#dff5fd',{stroke:accent,glow:3});
    // floor tiles
    for(let x=-6;x<=6;x+=2)line3(V(x,.01,-8),V(x,.01,8),rgba(accent,.42),1);
    for(let z=-8;z<=8;z+=2)line3(V(-7,.01,z),V(7,.01,z),rgba(accent,.42),1);
    rectXY(0,4.0,14,8,-8.05,'#c9f2fb',{stroke:accent,glow:2});
    rectYZ(-7.05,4,0,8,16,'#b9eff7',{stroke:accent});
    rectYZ(7.05,4,0,8,16,'#c9f7fa',{stroke:accent});
    // Tall wall slats and light strips
    for(let x=-6;x<=6;x+=2){beam(x,7.45,-7.9,.19,.15,.18,accent,8);}
    for(let z=-6;z<=7;z+=2.6){beam(-6.95,5.7,z,.11,2.8,.16,accent,5);beam(6.95,5.7,z,.11,2.8,.16,accent,5);}
    beam(0,7.93,-8,14,.14,.15,accent,4);
    text3('CLASSVERSE IMMERSIVE',V(0,7.1,-7.82),'#1d4c79',20);
  }
  function classroomScene(){
    roomShell(palette.cyan);
    box(0,4.55,-7.63,6.6,3.35,.15,'#285a7f',{stroke:palette.cyan,glow:13});
    box(0,4.55,-7.47,5.8,2.65,.08,'#21456f',{stroke:palette.cyan,glow:9});
    text3('SMART CLASS',V(0,5.35,-7.39),palette.mint,24);
    text3('LEARN • CREATE • EXPLORE',V(0,4.5,-7.39),'#cafcff',18);
    box(-5.1,1.05,-6.25,2.1,1.8,.95,'#a8ddeb',{stroke:palette.mint,glow:3});
    for(let row=0;row<3;row++)for(let col=0;col<2;col++){
      const x=-2.5+col*5,z=-3+row*3.1;
      box(x,1.04,z,3.2,.24,1.65,'#f9ffff',{stroke:palette.cyan,glow:4});
      for(let k of [-1,1])for(let t of [-.52,.52])box(x+k*1.3,.5,z+t,.14,.9,.14,'#85c3da');
      box(x,1.45,z-1.07,1.4,.8,.15,'#8ec7e5',{stroke:palette.blue,glow:2});
      box(x,1.02,z+.32,.6,.05,.32,'#8afafa',{stroke:palette.mint});
    }
    text3('ЦИФРЛЫҚ СЫНЫП',V(0,7.65,-7.65),palette.ink,15);
  }
  function labScene(){
    roomShell(palette.mint);
    box(0,4.2,-7.66,6.8,3.5,.2,'#20476c',{stroke:palette.mint,glow:10});
    text3('STEM • AI LAB',V(0,5.25,-7.45),palette.mint,25);
    text3('INNOVATION ZONE',V(0,4.3,-7.43),'#e2fff1',16);
    for(let row=0;row<3;row++)for(let col=0;col<2;col++){
      const x=-3.5+col*7,z=-3.8+row*3.7;
      box(x,.9,z,3.7,.24,1.65,'#edffff',{stroke:palette.mint,glow:4});
      for(let k of [-1,1])box(x+k*1.58,.43,z,.16,.85,.18,'#6bacc7');
      for(let i=0;i<3;i++){
        const c=i===0?palette.cyan:i===1?palette.pink:palette.mint;
        box(x-.75+i*.75,1.3,z,.35,.56,.35,c,{stroke:c,glow:11});
        box(x-.75+i*.75,1.64,z,.14,.18,.14,'#e9ffff',{stroke:c,glow:6});
      }
    }
    // Holographic atom in rear.
    const t=tick*.00035;
    for(let j=0;j<3;j++){
      let pts=[];
      for(let n=0;n<28;n++){
        let a=n/28*Math.PI*2;let r=1.55;
        let x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(j===1){x*=.42;z+=Math.sin(a)*.18;}
        if(j===2){x*=.45;z-=Math.sin(a)*.18;}
        const co=Math.cos(t+j),si=Math.sin(t+j);
        pts.push(V(co*x-si*z,5.15+(j===0?Math.sin(a)*.35:Math.cos(a)*r*.8),-4.35+si*x+co*z));
      }
      pts.forEach((p,i)=>line3(p,pts[(i+1)%pts.length],j===0?palette.cyan:palette.mint,1.5,4));
    }
    box(0,5.1,-4.3,.52,.52,.52,palette.pink,{stroke:palette.pink,glow:13});
  }
  function libraryScene(){
    roomShell(palette.violet);
    for(let side of [-1,1])for(let row=0;row<3;row++){
      const z=-6.1+row*3.5,x=side*6.05;
      box(x,2.5,z,1.15,4.7,2.65,'#8bb8d9',{stroke:palette.violet,glow:3});
      for(let i=0;i<4;i++){
        box(x,1.05+i*1.0,z,1.28,.11,2.75,palette.white,{stroke:palette.cyan});
        for(let j=0;j<5;j++){
          const c=[palette.pink,palette.violet,palette.mint,palette.cyan,palette.gold][j];
          box(x,1.48+i*1.0,z-1.05+j*.49,.78,.8,.29,c,{stroke:c,glow:2});
        }
      }
    }
    for(let i=0;i<3;i++){
      const z=-4.8+i*3.5;
      box(0,1.0,z,5.0,.22,2.0,'#f9ffff',{stroke:palette.violet,glow:4});
      for(let x of [-2.1,2.1])box(x,.54,z,.22,1.0,.23,'#8bb8d9');
      box(-2.0,1.3,z,.8,.5,.45,palette.mint,{stroke:palette.mint,glow:4});
      box(2.0,1.3,z,.8,.5,.45,palette.cyan,{stroke:palette.cyan,glow:4});
    }
    box(0,5.1,-7.63,6.6,2.2,.15,'#52699c',{stroke:palette.violet,glow:9});
    text3('NEON LIBRARY',V(0,5.15,-7.48),'#f1e9ff',24);
  }
  function hallScene(){
    roomShell(palette.pink);
    box(0,.55,-5.75,11.3,1,4.4,'#647bb2',{stroke:palette.pink,glow:6});
    box(0,4.3,-7.6,8.4,4.5,.16,'#2a426a',{stroke:palette.pink,glow:15});
    box(0,4.3,-7.41,7.7,3.8,.08,'#4167a0',{stroke:palette.cyan,glow:9});
    text3('EVENT HALL',V(0,5.2,-7.25),'#e5ffff',25);
    text3('YOUR STAGE • YOUR FUTURE',V(0,4.2,-7.25),palette.mint,17);
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const x=-5+col*2,z=-1.2+row*2.35;
      box(x,.8,z,1.23,1.15,.6,row%2?palette.violet:palette.pink,{stroke:'#e8d6ff',glow:2});
      box(x,.44,z+.41,1.23,.4,.55,'#d1e7ff',{stroke:palette.pink,glow:2});
    }
    for(let x of [-5,5]){
      beam(x,6.8,-6.75,.55,.28,.55,palette.cyan,12);
      for(let i=0;i<5;i++)line3(V(x,6.65,-6.75),V(x+(i-2)*.7,.12,3),rgba(palette.pink,.5),1,1);
    }
  }
  function interiorScene(){
    gridGround();
    if(sceneMode==='classroom')classroomScene();
    else if(sceneMode==='lab')labScene();
    else if(sceneMode==='library')libraryScene();
    else hallScene();
  }
  function renderPoly(p){
    ctx.save();ctx.globalAlpha=p.alpha;
    ctx.beginPath();ctx.moveTo(p.points[0].x,p.points[0].y);
    for(let i=1;i<p.points.length;i++)ctx.lineTo(p.points[i].x,p.points[i].y);
    ctx.closePath();ctx.fillStyle=p.color;
    ctx.fill();
    if(p.stroke){ctx.strokeStyle=p.stroke;ctx.lineWidth=p.line;ctx.shadowColor=p.stroke;ctx.shadowBlur=p.glow;ctx.stroke();}
    ctx.restore();
    if(p.key)picked.push(p);
  }
  function drawMarkers(){
    markers.sort((a,b)=>b.depth-a.depth);
    for(const m of markers){
      if(m.type==='line'){
        ctx.save();ctx.beginPath();ctx.moveTo(m.A.x,m.A.y);ctx.lineTo(m.B.x,m.B.y);ctx.strokeStyle=m.color;ctx.lineWidth=m.thick;
        ctx.shadowColor=m.color;ctx.shadowBlur=m.glow;ctx.stroke();ctx.restore();
      }else{
        ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${Math.round(m.size)}px Inter,system-ui,sans-serif`;
        ctx.shadowColor='white';ctx.shadowBlur=13;ctx.lineWidth=3;ctx.strokeStyle='rgba(255,255,255,.88)';ctx.strokeText(m.str,m.pos.x,m.pos.y);
        ctx.fillStyle=m.color;ctx.fillText(m.str,m.pos.x,m.pos.y);ctx.restore();
      }
    }
  }
  function hud(){
    ctx.save();
    ctx.fillStyle='rgba(255,255,255,.77)';ctx.strokeStyle='rgba(0,185,222,.33)';ctx.lineWidth=1;
    const w=Math.min(335,screenW-28),h=43,x=14,y=screenH-58;
    ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();ctx.stroke();
    ctx.fillStyle='#226383';ctx.font='700 12px Inter, sans-serif';
    ctx.fillText(sceneMode==='campus'?'🏫  4 ҒИМАРАТ   •   ЕСІКТІ БАСЫҢЫЗ':'🚪  БӨЛМЕ ІШІ   •   АЙНАЛДЫРУ: DRAG',x+14,y+26);
    ctx.restore();
  }
  function frame(now){
    tick=now;updateCamera(now);background();polys=[];markers=[];picked=[];
    if(sceneMode==='campus')campusScene();else interiorScene();
    polys.sort((a,b)=>b.depth-a.depth);
    polys.forEach(renderPoly);
    drawMarkers();hud();
    // At transitions, fade to white at midpoint so the interior replaces the campus cleanly.
    if(curtain>0){ctx.fillStyle=`rgba(242,253,255,${curtain})`;ctx.fillRect(0,0,screenW,screenH);curtain=Math.max(0,curtain-.055);}
    requestAnimationFrame(frame);
  }

  function updatePanel(key,mode='Explorer'){
    const r=rooms[key];
    Q('infoTitle').textContent=r.name;
    Q('infoSubtitle').textContent=r.subtitle;
    Q('activeRoom').textContent=key==='campus'?'CAMPUS':r.name;
    Q('viewMode').textContent=mode;
    Q('featureList').replaceChildren(...r.features.map(f=>{let li=document.createElement('li');li.textContent=f;return li;}));
    const qa=Q('quickActions');qa.replaceChildren();
    if(key==='campus'){
      roomsOrder.forEach(k=>addBtn(qa,`→ ${rooms[k].name}`,()=>enterRoom(k),'action-chip'));
    }else{
      addBtn(qa,'← Кампус',()=>enterRoom('campus'),'btn btn-primary');
      addBtn(qa,'Бөлмені айналдыру',()=>{roomAz+=.45;},'btn btn-outline');
    }
  }
  function addBtn(where,text,fn,cls){let b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.addEventListener('click',fn);where.appendChild(b);return b;}
  const roomsOrder=['classroom','lab','library','hall'];
  const icons={classroom:'📚',lab:'🧪',library:'📖',hall:'🎤'};
  for(let i=0;i<roomsOrder.length;i++){
    const k=roomsOrder[i],r=rooms[k];
    const card=document.createElement('article');card.className='room-item';
    const top=document.createElement('div');top.className='room-top';
    let tag=document.createElement('span');tag.className='room-tag';tag.textContent=`0${i+1}`;top.appendChild(tag);
    let kind=document.createElement('span');kind.className='room-tag';kind.textContent=r.type;top.appendChild(kind);
    const h=document.createElement('h3');h.textContent=`${icons[k]} ${r.name}`;
    const p=document.createElement('p');p.textContent=r.subtitle;
    const actions=document.createElement('div');actions.className='room-actions';
    addBtn(actions,'🚪 Кіру',()=>enterRoom(k),'btn btn-primary');
    addBtn(actions,'Ақпарат',()=>openInfo(k),'btn btn-outline');
    card.append(top,h,p,actions);Q('roomList').appendChild(card);
  }
  Q('quoteText').textContent=['«Білім – болашақтың ең жарық энергиясы.»','«Ізденген шәкірт болашақты өзгертеді.»','«Арманға жол білімнен басталады.»'][new Date().getDate()%3];
  function clock(){Q('liveClock').textContent=new Date().toLocaleTimeString('kk-KZ',{hour12:false});}
  clock();setInterval(clock,1000);
  function openInfo(k){
    const r=rooms[k];Q('floatingTitle').textContent=r.name;
    Q('floatingDescription').textContent=r.subtitle+' '+r.features.join(' • ');
    const wrap=Q('floatingActions');wrap.replaceChildren();
    addBtn(wrap,'🚪 Бөлмеге кіру',()=>enterRoom(k),'btn btn-primary');
    addBtn(wrap,'Жабу',()=>Q('floatingPanel').classList.add('hidden'),'btn btn-outline');
    Q('floatingPanel').classList.remove('hidden');
  }
  Q('closeFloating').addEventListener('click',()=>Q('floatingPanel').classList.add('hidden'));
  Q('resetViewBtn').addEventListener('click',()=>enterRoom('campus'));
  function enterRoom(k){
    if(!rooms[k])return;
    Q('floatingPanel').classList.add('hidden');
    const fromP=viewPos,fromT=viewTarget;
    sceneMode=k;currentRoom=k;
    if(k==='campus'){azimuth=-.36;elevation=.75;radius=44;}
    else{roomAz=0;roomElevation=.15;roomRadius=11;}
    cameraBlend={fromPos:fromP,fromTarget:fromT,start:performance.now(),duration:1150};
    curtain=.42;
    updatePanel(k,k==='campus'?'Explorer':'Ішінде');
  }
  function pointInPoly(point,poly){
    let inside=false;const ps=poly.points;
    for(let i=0,j=ps.length-1;i<ps.length;j=i++){
      const a=ps[i],b=ps[j];
      if(((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x))inside=!inside;
    }
    return inside;
  }
  function findBuilding(p){
    // Pick front-most house polygon from those that were actually painted.
    for(let i=picked.length-1;i>=0;i--){if(pointInPoly(p,picked[i]))return picked[i].key;}
    return null;
  }
  canvas.addEventListener('pointerdown',e=>{grabbed=true;moved=false;pointer.x=e.offsetX;pointer.y=e.offsetY;lastPointer=V(e.clientX,e.clientY,0);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    pointer.x=e.offsetX;pointer.y=e.offsetY;
    const key=sceneMode==='campus'?findBuilding(pointer):null;
    canvas.style.cursor=grabbed?'grabbing':key?'pointer':'grab';
    if(!grabbed)return;
    const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
    if(Math.abs(dx)>2||Math.abs(dy)>2)moved=true;
    if(sceneMode==='campus'){
      azimuth-=dx*.007;elevation=Math.max(.17,Math.min(1.25,elevation+dy*.004));
    }else{
      roomAz=Math.max(-.98,Math.min(.98,roomAz-dx*.006));
      roomElevation=Math.max(-.12,Math.min(.62,roomElevation+dy*.003));
    }
    lastPointer=V(e.clientX,e.clientY,0);
    cameraBlend=null;
  });
  function pointerUp(e){
    const click=!moved;grabbed=false;
    if(click&&sceneMode==='campus'){
      const key=findBuilding({x:e.offsetX,y:e.offsetY});
      if(key)openInfo(key);
    }
  }
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',()=>grabbed=false);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();cameraBlend=null;
    if(sceneMode==='campus')radius=Math.max(18,Math.min(58,radius+Math.sign(e.deltaY)*2));
    else roomRadius=Math.max(7,Math.min(15,roomRadius+Math.sign(e.deltaY)));
  },{passive:false});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&sceneMode!=='campus')enterRoom('campus');
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      (sceneMode==='campus'?(azimuth+=e.key==='ArrowLeft'?.12:-.12):(roomAz+=e.key==='ArrowLeft'?.12:-.12));
    }
  });
  updatePanel('campus');
  requestAnimationFrame(frame);
})();
