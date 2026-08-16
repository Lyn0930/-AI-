/**
 * 注入 CSRF token 到 miaoda axiosForBackend
 *
 * miaoda 网关要求所有 /api/* 请求必带 `X-Suda-Csrf-Token` header（cookie
 * `suda-csrf-token` 自动带，但 SDK 不会自动加 header，所以后端 CSRF
 * 校验中间件一直返回 403 "csrf token not found in header"）。
 *
 * token 值由 miaoda 注入到 `window.csrfToken`。这个文件必须在
 * index.tsx 顶部 import（早于任何 api/ 模块）。
 */
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

declare global {
  interface Window {
    csrfToken?: string;
  }
}

// axiosForBackend 是 HttpClient 实例（同 axios-style API）；
// 在它身上挂请求拦截器后，所有用它发起的 server API 都会带 CSRF token。
(axiosForBackend as any).interceptors?.request?.use?.((config: any) => {
  const token =
    typeof window !== 'undefined' ? window.csrfToken : undefined;
  if (token) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      // axios v1 的 AxiosHeaders
      config.headers.set('X-Suda-Csrf-Token', token);
    } else {
      // 普通对象
      config.headers['X-Suda-Csrf-Token'] = token;
    }
  }
  return config;
});
