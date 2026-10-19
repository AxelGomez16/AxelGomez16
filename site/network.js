(() => {
  const canvas = document.querySelector('#network-background');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let nodes = [];
  let animationFrame = 0;
  let lastFrame = null;
  let phase = 0;

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const columns = Math.ceil(width / 90) + 2;
    nodes = [];
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const seed = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
        const offset = seed - Math.floor(seed);
        nodes.push({
          x: (column - 1) * 90 + offset * 65,
          y: height * (0.05 + row * 0.145) + Math.sin(column * 0.8 + row) * 52,
          offset,
          row,
          column,
        });
      }
    }
    draw();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const contentHalfWidth = Math.min(348, (width - 48) / 2);
    const positioned = nodes.map((node) => ({
      ...node,
      currentX: node.x + Math.sin(phase * 0.3 + node.offset * 8) * 20,
      currentY: node.y + Math.cos(phase * 0.22 + node.column * 0.6) * 24,
    }));
    function opacityAt(horizontal) {
      const distance = Math.abs(horizontal - width / 2);
      return distance < contentHalfWidth ? 0.045 : 0.18 + Math.min((distance - contentHalfWidth) / 200, 0.25);
    }
    for (const node of positioned) {
      const opacity = opacityAt(node.currentX);
      for (const neighbor of positioned) {
        if (neighbor.column < node.column || (neighbor.column === node.column && neighbor.row <= node.row)) continue;
        if (Math.abs(neighbor.row - node.row) > 1 || Math.abs(neighbor.column - node.column) > 1) continue;
        const directNeighbor = neighbor.row === node.row || neighbor.column === node.column;
        const distance = Math.hypot(node.currentX - neighbor.currentX, node.currentY - neighbor.currentY);
        if (!directNeighbor && distance > 190) continue;
        const strength = directNeighbor ? Math.max(0.15, 1 - distance / 230) : 1 - distance / 230;
        context.strokeStyle = `rgba(53, 162, 215, ${Math.min(opacity, opacityAt(neighbor.currentX)) * strength})`;
        context.lineWidth = 0.65;
        context.beginPath();
        context.moveTo(node.currentX, node.currentY);
        context.lineTo(neighbor.currentX, neighbor.currentY);
        context.stroke();
      }
      context.fillStyle = `rgba(111, 212, 249, ${opacity * 1.6})`;
      context.beginPath();
      context.arc(node.currentX, node.currentY, node.offset > 0.8 ? 1.8 : 0.9, 0, Math.PI * 2);
      context.fill();
    }
  }

  function animate(timestamp) {
    if (lastFrame === null) lastFrame = timestamp;
    const elapsed = timestamp - lastFrame;
    if (elapsed >= 1000 / 30) {
      phase += Math.min(elapsed, 100) / 1000;
      draw();
      lastFrame = timestamp;
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function updateAnimation() {
    cancelAnimationFrame(animationFrame);
    lastFrame = null;
    if (!document.hidden && !reducedMotion.matches) animationFrame = requestAnimationFrame(animate);
    else draw();
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', updateAnimation);
  reducedMotion.addEventListener('change', updateAnimation);
  resize();
  updateAnimation();
})();