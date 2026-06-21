const input = document.querySelector('#imageInput');
const pixelSize = document.querySelector('#pixelSize');
const colorCount = document.querySelector('#colorCount');
const pixelSizeValue = document.querySelector('#pixelSizeValue');
const colorCountValue = document.querySelector('#colorCountValue');
const gridToggle = document.querySelector('#gridToggle');
const grayscaleToggle = document.querySelector('#grayscaleToggle');
const canvas = document.querySelector('#preview');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const download = document.querySelector('#downloadButton');
let sourceImage = null;

function fitDimensions(width, height) {
  const max = 1200;
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function quantize(value, levels) {
  const steps = levels - 1;
  return Math.round(value / 255 * steps) * 255 / steps;
}

function render() {
  if (!sourceImage) return;
  const { width, height } = fitDimensions(sourceImage.naturalWidth, sourceImage.naturalHeight);
  const size = Number(pixelSize.value);
  const tiny = document.createElement('canvas');
  tiny.width = Math.max(1, Math.ceil(width / size));
  tiny.height = Math.max(1, Math.ceil(height / size));
  canvas.width = tiny.width * size;
  canvas.height = tiny.height * size;
  const tinyCtx = tiny.getContext('2d', { willReadFrequently: true });
  tinyCtx.drawImage(sourceImage, 0, 0, tiny.width, tiny.height);
  const pixels = tinyCtx.getImageData(0, 0, tiny.width, tiny.height);
  const levels = Number(colorCount.value);
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (grayscaleToggle.checked) {
      const luminance = Math.round(
        pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722,
      );
      pixels.data[i] = luminance;
      pixels.data[i + 1] = luminance;
      pixels.data[i + 2] = luminance;
    }
    pixels.data[i] = quantize(pixels.data[i], levels);
    pixels.data[i + 1] = quantize(pixels.data[i + 1], levels);
    pixels.data[i + 2] = quantize(pixels.data[i + 2], levels);
  }
  tinyCtx.putImageData(pixels, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, canvas.width, canvas.height);
  if (gridToggle.checked && size >= 5) {
    ctx.strokeStyle = 'rgba(0, 0, 0, .22)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += size) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += size) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(canvas.width, y + .5); ctx.stroke(); }
  }
  status.textContent = `${width} × ${height}px · 도트 크기 ${size}px · 색상 단계 ${levels}/채널`;
}

input.addEventListener('change', () => {
  const [file] = input.files;
  if (!file) return;
  const image = new Image();
  image.onload = () => { sourceImage = image; render(); download.disabled = false; };
  image.src = URL.createObjectURL(file);
});
pixelSize.addEventListener('input', () => { pixelSizeValue.value = pixelSize.value; render(); });
colorCount.addEventListener('input', () => { colorCountValue.value = colorCount.value; render(); });
gridToggle.addEventListener('change', render);
grayscaleToggle.addEventListener('change', render);
download.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'dot-graphic.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
