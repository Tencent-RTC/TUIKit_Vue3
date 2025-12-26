/**
 * @module FreeBeautyConfigType
 * @description 基础美颜配置
 *
 * 提供自由美颜相关的配置选项。
 *
 * @example
 * import { FreeBeautyConfig } from '@tuikit-atomicx-vue3';
 *
 * const config: FreeBeautyConfig = {
 *   beautyLevel: 0.5,
 *   whitenessLevel: 0.5,
 *   ruddinessLevel: 0.5,
 * };
 */
export type FreeBeautyConfig = {
  beautyLevel: number;
  whitenessLevel: number;
  ruddinessLevel: number;
};

/**
 * 美颜风格
 * @enum {number}
 * @description 表示美颜风格。
 */
export enum TRTCBeautyStyle {
  TRTCBeautyStyleSmooth = 0,
  TRTCBeautyStyleNature = 1,
}
