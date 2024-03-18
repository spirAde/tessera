/* istanbul ignore file */

import axios, { AxiosError, AxiosInstance, AxiosResponse, Method, ResponseType } from 'axios';
import { RateLimiterMemory, RateLimiterQueue } from 'rate-limiter-flexible';

import { DesignSystemComponent, Project, ProjectPageStructure } from './types';
import {
  platformHost,
  projectSysName,
  projectPagesStatus,
  platformMaxRPS,
  platformMaxQueueSize,
  platformMaxRateLimitRetries,
  platformApiVersion,
  platformPassword,
  platformUserName,
} from '../../config';
import { logger } from '../../lib/logger';

type PlatformRequest = {
  url?: string;
  method: Method;
  path?: string;
  params?: any;
  data?: any;
  responseType?: ResponseType;
};

type PlatformAuthenticationContext = { accessToken: string | null; refreshToken: string | null };

const platformRateLimiterKey = 'platform';
const platformAuthenticationContext = createPlatformAuthenticationContext();
const platformRateLimiter = new RateLimiterMemory({
  points: platformMaxRPS,
  duration: 1, // one second
});
const platformRateLimiterQueue = new RateLimiterQueue(platformRateLimiter, {
  maxQueueSize: platformMaxQueueSize,
});

export async function fetchProject(): Promise<Project> {
  const project = await request({
    method: 'GET',
    path: `/project/${projectSysName}`,
  });

  if (!project) {
    throw new Error(`fetching error for project with projectSysName = ${projectSysName}`);
  }

  return project;
}

export async function fetchProjectPages(): Promise<{ id: number; url: string }[]> {
  const response = (await request({
    method: 'GET',
    path: `/sitepages/pages/list/raw?status=${projectPagesStatus}&projectSysName=${projectSysName}`,
  })) as { pages: { id: number; url: string }[] };

  return response.pages;
}

export async function fetchProjectPageStructure(pageId: number): Promise<ProjectPageStructure> {
  const projectPage = await request({
    method: 'GET',
    path: `/sitepages/pages/${pageId}/result`,
  });

  if (!projectPage) {
    throw new Error(`fetching error for page from platform with id = ${pageId}`);
  }

  return projectPage;
}

export async function fetchProjectDesignSystemComponents(
  designSystemId: number,
): Promise<DesignSystemComponent[]> {
  const response = (await request({
    method: 'GET',
    path: `/sitepages/design-systems/${designSystemId}/components/list`,
  })) as { components: DesignSystemComponent[] };

  return response.components;
}

export function fetchDesignSystemComponentSource(
  designSystemId: number,
  component: { name: string; version: string },
): Promise<string> {
  return request({
    method: 'GET',
    path: `/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
    responseType: 'text',
  });
}

export function fetchPageIdsUsingComponent(
  designSystemId: number,
  component: { name: string; version: string },
): Promise<number[]> {
  return request({
    method: 'GET',
    path: `/sitepages/page/list-by-component?designSystemId=${designSystemId}&componentName=${component.name}`,
  });
}

export async function authenticate(): Promise<void> {
  const response = await request({
    method: 'POST',
    path: '/useraccounts/credentials/login',
    data: {
      userName: platformUserName,
      password: platformPassword,
    },
  });

  updatePlatformAuthenticationContext(response);
}

async function refreshAccessToken() {
  try {
    const response = await request({
      method: 'POST',
      url: '/useraccounts/credentials/refresh-token',
      data: {
        token: platformAuthenticationContext.refreshToken,
      },
    });

    updatePlatformAuthenticationContext(response);
  } catch (error) {
    nullifyPlatformAuthenticationContext();
  }
}

async function request(options: PlatformRequest) {
  const response = await axiosRequest(options);
  return response.data || {};
}

async function axiosRequest(options: PlatformRequest): Promise<AxiosResponse> {
  const axiosInstance = applyAxiosPlatformRateLimiter(
    applyAxiosPlatformRefreshToken(axios.create()),
  );

  const requestParams = getPlatformAxiosRequestParams(options);

  logger.debug(
    requestParams.data,
    `[platform.sdk:axiosRequest] ${requestParams.method} ${requestParams.url}`,
  );

  try {
    const response = await axiosInstance(requestParams);

    logger.debug(response.data, '[platform.sdk:axiosRequest] success');

    return response;
  } catch (error) {
    logger.error(error, `[platform.sdk:axiosRequest] error`);
    throw error;
  }
}

function applyAxiosPlatformRateLimiter(axiosInstance: AxiosInstance): AxiosInstance {
  axiosInstance.interceptors.request.use(async (requestConfig) => {
    await platformRateLimiterQueue.removeTokens(1, platformRateLimiterKey);
    return requestConfig;
  });

  axiosInstance.interceptors.response.use(undefined, async (error) => {
    if (!isRetryableError(error)) {
      throw error;
    }

    const retry = (error.config.retry ?? 0) + 1;

    if (retry >= platformMaxRateLimitRetries) {
      logger.error(
        error,
        '[platform.sdk:request] failed with too many requests, retry limit exceeded',
        {
          retry,
        },
      );
      throw error;
    }

    logger.error(
      error,
      '[platform.sdk:request] failed with too many requests, blocking queue and retrying',
      {
        retryAfter: error.response.headers['retry-after'],
        retry,
      },
    );

    await platformRateLimiter.block(
      platformRateLimiterKey,
      Number(error.response.headers['retry-after']),
    );

    return axiosInstance({
      ...error.config,
      retry,
    });
  });

  return axiosInstance;
}

function applyAxiosPlatformRefreshToken(axiosInstance: AxiosInstance): AxiosInstance {
  axiosInstance.interceptors.response.use(undefined, async (error) => {
    if (isRefreshableError(error)) {
      return refreshAccessToken();
    }

    return Promise.reject(error);
  });

  return axiosInstance;
}

function getPlatformAxiosRequestParams(options: PlatformRequest) {
  const { method, path, data, params } = options;

  if (options.url) {
    return {
      method,
      data,
      url: options.url,
      headers: getRequestHeaders(),
    };
  }

  const url = `${platformHost}/api/${platformApiVersion}${path}`;

  return {
    method,
    url,
    params,
    headers: getRequestHeaders(),
    data,
  };
}

function getRequestHeaders() {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (platformAuthenticationContext.accessToken) {
    return {
      ...defaultHeaders,
      Authorization: `Bearer ${platformAuthenticationContext.accessToken}`,
    };
  }

  return defaultHeaders;
}

function isRefreshableError(error: AxiosError) {
  return (
    error.response?.status === 401 && typeof platformAuthenticationContext.refreshToken === 'string'
  );
}

function isRetryableError(error: any) {
  if (!error.config) {
    return false;
  }

  return Boolean(
    // must be a response error
    error.response &&
      // must be a rate limit error
      error.response.status === 429 &&
      // must have a Retry-After header
      error.response.headers['retry-after'],
  );
}

function createPlatformAuthenticationContext(): PlatformAuthenticationContext {
  return {
    accessToken: null,
    refreshToken: null,
  };
}

function updatePlatformAuthenticationContext(response: {
  accessToken?: string;
  refreshToken?: string;
}) {
  if ('accessToken' in response && typeof response.accessToken === 'string') {
    platformAuthenticationContext.accessToken = response.accessToken;
  }

  if ('refreshToken' in response && typeof response.refreshToken === 'string') {
    platformAuthenticationContext.refreshToken = response.refreshToken;
  }
}

function nullifyPlatformAuthenticationContext() {
  platformAuthenticationContext.accessToken = null;
  platformAuthenticationContext.refreshToken = null;
}
