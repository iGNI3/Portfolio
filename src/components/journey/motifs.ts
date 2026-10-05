/* ──────────────────────────────────────────────────────────────
   Per-stage surface motifs for the case-study journey.

   Each layer of a project is one step of its flow, and each step
   gets its own small animation drawn on the layer's top face, so a
   layer "says" what that step does instead of all layers looking
   alike. These are abstract diagrams — a sweep, a graph forming,
   streams into a core — not depictions of any real system internals.

   MOTIF is injected into the slab fragment shader. `motif(id, uv, t)`
   returns a brightness in slab-local space (uv.x in [-hw,hw], uv.y in
   [-hd,hd]); the shader tints it with the accent and gates it by how
   lit the layer is.
   ────────────────────────────────────────────────────────────── */

export const MOTIF_IDS = {
  radar: 0, // a rotating sweep with range rings and pings
  graph: 1, // nodes wiring themselves together
  ingest: 2, // streams converging into a glowing core
  select: 3, // a highlight steps across cells and locks onto one
  gate: 4, // a pulse meets a barrier and a check clears it through
  report: 5, // bars fill and stack into a finished sheet
  split: 6, // one line branches into many
  wave: 7, // a scrolling multi-frequency signal
} as const;

export type MotifName = keyof typeof MOTIF_IDS;

export const motifId = (name?: string): number =>
  (name && name in MOTIF_IDS ? MOTIF_IDS[name as MotifName] : MOTIF_IDS.graph);

export const MOTIF = /* glsl */ `
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }
float lineMask(float d, float w){ return 1.0 - smoothstep(w*0.45, w, d); }

// draw only the first k (0..1) of segment a->b, with a bright moving head
float segReveal(vec2 p, vec2 a, vec2 b, float k, float w){
  if (k <= 0.0) return 0.0;
  vec2 e = mix(a, b, clamp(k, 0.0, 1.0));
  float l = lineMask(sdSeg(p, a, e), w);
  float head = (k < 1.0) ? (1.0 - smoothstep(0.0, w*2.6, length(p - e))) * 1.3 : 0.0;
  return max(l, head);
}
float dot2(vec2 p, vec2 c, float r){ return 1.0 - smoothstep(r*0.6, r, length(p - c)); }

// 0 — RADAR: a sweep hand rotates; rings mark range; fixed points flash as it passes
float mRadar(vec2 uv, vec2 hf, float t){
  float r = length(uv);
  float rr = r / hf.x;
  float ang = atan(uv.y, uv.x);
  float sweep = mod(t * 1.25, 6.2831853);
  float behind = mod(sweep - ang, 6.2831853);            // 0 just under the hand, grows as it recedes
  float arm = exp(-behind * 2.2) * smoothstep(1.15, 0.15, rr);
  float rings = lineMask(abs(rr - 0.42), 0.04) + lineMask(abs(rr - 0.82), 0.04);
  float cross = lineMask(abs(uv.y), 0.012) + lineMask(abs(uv.x), 0.012);
  float ping = 0.0;
  vec2 pts[5];
  pts[0]=vec2(0.55,0.28); pts[1]=vec2(-0.7,0.42); pts[2]=vec2(0.3,-0.5); pts[3]=vec2(-0.45,-0.3); pts[4]=vec2(0.85,-0.1);
  for (int i=0;i<5;i++){
    vec2 c = pts[i]*hf;
    float pa = mod(sweep - atan(c.y,c.x), 6.2831853);
    ping += dot2(uv, c, 0.07) * exp(-pa*3.0);
  }
  return arm*0.9 + rings*0.28 + cross*0.12 + ping*1.6;
}

// 1 — GRAPH: six nodes; edges draw in one by one on a loop; nodes pulse
float mGraph(vec2 uv, vec2 hf, float t){
  vec2 n[6];
  n[0]=vec2(-0.72,0.5); n[1]=vec2(-0.1,0.68); n[2]=vec2(0.66,0.4);
  n[3]=vec2(-0.5,-0.42); n[4]=vec2(0.2,-0.2); n[5]=vec2(0.78,-0.55);
  for(int i=0;i<6;i++) n[i]*=hf;
  ivec2 e[7];
  e[0]=ivec2(0,1); e[1]=ivec2(1,2); e[2]=ivec2(0,3); e[3]=ivec2(1,4);
  e[4]=ivec2(3,4); e[5]=ivec2(4,5); e[6]=ivec2(2,5);
  float prog = fract(t * 0.14) * 8.5;                    // wipes through the edges, then holds
  float m = 0.0;
  for(int i=0;i<7;i++){
    float k = clamp(prog - float(i), 0.0, 1.0);
    m = max(m, segReveal(uv, n[e[i].x], n[e[i].y], k, 0.02) * 0.85);
  }
  for(int i=0;i<6;i++){
    float appear = smoothstep(float(i)*0.9, float(i)*0.9+0.6, prog);
    m = max(m, dot2(uv, n[i], 0.075) * (0.7 + 0.3*sin(t*3.0+float(i))) * appear);
  }
  return m;
}

// 2 — INGEST: dashed streams run inward; a core brightens as it takes them in
float mIngest(vec2 uv, vec2 hf, float t){
  float r = length(uv) / hf.x;
  float ang = atan(uv.y, uv.x);
  float flow = fract(r*2.6 - t*1.1);                     // rings travelling inward
  float stream = smoothstep(0.55,0.95,flow) * smoothstep(1.2,0.2,r);
  float spokes = pow(abs(cos(ang*5.0 + 0.3)), 24.0) * smoothstep(1.15,0.25,r) * flow;
  float core = dot2(uv, vec2(0.0), hf.x*0.22) * (0.65 + 0.35*sin(t*4.0));
  return stream*0.5 + spokes*0.5 + core*1.2;
}

// 3 — SELECT: a row of cells; a frame steps along and locks onto one
float mSelect(vec2 uv, vec2 hf, float t){
  float K = 5.0;
  float u = (uv.x/hf.x*0.5+0.5)*K;                       // 0..K across the face
  float cell = floor(u);
  float inRow = step(abs(uv.y), hf.y*0.5);
  float sep = lineMask(abs(fract(u)-0.0), 0.06) * inRow;
  float sel = mod(floor(t*1.1), K);
  float on = step(abs(cell - sel), 0.5) * inRow;
  float box = on * (lineMask(abs(abs(uv.y)-hf.y*0.5),0.03) + lineMask(abs(fract(u)-0.5)-0.42,0.04));
  float fill = on * (0.25 + 0.2*sin(t*6.0));
  return sep*0.22 + box*1.0 + fill;
}

// 4 — GATE: a barrier with a gap; a pulse crosses, a check clears it
float mGate(vec2 uv, vec2 hf, float t){
  float barrier = lineMask(abs(uv.y), 0.02) * step(hf.x*0.22, abs(uv.x));
  float cyc = fract(t*0.4);
  float px = mix(-hf.x, hf.x, cyc);
  float pulse = exp(-pow((uv.x-px)/ (hf.x*0.12), 2.0)) * smoothstep(0.0,0.1,cyc);
  // a check mark flashes at the gap just after the pulse passes centre
  float ck = smoothstep(0.5,0.56,cyc) * (1.0 - smoothstep(0.72,0.8,cyc));
  vec2 c = uv / hf.x;
  float check = ck * (lineMask(sdSeg(c, vec2(-0.1,0.0), vec2(-0.02,-0.1)), 0.04)
                    + lineMask(sdSeg(c, vec2(-0.02,-0.1), vec2(0.16,0.12)), 0.04));
  return barrier*0.5 + pulse*0.8 + check*1.4;
}

// 5 — REPORT: rows fill left→right and stack up into a sheet
float mReport(vec2 uv, vec2 hf, float t){
  float rows = 4.0;
  float ry = (uv.y/hf.y*0.5+0.5)*rows;                   // 0..rows bottom→top
  float row = floor(ry);
  float within = step(0.18, fract(ry)) * step(fract(ry), 0.82);
  float loop = fract(t*0.18) * (rows + 1.5);
  float fill = clamp(loop - row, 0.0, 1.0);
  float ux = uv.x/hf.x*0.5+0.5;                          // 0..1 across
  float barLen = (row < rows-1.0) ? (0.55 + 0.35*sin(row*2.0)) : 0.4;
  float bar = step(ux, fill*barLen) * within * step(0.0, uv.y+hf.y) ;
  float edge = lineMask(abs(ux - fill*barLen), 0.02) * within * step(fill,0.999);
  return bar*0.7 + edge*0.9;
}

// 6 — SPLIT: one line enters from the left and branches to many outputs
float mSplit(vec2 uv, vec2 hf, float t){
  vec2 a = vec2(-hf.x*0.95, 0.0);
  vec2 hub = vec2(-hf.x*0.15, 0.0);
  float loop = fract(t*0.3);
  float trunk = segReveal(uv, a, hub, clamp(loop*2.0,0.0,1.0), 0.022);
  float m = trunk*0.8;
  float ends[4];
  ends[0]=0.62; ends[1]=0.22; ends[2]=-0.22; ends[3]=-0.62;
  for(int i=0;i<4;i++){
    vec2 e = vec2(hf.x*0.92, ends[i]*hf.y);
    float k = clamp(loop*2.0 - 1.0, 0.0, 1.0);
    m = max(m, segReveal(uv, hub, e, k, 0.02)*0.8);
    m = max(m, dot2(uv, e, 0.06) * smoothstep(0.9,1.0,k));
  }
  m = max(m, dot2(uv, hub, 0.06));
  return m;
}

// 7 — WAVE: a scrolling multi-frequency signal
float mWave(vec2 uv, vec2 hf, float t){
  float x = uv.x/hf.x;
  float y0 = 0.42*sin(x*3.2 + t*2.0) + 0.18*sin(x*8.0 - t*3.1) + 0.08*sin(x*17.0 + t*5.0);
  float y1 = 0.3*sin(x*2.4 - t*1.6 + 1.5);
  float m = lineMask(abs(uv.y - y0*hf.y), 0.03);
  m += lineMask(abs(uv.y - y1*hf.y), 0.02) * 0.4;
  float head = dot2(uv, vec2(hf.x*0.9, (0.42*sin(3.2+t*2.0))*hf.y), 0.07);
  return m + head;
}

float motif(int id, vec2 uv, vec2 hf, float t){
  if (id==0) return mRadar(uv,hf,t);
  if (id==1) return mGraph(uv,hf,t);
  if (id==2) return mIngest(uv,hf,t);
  if (id==3) return mSelect(uv,hf,t);
  if (id==4) return mGate(uv,hf,t);
  if (id==5) return mReport(uv,hf,t);
  if (id==6) return mSplit(uv,hf,t);
  return mWave(uv,hf,t);
}
`;
