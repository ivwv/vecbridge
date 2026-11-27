/**
 * 填充图案（组合助手）层出口。
 *
 * `drawHatch` 只依赖 `DrawTarget` 鸭子接口（addLine/addCircle/addPolyline），
 * 因此它生成的图元可以进入任何图元目标——通常是 `DrawingDocument`，进而经由
 * DXF/SVG/Canvas 三端同源输出。纯计算、环境无关。
 */
export * from './hatch'; // drawHatch 及 9 种内置填充图案（HatchPattern）
