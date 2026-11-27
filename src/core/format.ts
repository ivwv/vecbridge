/**
 * 三端共享的数值格式化契约：DXF 坐标、SVG 属性与 viewBox 字符串都用它。
 *
 * 行为刻意与旧实现保持一致（`String(Number(n.toFixed(4)))`），包括：
 *  - 非有限值（NaN/Infinity）统一折叠为 "0"；
 *  - 去掉尾部多余的零（"1.5000" → "1.5"）；
 *  - 负零输出为 "0"。
 *
 * 额外防护：`Number.prototype.toFixed` 在 |n| >= 1e21 时会切到科学计数法，
 * 部分 DXF/SVG 解析器不接受这种写法，因此这类值改为展开成普通十进制整数。
 */

const SCIENTIFIC_THRESHOLD = 1e21;

/**
 * 把科学计数法形式的数字展开为普通十进制字符串。
 *
 * 例如 "1.23e+25" → "12300000000000000000000000"。做法是拆出尾数与指数，
 * 拼出全部数字位，再按小数点应落下的位置（intPart.length + exponent）
 * 分三种情况重组：小数点落在开头之前、落在末尾之后、落在数字中间。
 * 参数：n 为确定含 e/E 的数字（本函数由 fmtNumber 在阈值判断后调用）。
 * 返回：普通十进制表示，保留负号。
 */
function toPlainInteger(n: number): string {
  const text = n.toString();
  if (!/[eE]/.test(text)) return text;

  const [mantissa, exponentText] = text.split(/[eE]/);
  const exponent = Number(exponentText);
  const negative = mantissa.startsWith('-');
  const [intPart, fracPart = ''] = (negative ? mantissa.slice(1) : mantissa).split('.');
  const digits = intPart + fracPart;
  const pointPosition = intPart.length + exponent;

  let plain: string;
  if (pointPosition <= 0) {
    plain = `0.${'0'.repeat(-pointPosition)}${digits}`;
  } else if (pointPosition >= digits.length) {
    plain = digits + '0'.repeat(pointPosition - digits.length);
  } else {
    plain = `${digits.slice(0, pointPosition)}.${digits.slice(pointPosition)}`;
  }
  return negative ? `-${plain}` : plain;
}

/**
 * 把任意数值格式化为输出用的字符串。
 *
 * 参数：n 为待格式化的坐标/尺寸数值。
 * 返回：非有限值为 "0"；|n| >= 1e21 走普通十进制展开；
 *       其余走 `String(Number(n.toFixed(4)))`（4 位小数、去尾零、负零归零）。
 * 注意：【勿改·字节契约】三端共用，任何改动都会改变输出字节。
 */
export function fmtNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= SCIENTIFIC_THRESHOLD) return toPlainInteger(n);
  return String(Number(n.toFixed(4)));
}
