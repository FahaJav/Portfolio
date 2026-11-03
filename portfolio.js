(() => {
  const universe = document.querySelector('#universe');
  const siteUi = document.querySelector('.site-ui');
  const panel = document.querySelector('#panel');
  const tooltip = document.querySelector('#tooltip');
  const navButtons = [...document.querySelectorAll('.nav button')];
  const planetButtons = [...document.querySelectorAll('.planet-button')];
  const sections = {
    about: {
      planet: 'earth', label: '01 — CREW PROFILE / EARTH', title: 'Crew Profile',
      body: 'I am Fahad Javed, a software engineer and developer specializing in Python, C, Rust, JavaScript, and 3D modeling with Blender. I build robust systems, interactive web applications, and creative tools.',
      extra: '<ul class="detail-list"><li><strong>Background</strong><span>Passionate about low-level programming, modern web development, and bridging code with immersive 3D design.</span></li><li><strong>Core Stack</strong><span>Python, Rust, C, JavaScript, HTML/CSS, Blender</span></li></ul>'
    },
    projects: {
      planet: 'jupiter', label: '02 — MISSIONS / JUPITER', title: 'Selected Missions',
      body: 'Explore my featured software projects, game systems, and utility tools.',
      extra: '<ul class="detail-list"><li><strong>Sudoku Game (CustomTkinter)</strong><span>An interactive Python puzzle game featuring real-time input validation (green for correct, red for error), clean custom UI themes, and elapsed-time tracking.</span></li><li><strong>FreeLLMApi</strong><span>An API integration service exploring seamless language model interactions and backend routing.</span></li><li><strong>Earth Rotation Command Center</strong><span>An immersive, orbital-mechanics-inspired interactive portfolio showcasing responsive space-themed design and 3D canvas textures.</span></li></ul>'
    },
    skills: {
      planet: 'mars', label: '03 — FLIGHT SYSTEMS / MARS', title: 'Flight Systems & Tech Stack',
      body: 'Core engineering capabilities and creative tools utilized in missions.',
      extra: '<ul class="detail-list"><li><strong>Python & Rust</strong><span>Scripting, backend logic, performance-critical systems, and desktop apps with CustomTkinter.</span></li><li><strong>C & Systems</strong><span>Low-level programming, memory management, and foundational computer science applications.</span></li><li><strong>JavaScript & Web</strong><span>Interactive client-side experiences, HTML5 canvas rendering, dynamic UI architectures, and DOM manipulation.</span></li><li><strong>Blender (3D Modeling)</strong><span>Creating assets, hard-surface modeling, and visual simulations.</span></li></ul>'
    },
    contact: {
      planet: 'neptune', label: '04 — OPEN COMMS / NEPTUNE', title: 'Open Comms',
      body: 'Let us connect for collaborations, development projects, or technical discussions.',
      extra: '<ul class="detail-list"><li><strong>GitHub</strong><span><a href="https://github.com/FahaJav" target="_blank" style="color: var(--hud-cyan); text-decoration: none;">github.com/FahaJav</a></span></li><li><strong>Direct Comms</strong><span>Available for software engineering inquiries, custom Python/Rust development, and creative 3D tech work.</span></li></ul>'
    }
  };
  let selectedSection = null;
  let selectedPlanet = null;
  let keyboardIndex = 0;
  let zoomSequence = 0;
  let pendingZoomCompletion = null;
  const planetRenderStates = new Map();
  const planetTextureCache = new Map();

  function setMenuCursor(index) {
    keyboardIndex = (index + navButtons.length) % navButtons.length;
    navButtons.forEach((button, i) => button.classList.toggle('is-cursor', i === keyboardIndex));
  }

  function createPlanetTexture(name) {
    const width = 1024, height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height), data = image.data;

    // Detailed realistic palettes and patterns
    const palettes = {
      mercury: { base: [120, 115, 110], high: [170, 165, 160], dark: [80, 75, 70] },
      venus: { base: [215, 160, 95], high: [240, 205, 140], dark: [160, 105, 50] },
      earth: { ocean: [20, 70, 150], land: [50, 140, 60], desert: [190, 160, 100], ice: [240, 240, 250], cloud: [255, 255, 255] },
      mars: { base: [180, 85, 45], high: [215, 120, 65], dark: [130, 50, 25], ice: [240, 240, 245] },
      jupiter: { bands: [[180, 140, 105], [220, 200, 170], [135, 95, 70], [200, 170, 130], [110, 70, 45]] },
      saturn: { bands: [[210, 190, 145], [235, 220, 185], [175, 150, 110], [220, 200, 160]] },
      uranus: { base: [140, 210, 225], high: [180, 235, 245], dark: [90, 150, 175] },
      neptune: { base: [40, 90, 210], high: [80, 140, 245], dark: [20, 50, 140], storm: [100, 180, 255] }
    };

        // Use multiple layers of noise for organic texture
        function getNoise(x, y, scale, octaves = 3) {
          let val = 0, freq = scale, amp = 1;
          for (let i = 0; i < octaves; i++) {
            val += Math.sin(x * freq) * Math.cos(y * freq) * amp;
            freq *= 2; amp *= 0.5;
          }
          return val;
        }

        // Inside the loop:
        const n = getNoise(x * 0.02, y * 0.02, 0.5);
        const detail = getNoise(x * 0.1, y * 0.1, 1.0);

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return ctx.getImageData(0, 0, width, height).data;
  }

  function loadPlanetTexture(name) {
    if (planetTextureCache.has(name)) return Promise.resolve(planetTextureCache.get(name));
    const pixels = createPlanetTexture(name);
    planetTextureCache.set(name, pixels);
    return Promise.resolve(pixels);
  }

  function stopPlanetRenderer(canvas) {
    const targets = canvas ? [canvas] : [...planetRenderStates.keys()];
    targets.forEach(target => {
      const state = planetRenderStates.get(target);
      if (!state) return;
      state.cancelled = true;
      cancelAnimationFrame(state.frame);
      state.handlers.forEach(([type, handler]) => target.removeEventListener(type, handler));
      planetRenderStates.delete(target);
    });
  }

  function startPlanetRenderer(canvas, name, size = 96) {
    if (!canvas) return;
    stopPlanetRenderer(canvas);
    const state = { frame: 0, cancelled: false, handlers: [] };
    planetRenderStates.set(canvas, state);
    const radius = size * .44, cx = size / 2, cy = size / 2;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const sphere = document.createElement('canvas');
    sphere.width = size; sphere.height = size;
    const sphereCtx = sphere.getContext('2d');
    const frame = sphereCtx.createImageData(size, size), output = frame.data;
    const normals = new Float32Array(size * size * 3);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const nx = (x + .5 - cx) / radius, ny = (cy - y - .5) / radius;
      const rr = nx * nx + ny * ny, i = (y * size + x) * 3;
      if (rr <= 1) {
        normals[i] = nx; normals[i + 1] = ny; normals[i + 2] = Math.sqrt(1 - rr);
      } else normals[i] = 2;
    }
    loadPlanetTexture(name).then(texture => {
      if (state.cancelled || planetRenderStates.get(canvas) !== state || !canvas.isConnected) return;
      let angle = 0, dragYaw = 0, pitch = 0, previous = 0;
      let dragging = false, dragX = 0, dragY = 0;
      const bind = (type, handler) => {
        canvas.addEventListener(type, handler);
        state.handlers.push([type, handler]);
      };
      bind('pointerdown', event => {
        event.preventDefault(); event.stopPropagation();
        dragging = true; dragX = event.clientX; dragY = event.clientY;
        canvas.classList.add('dragging'); canvas.setPointerCapture(event.pointerId);
      });
      bind('pointermove', event => {
        if (!dragging) return;
        dragYaw += (event.clientX - dragX) * .009;
        pitch = Math.max(-1.25, Math.min(1.25, pitch + (event.clientY - dragY) * .009));
        dragX = event.clientX; dragY = event.clientY;
      });
      const endDrag = event => {
        dragging = false; canvas.classList.remove('dragging');
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      };
      bind('pointerup', endDrag);
      bind('pointercancel', endDrag);
      bind('lostpointercapture', () => { dragging = false; canvas.classList.remove('dragging'); });
      const draw = time => {
        if (state.cancelled || planetRenderStates.get(canvas) !== state || !canvas.isConnected) return;
        const delta = Math.min((time - (previous || time)) / 1000, .05);
        previous = time;
        // Rotation only on their own axis (no revolution)
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) angle += delta * .24;
        const yaw = angle + dragYaw, cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
        const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 3, out = (y * size + x) * 4;
          if (normals[i] === 2) { output[out + 3] = 0; continue; }
          const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
          const rotatedX = nx * cosYaw + nz * sinYaw;
          const rotatedZ = -nx * sinYaw + nz * cosYaw;
          const rotatedY = ny * cosPitch - rotatedZ * sinPitch;
          const rotatedDepth = ny * sinPitch + rotatedZ * cosPitch;
          const lon = Math.atan2(rotatedX, rotatedDepth);
          const lat = Math.asin(Math.max(-1, Math.min(1, rotatedY)));
          const tx = Math.floor((((lon / (Math.PI * 2) + .5) * 512) % 512 + 512) % 512);
          const ty = Math.max(0, Math.min(255, Math.floor((.5 - lat / Math.PI) * 256)));
          const src = (ty * 512 + tx) * 4;
          const dot = -nx * .48 + ny * .38 + nz * .79;
          const light = .2 + .8 * Math.max(0, dot);
          output[out] = texture[src] * light;
          output[out + 1] = texture[src + 1] * light;
          output[out + 2] = texture[src + 2] * light;
          output[out + 3] = 255;
        }
        sphereCtx.putImageData(frame, 0, 0);
        ctx.clearRect(0, 0, size, size);
        const halo = ctx.createRadialGradient(cx, cy, radius * .82, cx, cy, size * .49);
        halo.addColorStop(0, 'rgba(82,165,255,0)');
        halo.addColorStop(.72, name === 'mars' ? 'rgba(255,135,92,.2)' : 'rgba(92,174,255,.2)');
        halo.addColorStop(1, 'rgba(82,165,255,0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, size * .49, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(sphere, 0, 0);
        const shine = ctx.createRadialGradient(cx * .72, cy * .62, 0, cx * .72, cy * .62, radius * 1.25);
        shine.addColorStop(0, 'rgba(255,255,255,.2)'); shine.addColorStop(.48, 'rgba(255,255,255,.055)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = shine;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = name === 'earth' ? 'rgba(140,211,255,.55)' : 'rgba(211,226,247,.27)';
        ctx.lineWidth = 1.5; ctx.stroke();
        state.frame = requestAnimationFrame(draw);
      };
      state.frame = requestAnimationFrame(draw);
    });
  }

  function revealScreen() {
    panel.classList.remove('screen-open');
    void panel.offsetWidth;
    panel.classList.add('screen-open');
  }

  function zoomToPlanet(name, scale, afterZoom) {
    if (pendingZoomCompletion) pendingZoomCompletion.cancel();
    const sequence = ++zoomSequence;
    const target = document.querySelector(`[data-planet="${name}"] .planet-body`) || document.querySelector(`[data-planet="${name}"]`);
    if (!target) return;
    universe.classList.add('is-zoomed');
    const transform = getComputedStyle(universe).transform;
    const matrix = transform === 'none' ? [1, 0, 0, 1, 0, 0] : transform.slice(7, -1).split(',').map(Number);
    const currentScale = Math.hypot(matrix[0], matrix[1]) || 1;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
    const worldX = (centerX - matrix[4]) / currentScale;
    const worldY = (centerY - matrix[5]) / currentScale;
    if (!scale) {
      const button = target.closest('.planet-button');
      const focusedScale = button?.classList.contains('is-focused') ? 1.35 : 1;
      const baseSize = parseFloat(getComputedStyle(target).width) || 24;
      scale = Math.min(innerWidth, innerHeight) * 1.08 / (baseSize * focusedScale);
    }
    const nextX = innerWidth / 2 - worldX * scale;
    const nextY = innerHeight / 2 - worldY * scale;
    universe.style.transform = `translate(${nextX}px, ${nextY}px) scale(${scale})`;
    if (afterZoom) {
      let fallback;
      const finish = event => {
        if (event && (event.target !== universe || event.propertyName !== 'transform')) return;
        if (sequence !== zoomSequence) return;
        pendingZoomCompletion?.cancel();
        pendingZoomCompletion = null;
        afterZoom();
      };
      const onTransitionEnd = event => finish(event);
      pendingZoomCompletion = {
        cancel: () => {
          universe.removeEventListener('transitionend', onTransitionEnd);
          clearTimeout(fallback);
        }
      };
      universe.addEventListener('transitionend', onTransitionEnd);
      fallback = setTimeout(() => finish(), 1500);
    }
  }
  function resetUniverse() {
    zoomSequence++;
    pendingZoomCompletion?.cancel();
    pendingZoomCompletion = null;
    universe.classList.remove('is-zoomed');
    universe.style.transform = 'none';
  }
  function selectSection(key, chosenPlanet) {
    const item = sections[key];
    if (!item) return;
    stopPlanetRenderer();
    selectedSection = key;
    selectedPlanet = chosenPlanet || item.planet;
    const menuIndex = navButtons.findIndex(button => button.dataset.section === key);
    if (menuIndex >= 0) setMenuCursor(menuIndex);
    siteUi.classList.add('is-zooming');
    navButtons.forEach(button => button.classList.toggle('active', button.dataset.section === key));
    planetButtons.forEach(button => button.classList.toggle('is-focused', button.dataset.planet === selectedPlanet));
    const selectedLabel = item.label.replace(/\/\s*[A-Z]+$/, `/ ${selectedPlanet.toUpperCase()}`);
    panel.innerHTML = `<div class="section-head"><div class="section-title"><div class="section-title-top"><p class="eyebrow">${selectedLabel}</p><button class="home-button" id="backHome">← System</button></div><h2>${item.title}</h2></div></div><p class="body-copy">${item.body}</p>${item.extra}`;
    document.querySelector('#backHome').addEventListener('click', goHome);
    const largeCanvas = document.querySelector(`[data-planet="${selectedPlanet}"] .orbit-planet`);
    startPlanetRenderer(largeCanvas, selectedPlanet, 520);
    zoomToPlanet(selectedPlanet, null, () => {
      siteUi.classList.remove('is-zooming');
      siteUi.classList.add('is-section');
      revealScreen();
    });
  }
  function goHome() {
    stopPlanetRenderer();
    selectedSection = null; selectedPlanet = null;
    resetUniverse();
    siteUi.classList.remove('is-section','is-zooming');
    navButtons.forEach(button => button.classList.remove('active'));
    setMenuCursor(0);
    planetButtons.forEach(button => button.classList.remove('is-focused'));
    planetButtons.forEach(button => startPlanetRenderer(button.querySelector('.orbit-planet'), button.dataset.planet, 96));
    panel.replaceChildren();
    panel.classList.remove('screen-open');
  }
  navButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectSection(button.dataset.section, button.dataset.target));
    button.addEventListener('focus', () => setMenuCursor(index));
  });
  setMenuCursor(0);
  document.addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    const menuFocused = navButtons.includes(document.activeElement);
    const otherControl = event.target.closest('button,a,[role="button"]') && !menuFocused;
    if (!selectedSection && !otherControl && ['s','w','S','W'].includes(event.key)) {
      event.preventDefault();
      const step = ['s','S'].includes(event.key) ? 1 : -1;
      setMenuCursor(keyboardIndex + step);
      navButtons[keyboardIndex].focus({preventScroll:true});
    } else if (!selectedSection && event.key === 'Enter' && document.activeElement === document.body) {
      event.preventDefault();
      navButtons[keyboardIndex].click();
    } else if (selectedSection && event.key === 'Escape') {
      event.preventDefault();
      goHome();
    }
  });
  planetButtons.forEach(button => {
    startPlanetRenderer(button.querySelector('.orbit-planet'), button.dataset.planet, 96);
    button.addEventListener('click', () => selectSection(button.dataset.section, button.dataset.planet));
  });
  document.querySelector('#sun').addEventListener('click', goHome);
})();
