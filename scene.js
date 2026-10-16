/**
 * The decorative Three.js layer. The story and interactive controls are HTML
 * for keyboard, touch, and a graceful fallback if WebGL/CDN is unavailable.
 * The scene is entirely procedural: no proprietary photos, audio or textures.
 */
export function createScene(THREE, mount) {
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;
  renderer.domElement.style.pointerEvents='none';
  mount.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,1,.1,150);
  camera.position.set(0,0,11.5);
  const ambient=new THREE.AmbientLight(0xfff3ea,2.1);scene.add(ambient);
  const keyLight=new THREE.DirectionalLight(0xffefdc,2.7);keyLight.position.set(-3,6,7);scene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0xd6e6f6,.7);fillLight.position.set(4,2,-3);scene.add(fillLight);

  function rng(seed){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
  const rand=rng(910723);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const color=s=>new THREE.Color(s);
  const cloudTex=radialTexture([[0,'rgba(255,255,255,1)'],[.19,'rgba(255,251,237,.87)'],[.5,'rgba(255,241,225,.23)'],[1,'rgba(255,255,255,0)']]);
  const lightTex=radialTexture([[0,'rgba(255,255,255,1)'],[.16,'rgba(251,250,237,.94)'],[.35,'rgba(235,238,207,.48)'],[1,'rgba(255,255,255,0)']]);
  function radialTexture(stops){
    const c=document.createElement('canvas');c.width=c.height=128;
    const ctx=c.getContext('2d'), gradient=ctx.createRadialGradient(64,64,0,64,64,64);
    stops.forEach(([p,value])=>gradient.addColorStop(p,value));
    ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function sprite(hex,x,y,z,scale,texture=cloudTex,opacity=1){
    const obj=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:hex,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
    obj.position.set(x,y,z);obj.scale.set(scale,scale,1);return obj;
  }
  function branch(group,a,b,ra,rb){
    const va=new THREE.Vector3(...a), vb=new THREE.Vector3(...b);
    const vec=new THREE.Vector3().subVectors(vb,va);
    const geom=new THREE.CylinderGeometry(rb,ra,vec.length(),7);
    const material=new THREE.MeshStandardMaterial({color:0x82706a,roughness:1,flatShading:true});
    const mesh=new THREE.Mesh(geom,material);
    mesh.position.copy(va).add(vb).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());
    group.add(mesh);
  }
  const tree=new THREE.Group();scene.add(tree);
  // Carefully placed major boughs create the silhouette of an old sakura tree.
  const boughs=[
    [[0,-3.7,0],[0,-2.35,0],.16,.15],
    [[0,-2.35,0],[-.2,-1.0,0],.15,.13],
    [[-.2,-1,0],[-.28,.5,0],.13,.1],
    [[-.28,.5,0],[-.65,2.15,0],.1,.04],
    [[-.03,-2.0,0],[-1.3,-.9,0],.12,.065],
    [[-1.3,-.9,0],[-2.1,.08,0],.065,.025],
    [[-.1,-1.55,0],[1.35,-.47,-.12],.12,.075],
    [[1.35,-.47,-.12],[2.25,.35,-.13],.075,.025],
    [[-.23,-.5,0],[-1.65,.85,0],.105,.05],
    [[-1.65,.85,0],[-2.25,1.5,0],.05,.015],
    [[-.25,.12,0],[1.23,1.42,0],.085,.045],
    [[1.23,1.42,0],[1.65,2.42,0],.045,.012],
    [[-.57,1.4,0],[-1.3,2.25,-.3],.07,.01],
    [[.72,1.05,0],[.5,2.75,-.2],.055,.01],
    [[-1.8,.47,0],[-2.35,.8,-.3],.04,.01],
    [[1.59,-.25,0],[2.42,-.07,-.3],.035,.006],
    [[-.35,.65,0],[-.14,2.92,-.4],.05,.006],
  ];
  boughs.forEach(([a,b,ra,rb])=>branch(tree,a,b,ra,rb));
  const twigMaterial=new THREE.MeshStandardMaterial({color:0x897872,roughness:1,flatShading:true});
  // Small twigs branch naturally toward the blossom canopy.
  for(let i=0;i<76;i++) {
    const theta=rand()*Math.PI*2,rad=Math.sqrt(rand())*2.2;
    const y=.2+rand()*2.55;
    const start=new THREE.Vector3(Math.cos(theta)*rad*.58,y-.3,Math.sin(theta)*.34);
    const end=new THREE.Vector3(Math.cos(theta)*rad,y+rand()*.55,Math.sin(theta)*.78);
    const d=new THREE.Vector3().subVectors(end,start);
    const geom=new THREE.CylinderGeometry(.006,.017,d.length(),4);
    const mesh=new THREE.Mesh(geom,twigMaterial);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    tree.add(mesh);
  }

  const centers=[[-1.95,.95,.73],[-1.18,1.85,.95],[-.15,2.24,1.04],[.93,1.87,1.02],[1.78,1.12,.73],[-.7,.95,1.15],[.74,.82,1.08],[-2.3,.45,.45],[2.12,.55,.53]];
  const count=window.innerWidth<700?510:830;
  const petalShape=new THREE.Shape();
  petalShape.moveTo(0,-.055);
  petalShape.bezierCurveTo(-.064,-.027,-.079,.053,-.031,.092);
  petalShape.quadraticCurveTo(0,.075,.006,.085);
  petalShape.bezierCurveTo(.075,.063,.07,-.02,0,-.055);
  const petalGeometry=new THREE.ShapeGeometry(petalShape,5);
  const blossomMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,color:0xffffff,transparent:true,opacity:.93,depthWrite:false});
  const blossoms=new THREE.InstancedMesh(petalGeometry,blossomMaterial,count);
  blossoms.frustumCulled=false;blossoms.renderOrder=4;
  tree.add(blossoms);
  const dummy=new THREE.Object3D();
  const positions=[],scales=[];
  for(let i=0;i<count;i++) {
    const c=centers[Math.floor(rand()*centers.length)];
    const theta=rand()*Math.PI*2,r=Math.sqrt(rand())*c[2];
    positions.push([c[0]+Math.cos(theta)*r,c[1]+Math.sin(theta)*r*.7,(rand()-.5)*1.05]);
    scales.push(.55+rand()*1.6);
  }
  const flowerColors={
    sakura:['#f5dce0','#e8adb9','#f1c5ce','#f9e7e5','#df9faa'],
    spring:['#f5dce0','#e8adb9','#f1c5ce','#f9e7e5','#df9faa'],
    summer:['#5e8a69','#87a88a','#496f58','#acc49e','#749b7c'],
    autumn:['#d49265','#bb7856','#e4b37e','#bb6a4c','#d0a16d'],
    winter:['#e6ecf2','#f5f7f8','#cbd7df','#eff1f6','#d9e5e9'],
  };
  const variations=Array.from({length:count},()=>Math.floor(rand()*5));
  function recolorLeaves(theme){
    const colors=flowerColors[theme]||flowerColors.spring;
    for(let i=0;i<count;i++) {
      const [x,y,z]=positions[i],k=scales[i];
      dummy.position.set(x,y,z);
      dummy.rotation.set((rand()-.5)*.7,(rand()-.5)*.7,rand()*Math.PI*2);
      const b=theme==='winter'?.34:(theme==='summer'?1.55:1.25);
      dummy.scale.set(k*b,k*b,k*b);dummy.updateMatrix();
      blossoms.setMatrixAt(i,dummy.matrix);
      blossoms.setColorAt(i,color(colors[variations[i]]));
    }
    blossoms.instanceMatrix.needsUpdate=true;
    if(blossoms.instanceColor)blossoms.instanceColor.needsUpdate=true;
  }
  recolorLeaves('sakura');

  // Tiny ground shadow anchors the tree without turning the whole backdrop 3-D.
  const ground=new THREE.Mesh(new THREE.CircleGeometry(2.65,64),new THREE.MeshBasicMaterial({color:0xa1a08e,transparent:true,opacity:.15,depthWrite:false}));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,-3.7,.3);ground.scale.set(1,.28,1);tree.add(ground);

  const house=new THREE.Group();scene.add(house);
  const wood=new THREE.MeshStandardMaterial({color:0x999391,roughness:1,flatShading:true});
  const roofMat=new THREE.MeshStandardMaterial({color:0x76869a,roughness:1,flatShading:true});
  const litMat=new THREE.MeshBasicMaterial({color:0xf7d69d});
  const hut=new THREE.Mesh(new THREE.BoxGeometry(2.25,1.6,1.8),wood);hut.position.y=-.05;house.add(hut);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.85,1.3,4),roofMat);roof.position.y=1.1;roof.rotation.y=Math.PI/4;house.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(.44,.85,.06),new THREE.MeshBasicMaterial({color:0x737879}));door.position.set(0,-.42,.932);house.add(door);
  for(const x of [-.73,.73]) {
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(.34,.42),litMat);pane.position.set(x,.06,.94);house.add(pane);
    const halo=sprite('#f9dba2',x,.04,1.15,1.1,cloudTex,.5);house.add(halo);
  }
  house.position.set(3.7,-2.68,0);house.visible=false;

  // A lightweight snowflake / falling petal particle system.
  const floatCount=window.innerWidth<700?95:190;
  const fallingGeom=new THREE.BufferGeometry();
  const fallPos=new Float32Array(floatCount*3);
  const fallVel=new Float32Array(floatCount);
  for(let i=0;i<floatCount;i++) {fallPos[i*3]=(rand()-.5)*13;fallPos[i*3+1]=(rand()-.5)*12;fallPos[i*3+2]=rand()*3-1;fallVel[i]=.2+rand()*.55;}
  fallingGeom.setAttribute('position',new THREE.BufferAttribute(fallPos,3));
  const fallingMat=new THREE.PointsMaterial({map:cloudTex,color:0xe9bac7,transparent:true,opacity:.68,depthWrite:false,size:.14,alphaTest:.01});
  const falling=new THREE.Points(fallingGeom,fallingMat);scene.add(falling);

  // Summer fireflies drift slowly rather than flickering like LEDs.
  const fireflyN=62;const flyGeom=new THREE.BufferGeometry();const flyPos=new Float32Array(fireflyN*3);
  for(let i=0;i<fireflyN;i++) {flyPos[i*3]=2+(rand()-.5)*6;flyPos[i*3+1]=(rand()-.5)*5-1;flyPos[i*3+2]=(rand()-.5)*2;}
  flyGeom.setAttribute('position',new THREE.BufferAttribute(flyPos,3));
  const flyMat=new THREE.PointsMaterial({map:lightTex,color:0xf6e8a4,size:.25,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});
  const flies=new THREE.Points(flyGeom,flyMat);scene.add(flies);flies.visible=false;

  // Starfield: several layers of differently sized points, distant dust,
  // velvety nebula sprites, and two separate glowing star cores.
  const universe=new THREE.Group();scene.add(universe);
  function starLayer(N,minR,maxR,size,col,opacity){
    const pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const x=(rand()-.5)*maxR*2,y=(rand()-.5)*maxR*1.25;
      pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=-3-rand()*minR;
    }
    const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({map:lightTex,color:col,size,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});
    const points=new THREE.Points(geom,mat);universe.add(points);return points;
  }
  const farStars=starLayer(window.innerWidth<700?770:1320,8,15,.075,'#d0d9f1',.72);
  const nearStars=starLayer(window.innerWidth<700?160:300,4,11,.115,'#fff0da',.9);
  const dustStars=starLayer(450,8,9,.11,'#dbbed5',.24);
  const nebula=new THREE.Group();universe.add(nebula);
  for(const [x,y,z,size,tint,opacity] of [[2.7,.8,-8,9,'#8b7aa4',.12],[4,-1.2,-7,6,'#bc9cad',.11],[.4,1.9,-9,8,'#637a9e',.11],[5,2.6,-7,6,'#9d8db3',.07]])nebula.add(sprite(tint,x,y,z,size,cloudTex,opacity));
  const starObjects=[];
  for(let i=0;i<2;i++){
    const group=new THREE.Group();
    group.add(sprite(i===0?'#f4e2cf':'#e4d8ed',0,0,0,2.15,lightTex,.85));
    group.add(sprite(i===0?'#f9eee0':'#d8d7f3',0,0,.1,.83,cloudTex,1));
    const core=new THREE.Mesh(new THREE.SphereGeometry(.093,16,16),new THREE.MeshBasicMaterial({color:i===0?0xfff1d9:0xe3e9f9}));
    group.add(core);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.4,.407,80),new THREE.MeshBasicMaterial({color:i===0?0xebd6c9:0xc5cede,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false}));
    group.add(ring);
    universe.add(group);starObjects.push(group);
  }
  universe.visible=false;

  let current='intro',targetTree=0,treeVis=0,targetUniverse=0,cosmosVis=0,aligned=false,alignedMix=0,targetHouse=0,houseVis=0;
  let width=window.innerWidth,height=window.innerHeight,isMobile=width<=720;
  let elapsed=0,previous=performance.now();
  let targetPosA=new THREE.Vector3(),targetPosB=new THREE.Vector3();
  const startA=new THREE.Vector3(),startB=new THREE.Vector3(),endA=new THREE.Vector3(),endB=new THREE.Vector3();
  function positionsForScreen(){
    const halfH=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.position.z;
    const halfW=halfH*camera.aspect;
    const map=(u,v)=>new THREE.Vector3((u-.5)*2*halfW,(.5-v)*2*halfH,0);
    startA.copy(map(isMobile?.30:.66,isMobile?.61:.42));
    startB.copy(map(isMobile?.73:.85,isMobile?.66:.57));
    endA.copy(map(isMobile?.46:.70,isMobile?.63:.50));
    endB.copy(map(isMobile?.62:.77,isMobile?.63:.50));
  }
  function resize(){
    width=mount.clientWidth||window.innerWidth;height=mount.clientHeight||window.innerHeight;
    isMobile=width<=720;
    camera.aspect=width/height;camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    if(isMobile){ tree.position.set(.3,-2.0,0);tree.scale.setScalar(.65);house.position.set(.22,-3.08,0);house.scale.setScalar(.72); }
    else {tree.position.set(3.6,-.43,0);tree.scale.setScalar(.95);house.position.set(3.8,-2.68,0);house.scale.setScalar(.95);}
    positionsForScreen();
    if(!aligned){starObjects[0].position.copy(startA);starObjects[1].position.copy(startB);}
  }
  window.addEventListener('resize',resize,{passive:true});resize();

  const themeHue={sakura:0xe9b8c4,spring:0xe9b8c4,summer:0xe8eab3,autumn:0xc8845c,winter:0xfcffff};
  function setPhase(p){
    current=p;
    const woodland=['sakura','spring','summer','autumn','winter'].includes(p);
    targetTree=woodland?1:0;
    targetUniverse=['cosmos','aligned','letter','end'].includes(p)?1:0;
    targetHouse=p==='winter'?1:0;
    aligned=['aligned','letter','end'].includes(p);
    if(woodland){
      recolorLeaves(p==='sakura'?'sakura':p);
      fallingMat.color.setHex(themeHue[p]);
      fallingMat.opacity=p==='winter'?.9:p==='summer'?.17:.62;
      fallingMat.size=p==='winter'?.09:p==='autumn'?.18:.145;
      blossoms.material.opacity=p==='winter'?.22:1;
      ground.material.color.set(p==='summer'?0x55735b:p==='autumn'?0xba9981:p==='winter'?0xe7eff2:0xb2b8a2);
      flyMat.opacity=p==='summer'?.86:0;
    }
    if(p==='intro') {treeVis=0;cosmosVis=0;}
    if(p==='cosmos')alignedMix=0;
  }
  function tick(now){
    const dt=Math.min((now-previous)/1000,.05);previous=now;elapsed+=dt;
    const ease=clamp(dt*1.5,0,1);
    treeVis=lerp(treeVis,targetTree,ease);
    cosmosVis=lerp(cosmosVis,targetUniverse,ease);
    houseVis=lerp(houseVis,targetHouse,ease);
    alignedMix=lerp(alignedMix,aligned?1:0,dt*.85);
    tree.visible=treeVis>.004;
    if(tree.visible) {tree.scale.setScalar((isMobile?.65:.95)*treeVis);tree.rotation.y=Math.sin(elapsed*.12)*.025;}
    house.visible=houseVis>.04;
    if(house.visible)house.scale.setScalar((isMobile?.72:.95)*houseVis);
    falling.visible=targetTree>0||treeVis>.3;
    if(falling.visible){
      const arr=falling.geometry.attributes.position.array;
      const speed=current==='winter'?.8:current==='autumn'?.55:.32;
      for(let i=0;i<floatCount;i++){
        arr[i*3+1]-=dt*(fallVel[i]+speed)*.65;
        arr[i*3]+=dt*Math.sin(elapsed*.75+i)*.043;
        if(arr[i*3+1]<-5.5){arr[i*3+1]=5.5;arr[i*3]=(rand()-.5)*12;}
      }
      falling.geometry.attributes.position.needsUpdate=true;
    }
    flies.visible=current==='summer'&&treeVis>.3;
    if(flies.visible){const a=flies.geometry.attributes.position.array;for(let i=0;i<fireflyN;i++){a[i*3]+=.002*Math.sin(elapsed*.7+i);a[i*3+1]+=.002*Math.cos(elapsed*.61+i*2);}flies.geometry.attributes.position.needsUpdate=true;}
    universe.visible=cosmosVis>.01;
    if(universe.visible){
      universe.scale.setScalar(.94+cosmosVis*.06);
      universe.rotation.y=Math.sin(elapsed*.03)*.011;
      [farStars,nearStars,dustStars].forEach((s,i)=>{s.rotation.z=elapsed*(i%2?-.002:.0018);s.material.opacity=(i===0?.72:i===1?.85:.25)*cosmosVis;});
      nebula.children.forEach(item=>{item.material.opacity=cosmosVis*.14;});
      const a=startA.clone().lerp(endA,alignedMix),b=startB.clone().lerp(endB,alignedMix);
      [a,b].forEach((v,i)=>{
        const o=starObjects[i];
        o.position.copy(v);o.position.y+=Math.sin(elapsed*.8+i)*.07;
        const frequency=alignedMix>.85?1.15:i===0?1.28:.93;
        const pulse=1+.075*Math.sin(elapsed*frequency*2.1+i*(1-alignedMix)*1.7);
        o.scale.setScalar(pulse*(.7+.3*cosmosVis));
        o.visible=cosmosVis>.5;
      });
    }
    renderer.render(scene,camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return {setPhase};
}
