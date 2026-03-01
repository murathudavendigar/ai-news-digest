/**
 * devLog.js
 * Dev ortamında console.log/warn, prod'da sessiz.
 * console.error her zaman çalışır — bu dosyada yer almaz.
 */

const isDev = process.env.NODE_ENV !== "production";

export const devLog = isDev ? console.log.bind(console) : () => {};
export const devWarn = isDev ? console.warn.bind(console) : () => {};
