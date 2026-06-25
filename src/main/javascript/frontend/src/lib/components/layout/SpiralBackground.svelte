<script lang="ts">
  let spiralRef: HTMLDivElement;

  const cfg = {
    points: 700,
    dotRadius: 1.8,
    duration: 3.0,
    pulseEffect: true,
    opacityMin: 0.25,
    opacityMax: 0.9,
    sizeMin: 0.5,
    sizeMax: 1.4,
  };

  $effect(() => {
    if (!spiralRef) return;
    
    const SIZE = 560;
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const N = cfg.points;
    const DOT = cfg.dotRadius;
    const CENTER = SIZE / 2;
    const PADDING = 4;
    const MAX_R = CENTER - PADDING - DOT;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', String(SIZE));
    svg.setAttribute('height', String(SIZE));
    svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);

    for (let i = 0; i < N; i++) {
      const idx = i + 0.5;
      const frac = idx / N;
      const r = Math.sqrt(frac) * MAX_R;
      const theta = idx * GOLDEN_ANGLE;
      const x = CENTER + r * Math.cos(theta);
      const y = CENTER + r * Math.sin(theta);

      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', x.toFixed(3));
      c.setAttribute('cy', y.toFixed(3));
      c.setAttribute('r', String(DOT));
      c.setAttribute('fill', 'var(--spiral-color)');
      c.setAttribute('opacity', '1');

      if (cfg.pulseEffect) {
        const animR = document.createElementNS(svgNS, 'animate');
        animR.setAttribute('attributeName', 'r');
        animR.setAttribute(
          'values',
          `${DOT * cfg.sizeMin};${DOT * cfg.sizeMax};${DOT * cfg.sizeMin}`
        );
        animR.setAttribute('dur', `${cfg.duration}s`);
        animR.setAttribute('begin', `${(frac * cfg.duration).toFixed(3)}s`);
        animR.setAttribute('repeatCount', 'indefinite');
        animR.setAttribute('calcMode', 'spline');
        animR.setAttribute('keySplines', '0.4 0 0.6 1;0.4 0 0.6 1');
        c.appendChild(animR);

        const animO = document.createElementNS(svgNS, 'animate');
        animO.setAttribute('attributeName', 'opacity');
        animO.setAttribute(
          'values',
          `${cfg.opacityMin};${cfg.opacityMax};${cfg.opacityMin}`
        );
        animO.setAttribute('dur', `${cfg.duration}s`);
        animO.setAttribute('begin', `${(frac * cfg.duration).toFixed(3)}s`);
        animO.setAttribute('repeatCount', 'indefinite');
        animO.setAttribute('calcMode', 'spline');
        animO.setAttribute('keySplines', '0.4 0 0.6 1;0.4 0 0.6 1');
        c.appendChild(animO);
      }

      svg.appendChild(c);
    }

    spiralRef.innerHTML = '';
    spiralRef.appendChild(svg);
  });
</script>




<div class="absolute inset-0 w-full h-full flex items-center justify-center opacity-30 pointer-events-none" style=" mask-image: radial-gradient(circle at center, rgba(255,255,255,1), rgba(255,255,255,0.1) 60%, transparent 75%);">
  <div bind:this={spiralRef}></div>
</div>
