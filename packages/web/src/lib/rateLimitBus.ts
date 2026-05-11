import mitt from "mitt";

export type RateLimitEvent = {
  resetAt: Date;
  used: number;
  limit: number;
};

export const rateLimitBus = mitt<{ rateLimit: RateLimitEvent }>();
