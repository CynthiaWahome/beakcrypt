import { PaginationResult } from "convex/server";

export interface SuccessResponse<T, D> {
  data: T;
  inputs: D;
  message: string;
  timestamp: number;
  error?: never;
}

export interface ErrorResponse<D> {
  inputs: D;
  error: string;
  timestamp: number;
  data?: never;
  message?: never;
}

export interface PaginatedSuccessResponse<T, D> extends SuccessResponse<T, D> {
  meta: Omit<PaginationResult<T extends Array<infer U> ? U : T>, "page">;
}

export type Response<T, D> = T extends unknown[]
  ? PaginatedSuccessResponse<T, D> | ErrorResponse<D>
  : SuccessResponse<T, D> | ErrorResponse<D>;
